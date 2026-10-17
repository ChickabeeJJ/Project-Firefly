import { getCharacter, findVerse } from '../data/characters';
import { getEnemy } from '../data/enemies';
import type { Effect, EnemyMove, StageDef, StatusId, TargetRule, VerseDef } from '../data/types';
import { cloneCards, normalCount, normalizeHand } from './hand';
import { Rng } from './rng';
import {
  ARDOR_MAX, BASE_BEATS, CRIT_CHANCE, CRIT_MULT, DEF_CONSTANT, HAND_LIMIT, LANTERN,
  MOOD_ADV, MOOD_DISADV, RANK_MULT, STATUS_MULT, moodRelation,
} from './rules';
import { allyStats, enemyStats } from './stats';
import type { BattleEvent, Card, Intent, MergeStep, Phase, QueuedAction, Unit } from './types';

export interface AllySetup {
  charId: string;
  level: number;
  resonance: number;
}

export interface BattleSetup {
  stage: StageDef;
  team: AllySetup[];
  seed: number;
}

export interface PlanResult {
  ok: boolean;
  merges: MergeStep[];
}

interface Snapshot {
  hand: Card[];
  queue: QueuedAction[];
  fireflies: number;
  lanternHour: boolean;
}

const NO_PLAN: PlanResult = { ok: false, merges: [] };

/**
 * Authoritative battle simulation. It never touches rendering: planning calls mutate state
 * immediately (so the hand can animate) and resolveRound() returns the ordered events the
 * scene plays back.
 */
export class BattleEngine {
  readonly stage: StageDef;
  readonly units: Unit[] = [];
  hand: Card[] = [];
  queue: QueuedAction[] = [];
  round = 0;
  wave = 0;
  fireflies = 0;
  lanternHour = false;
  phase: Phase = 'planning';
  targetUid: string | null = null;
  fallen = 0;

  private readonly rng: Rng;
  private nextCid = 1;
  private undoStack: Snapshot[] = [];

  constructor(setup: BattleSetup) {
    this.stage = setup.stage;
    this.rng = new Rng(setup.seed);
    setup.team.forEach((m, i) => {
      const def = getCharacter(m.charId);
      const s = allyStats(def.base, m.level, m.resonance);
      this.units.push({
        uid: `a${i}`, side: 'ally', defId: def.id, name: def.name, mood: def.mood, level: m.level,
        maxHp: s.hp, hp: s.hp, atk: s.atk, def: s.def, shield: 0, ardor: 0, statuses: [], alive: true, slot: i,
      });
    });
  }

  // ---------------------------------------------------------------- queries

  get allies(): Unit[] {
    return this.units.filter((u) => u.side === 'ally');
  }

  get aliveAllies(): Unit[] {
    return this.units.filter((u) => u.side === 'ally' && u.alive);
  }

  /** Living enemies of the current wave. */
  get aliveEnemies(): Unit[] {
    return this.units.filter((u) => u.side === 'enemy' && u.alive && u.wave === this.wave);
  }

  get waveCount(): number {
    return this.stage.waves.length;
  }

  get beats(): number {
    return BASE_BEATS + (this.lanternHour ? LANTERN.bonusBeats : 0);
  }

  get beatsLeft(): number {
    return this.beats - this.queue.length;
  }

  get canUndo(): boolean {
    return this.phase === 'planning' && this.undoStack.length > 0;
  }

  get canLightLantern(): boolean {
    return this.phase === 'planning' && !this.lanternHour && this.fireflies >= LANTERN.capacity;
  }

  /** The round resolves once every Beat is spent or nothing is left to play. */
  get readyToResolve(): boolean {
    return this.phase === 'planning' && (this.beatsLeft <= 0 || this.hand.length === 0);
  }

  unit(uid: string): Unit | undefined {
    return this.units.find((u) => u.uid === uid);
  }

  verseOf(card: Card): VerseDef {
    return findVerse(card.verseId).verse;
  }

  // ---------------------------------------------------------------- lifecycle

  start(): BattleEvent[] {
    const ev: BattleEvent[] = [];
    this.spawnWave(0, ev);
    return this.beginRound(ev);
  }

  private spawnWave(index: number, ev: BattleEvent[]): void {
    this.wave = index;
    const ids = this.stage.waves[index];
    const uids: string[] = [];
    ids.forEach((id, i) => {
      const def = getEnemy(id);
      const s = enemyStats(def.base, this.stage.level);
      const uid = `e${index}_${i}`;
      uids.push(uid);
      this.units.push({
        uid, side: 'enemy', defId: def.id, name: def.name, mood: def.mood, level: this.stage.level,
        maxHp: s.hp, hp: s.hp, atk: s.atk, def: s.def, shield: 0,
        ardor: this.stage.rule === 'restlessDim' ? 2 : 0,
        statuses: [], alive: true, slot: i, wave: index, patternIndex: 0, intent: null, boss: def.boss,
      });
    });
    this.targetUid = uids[0] ?? null;
    ev.push({ t: 'waveSpawn', wave: index, uids });
  }

  private beginRound(ev: BattleEvent[]): BattleEvent[] {
    this.round++;
    this.queue = [];
    this.undoStack = [];
    this.lanternHour = false;
    ev.push({ t: 'roundStart', round: this.round });
    this.purgeFallen(ev);
    this.deal(ev);
    this.lightCards(ev);
    this.chooseIntents(ev);
    this.ensureTarget();
    this.phase = 'planning';
    return ev;
  }

  private purgeFallen(ev: BattleEvent[]): void {
    const dead = new Set(this.allies.filter((u) => !u.alive).map((u) => u.uid));
    if (dead.size === 0) return;
    const cids = this.hand.filter((c) => dead.has(c.ownerUid)).map((c) => c.cid);
    if (cids.length === 0) return;
    this.hand = this.hand.filter((c) => !dead.has(c.ownerUid));
    ev.push({ t: 'purge', cids, merges: normalizeHand(this.hand) });
  }

  private deal(ev: BattleEvent[]): void {
    const alive = this.aliveAllies;
    if (alive.length === 0) return;
    let guard = 40;
    while (normalCount(this.hand) < HAND_LIMIT && guard-- > 0) {
      const owner = this.rng.pick(alive);
      const def = getCharacter(owner.defId);
      const verse = this.rng.pick(def.verses);
      const card: Card = { cid: this.nextCid++, ownerUid: owner.uid, verseId: verse.id, rank: 1, lit: false, finale: false };
      const index = normalCount(this.hand);
      this.hand.splice(index, 0, card);
      ev.push({ t: 'dealCard', card: { ...card }, index, merges: normalizeHand(this.hand) });
    }
    for (const u of alive) {
      if (u.ardor < ARDOR_MAX) continue;
      if (this.hand.some((c) => c.finale && c.ownerUid === u.uid)) continue;
      const def = getCharacter(u.defId);
      const card: Card = { cid: this.nextCid++, ownerUid: u.uid, verseId: def.finale.id, rank: 1, lit: false, finale: true };
      this.hand.push(card);
      ev.push({ t: 'finaleCard', card: { ...card } });
    }
  }

  private lightCards(ev: BattleEvent[]): void {
    const count = LANTERN.lightsPerRound + (this.stage.rule === 'fireflyBloom' ? 1 : 0);
    for (let i = 0; i < count; i++) {
      if (this.hand.filter((c) => c.lit).length >= LANTERN.maxLitInHand) return;
      const candidates = this.hand.filter((c) => !c.finale && !c.lit);
      if (candidates.length === 0) return;
      const card = this.rng.pick(candidates);
      card.lit = true;
      ev.push({ t: 'light', cid: card.cid });
    }
  }

  private chooseIntents(ev: BattleEvent[]): void {
    const intents: Record<string, Intent | null> = {};
    for (const e of this.aliveEnemies) {
      const def = getEnemy(e.defId);
      const finale = e.ardor >= ARDOR_MAX;
      const move = finale ? def.finale : this.moveById(e.defId, def.pattern[(e.patternIndex ?? 0) % def.pattern.length]);
      let targetUid: string | undefined;
      if (move.effects.some((fx) => 'target' in fx && fx.target === 'enemy')) {
        targetUid = this.rng.pick(this.aliveAllies)?.uid;
      }
      const dmg = move.effects.find((fx) => fx.kind === 'damage') as Extract<Effect, { kind: 'damage' }> | undefined;
      let preview = 0;
      if (dmg) {
        const victim = targetUid ? this.unit(targetUid) : this.aliveAllies[0];
        if (victim) preview = this.previewDamage(e, victim, dmg.power) * (dmg.hits ?? 1);
      }
      e.intent = { moveId: move.id, name: move.name, kind: move.intent, targetUid, preview, finale };
      intents[e.uid] = e.intent;
    }
    ev.push({ t: 'intents', intents });
  }

  private moveById(enemyId: string, moveId: string): EnemyMove {
    const def = getEnemy(enemyId);
    if (def.finale.id === moveId) return def.finale;
    const m = def.moves.find((x) => x.id === moveId);
    if (!m) throw new Error(`Unknown move ${moveId} for ${enemyId}`);
    return m;
  }

  private ensureTarget(): void {
    const t = this.targetUid ? this.unit(this.targetUid) : undefined;
    if (!t || !t.alive || t.side !== 'enemy' || t.wave !== this.wave) {
      this.targetUid = this.aliveEnemies[0]?.uid ?? null;
    }
  }

  // ---------------------------------------------------------------- planning

  setTarget(uid: string): boolean {
    const u = this.unit(uid);
    if (!u || u.side !== 'enemy' || !u.alive || u.wave !== this.wave) return false;
    this.targetUid = uid;
    return true;
  }

  cast(cid: number, targetUid: string | null = this.targetUid): PlanResult {
    if (this.phase !== 'planning' || this.beatsLeft <= 0) return NO_PLAN;
    const index = this.hand.findIndex((c) => c.cid === cid);
    if (index < 0) return NO_PLAN;
    this.pushUndo();
    const [card] = this.hand.splice(index, 1);
    const merges = normalizeHand(this.hand);
    this.queue.push({ kind: 'cast', card: { ...card }, targetUid });
    return { ok: true, merges };
  }

  /** Moving a card spends a Beat; it is how the player engineers merges. */
  move(cid: number, toIndex: number): PlanResult {
    if (this.phase !== 'planning' || this.beatsLeft <= 0) return NO_PLAN;
    const from = this.hand.findIndex((c) => c.cid === cid);
    if (from < 0 || this.hand[from].finale) return NO_PLAN;
    const to = Math.max(0, Math.min(normalCount(this.hand) - 1, toIndex));
    if (to === from) return NO_PLAN;
    this.pushUndo();
    const [card] = this.hand.splice(from, 1);
    this.hand.splice(to, 0, card);
    const merges = normalizeHand(this.hand);
    this.queue.push({ kind: 'move', cid });
    return { ok: true, merges };
  }

  lightLantern(): boolean {
    if (!this.canLightLantern) return false;
    this.pushUndo();
    this.fireflies -= LANTERN.capacity;
    this.lanternHour = true;
    return true;
  }

  undo(): boolean {
    if (!this.canUndo) return false;
    const s = this.undoStack.pop()!;
    this.hand = s.hand;
    this.queue = s.queue;
    this.fireflies = s.fireflies;
    this.lanternHour = s.lanternHour;
    return true;
  }

  private pushUndo(): void {
    this.undoStack.push({
      hand: cloneCards(this.hand),
      queue: this.queue.map((q) => (q.kind === 'cast' ? { ...q, card: { ...q.card } } : { ...q })),
      fireflies: this.fireflies,
      lanternHour: this.lanternHour,
    });
  }

  // ---------------------------------------------------------------- resolution

  resolveRound(): BattleEvent[] {
    if (this.phase !== 'planning') return [];
    this.phase = 'resolving';
    const ev: BattleEvent[] = [];

    for (const action of this.queue) {
      if (action.kind === 'cast') this.performCast(action.card, action.targetUid, ev);
      if (this.checkEnd(ev)) return ev;
    }

    const actors = this.aliveEnemies.filter((e) => e.intent);
    for (const e of actors) {
      if (!e.alive) continue;
      this.performEnemyMove(e, ev);
      if (this.checkEnd(ev)) return ev;
    }

    this.endOfRound(ev);
    if (this.checkEnd(ev)) return ev;

    ev.push({ t: 'roundEnd', round: this.round });
    if (this.round >= this.stage.roundLimit) {
      this.phase = 'lost';
      ev.push({ t: 'defeat', reason: 'time' });
      return ev;
    }
    return this.beginRound(ev);
  }

  private performCast(card: Card, plannedTarget: string | null, ev: BattleEvent[]): void {
    const caster = this.unit(card.ownerUid)!;
    if (!caster.alive) {
      ev.push({ t: 'fizzle', casterUid: caster.uid, verseId: card.verseId });
      return;
    }
    const verse = this.verseOf(card);
    const mult = RANK_MULT[card.rank - 1] * (card.lit ? 1 + LANTERN.litBonus : 1);
    const focus = this.focusTargets(caster, verse.effects, plannedTarget);
    ev.push({ t: 'cast', casterUid: caster.uid, verseId: verse.id, rank: card.rank, lit: card.lit, finale: card.finale, targetUids: focus });

    for (const fx of verse.effects) this.applyEffect(caster, fx, mult, card.rank, plannedTarget, ev);

    if (caster.alive) {
      caster.ardor = card.finale ? 0 : Math.min(ARDOR_MAX, caster.ardor + 1);
      ev.push({ t: 'ardor', uid: caster.uid, value: caster.ardor });
    }
    if (card.lit) {
      this.fireflies = Math.min(LANTERN.capacity, this.fireflies + 1);
      ev.push({ t: 'firefly', casterUid: caster.uid, lantern: this.fireflies });
    }
  }

  private performEnemyMove(e: Unit, ev: BattleEvent[]): void {
    const intent = e.intent!;
    e.intent = null;
    if (this.hasStatus(e, 'daze')) {
      this.removeStatus(e, 'daze', ev);
      ev.push({ t: 'dazed', uid: e.uid });
      e.patternIndex = (e.patternIndex ?? 0) + (intent.finale ? 0 : 1);
      return;
    }
    const move = this.moveById(e.defId, intent.moveId);
    const focus = this.focusTargets(e, move.effects, intent.targetUid ?? null);
    ev.push({ t: 'enemyAct', uid: e.uid, moveId: move.id, name: move.name, kind: move.intent, finale: intent.finale, targetUids: focus });
    for (const fx of move.effects) this.applyEffect(e, fx, 1, 1, intent.targetUid ?? null, ev);
    if (e.alive) {
      if (intent.finale) e.ardor = 0;
      else {
        e.ardor = Math.min(ARDOR_MAX, e.ardor + 1);
        e.patternIndex = (e.patternIndex ?? 0) + 1;
      }
      ev.push({ t: 'ardor', uid: e.uid, value: e.ardor });
    }
  }

  private endOfRound(ev: BattleEvent[]): void {
    ev.push({ t: 'upkeep' });
    const living = this.units.filter((u) => u.alive && (u.side === 'ally' || u.wave === this.wave));
    for (const u of living) {
      const burn = this.getStatus(u, 'burn');
      if (burn && u.alive) {
        const amount = Math.max(1, Math.round(burn.potency));
        u.hp = Math.max(0, u.hp - amount);
        ev.push({ t: 'damage', sourceUid: null, targetUid: u.uid, amount, absorbed: 0, crit: false, adv: 0, hp: u.hp, shield: u.shield, dot: true });
        if (u.hp <= 0) this.kill(u, ev);
      }
      const regen = this.getStatus(u, 'regen');
      if (regen && u.alive) this.healUnit(u, regen.potency, ev, true);
    }
    for (const u of living) {
      if (!u.alive) continue;
      for (const s of [...u.statuses]) {
        s.turns--;
        if (s.turns <= 0) this.removeStatus(u, s.id, ev);
      }
    }
  }

  /** Returns true when the battle is over. Also advances waves. */
  private checkEnd(ev: BattleEvent[]): boolean {
    if (this.aliveAllies.length === 0) {
      this.phase = 'lost';
      ev.push({ t: 'defeat', reason: 'wiped' });
      return true;
    }
    if (this.aliveEnemies.length === 0) {
      ev.push({ t: 'waveClear', wave: this.wave });
      if (this.wave + 1 < this.waveCount) {
        this.spawnWave(this.wave + 1, ev);
        return false;
      }
      this.phase = 'won';
      ev.push({ t: 'victory', rounds: this.round, fallen: this.fallen });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- effects

  private opponents(u: Unit): Unit[] {
    return u.side === 'ally' ? this.aliveEnemies : this.aliveAllies;
  }

  private friends(u: Unit): Unit[] {
    return u.side === 'ally' ? this.aliveAllies : this.aliveEnemies;
  }

  private resolveTargets(caster: Unit, rule: TargetRule, planned: string | null): Unit[] {
    const opp = this.opponents(caster);
    const own = this.friends(caster);
    switch (rule) {
      case 'enemy': {
        const p = planned ? opp.find((u) => u.uid === planned) : undefined;
        if (p) return [p];
        if (opp.length === 0) return [];
        return [caster.side === 'ally' ? opp[0] : this.rng.pick(opp)];
      }
      case 'allEnemies':
        return opp;
      case 'randomEnemy':
        return opp.length ? [this.rng.pick(opp)] : [];
      case 'self':
        return caster.alive ? [caster] : [];
      case 'allAllies':
        return own;
      case 'woundedAlly': {
        if (own.length === 0) return [];
        return [own.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a))];
      }
    }
  }

  /** Units the presentation should focus on for a cast (first effect's targets). */
  private focusTargets(caster: Unit, effects: Effect[], planned: string | null): string[] {
    const first = effects.find((fx) => fx.kind !== 'snuff') as Exclude<Effect, { kind: 'snuff' }> | undefined;
    if (!first) return [];
    return this.resolveTargetsPreview(caster, first.target, planned).map((u) => u.uid);
  }

  /** Same as resolveTargets but never consumes randomness (for presentation only). */
  private resolveTargetsPreview(caster: Unit, rule: TargetRule, planned: string | null): Unit[] {
    const opp = this.opponents(caster);
    if (rule === 'enemy') {
      const p = planned ? opp.find((u) => u.uid === planned) : undefined;
      return p ? [p] : opp.slice(0, 1);
    }
    if (rule === 'randomEnemy') return opp;
    return this.resolveTargets(caster, rule, planned);
  }

  private applyEffect(caster: Unit, fx: Effect, mult: number, rank: number, planned: string | null, ev: BattleEvent[]): void {
    switch (fx.kind) {
      case 'damage': {
        const hits = fx.hits ?? 1;
        for (let h = 0; h < hits; h++) {
          for (const t of this.resolveTargets(caster, fx.target, planned)) {
            this.dealDamage(caster, t, caster.atk * fx.power * mult, ev);
          }
        }
        return;
      }
      case 'heal':
        for (const t of this.resolveTargets(caster, fx.target, planned)) this.healUnit(t, caster.atk * fx.power * mult, ev);
        return;
      case 'shield':
        for (const t of this.resolveTargets(caster, fx.target, planned)) {
          const amount = Math.round(caster.atk * fx.power * mult);
          t.shield = Math.min(t.maxHp, t.shield + amount);
          ev.push({ t: 'shield', targetUid: t.uid, amount, shield: t.shield });
        }
        return;
      case 'status': {
        const chance = fx.chance ? fx.chance[rank - 1] : 1;
        for (const t of this.resolveTargets(caster, fx.target, planned)) {
          if (!this.rng.chance(chance)) {
            ev.push({ t: 'resist', targetUid: t.uid, status: fx.status });
            continue;
          }
          const potency = fx.power ? caster.atk * fx.power * mult : 0;
          this.addStatus(t, fx.status, fx.turns, potency, ev);
        }
        return;
      }
      case 'ardor':
        for (const t of this.resolveTargets(caster, fx.target, planned)) {
          t.ardor = Math.min(ARDOR_MAX, t.ardor + fx.amount);
          ev.push({ t: 'ardor', uid: t.uid, value: t.ardor });
        }
        return;
      case 'snuff': {
        const before = this.fireflies;
        this.fireflies = Math.max(0, this.fireflies - fx.amount);
        ev.push({ t: 'snuff', sourceUid: caster.uid, amount: before - this.fireflies, lantern: this.fireflies });
        return;
      }
    }
  }

  /** Damage estimate without crits or variance (used for enemy intent chips). */
  previewDamage(src: Unit, tgt: Unit, power: number): number {
    return Math.max(1, Math.round(src.atk * power * this.damageFactor(src, tgt)));
  }

  private damageFactor(src: Unit, tgt: Unit): number {
    const rel = moodRelation(src.mood, tgt.mood);
    const mood = rel === 1 ? MOOD_ADV : rel === -1 ? MOOD_DISADV : 1;
    const might = this.hasStatus(src, 'might') ? 1 + STATUS_MULT.might : 1;
    const weak = this.hasStatus(src, 'weak') ? 1 - STATUS_MULT.weak : 1;
    const frail = this.hasStatus(tgt, 'frail') ? 1 + STATUS_MULT.frail : 1;
    const defF = DEF_CONSTANT / (DEF_CONSTANT + tgt.def);
    return mood * might * weak * frail * defF;
  }

  private dealDamage(src: Unit, tgt: Unit, raw: number, ev: BattleEvent[]): void {
    if (!tgt.alive) return;
    const crit = src.side === 'ally' && this.rng.chance(CRIT_CHANCE);
    const variance = this.rng.range(0.95, 1.05);
    const amount = Math.max(1, Math.round(raw * this.damageFactor(src, tgt) * (crit ? CRIT_MULT : 1) * variance));
    const absorbed = Math.min(tgt.shield, amount);
    tgt.shield -= absorbed;
    tgt.hp = Math.max(0, tgt.hp - (amount - absorbed));
    ev.push({
      t: 'damage', sourceUid: src.uid, targetUid: tgt.uid, amount, absorbed, crit,
      adv: moodRelation(src.mood, tgt.mood), hp: tgt.hp, shield: tgt.shield,
    });
    if (tgt.hp <= 0) this.kill(tgt, ev);
  }

  private healUnit(t: Unit, raw: number, ev: BattleEvent[], dot = false): void {
    if (!t.alive) return;
    const amount = Math.max(1, Math.round(raw));
    t.hp = Math.min(t.maxHp, t.hp + amount);
    ev.push({ t: 'heal', targetUid: t.uid, amount, hp: t.hp, dot });
  }

  private kill(u: Unit, ev: BattleEvent[]): void {
    u.alive = false;
    u.hp = 0;
    u.shield = 0;
    u.statuses = [];
    u.intent = null;
    if (u.side === 'ally') this.fallen++;
    ev.push({ t: 'death', uid: u.uid });
  }

  // ---------------------------------------------------------------- statuses

  hasStatus(u: Unit, id: StatusId): boolean {
    return u.statuses.some((s) => s.id === id);
  }

  private getStatus(u: Unit, id: StatusId) {
    return u.statuses.find((s) => s.id === id);
  }

  private addStatus(u: Unit, id: StatusId, turns: number, potency: number, ev: BattleEvent[]): void {
    if (!u.alive) return;
    const existing = this.getStatus(u, id);
    if (existing) {
      existing.turns = Math.max(existing.turns, turns);
      existing.potency = Math.max(existing.potency, potency);
    } else {
      u.statuses.push({ id, turns, potency });
    }
    ev.push({ t: 'status', targetUid: u.uid, status: id, turns });
  }

  private removeStatus(u: Unit, id: StatusId, ev: BattleEvent[]): void {
    const before = u.statuses.length;
    u.statuses = u.statuses.filter((s) => s.id !== id);
    if (u.statuses.length !== before) ev.push({ t: 'statusEnd', targetUid: u.uid, status: id });
  }
}
