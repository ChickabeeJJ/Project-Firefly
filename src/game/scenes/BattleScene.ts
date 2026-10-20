import Phaser from 'phaser';
import { dropIn, needArt } from '../art/assets';
import { FACE_POINTS, ensureBg, ensurePortrait, verseEmblem } from '../art/registry';
import { aliveTeam, currentNode, omen, runMods, stageFor } from '../systems/longnight';
import { audio } from '../audio/AudioController';
import { chooseAutoAction } from '../battle/autoplay';
import { describeEffects, describeVerse, STATUS_INFO, TYPE_LABEL } from '../battle/describe';
import { BattleEngine, type BattleScript } from '../battle/engine';
import { LANTERN } from '../battle/rules';
import type { BattleEvent, Card, MergeStep } from '../battle/types';
import { CHARACTERS, findVerse } from '../data/characters';
import { getEnemy } from '../data/enemies';
import { getStage } from '../data/stages';
import type { StageDef, StatusId } from '../data/types';
import { C, CSS, H, MOOD_COLOR, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { effectiveLevel, insightLabel } from '../systems/growth';
import { platform } from '../platform/PlatformAdapter';
import { applyBattleResult } from '../systems/progression';
import { BattleFx, FINALE_BANNER, finaleBannerFor } from '../ui/BattleFx';
import { CARD_DH, CARD_DW, CardView, HAND_SCALE } from '../ui/CardView';
import { Atmosphere, DiamondButton, fadeIn, goTo, text, toast } from '../ui/kit';
import { UnitView } from '../ui/UnitView';

export interface BattleData {
  stageId: string;
  /** A Long Night encounter: team, wounds and modifiers come from the run. */
  night?: boolean;
}

/** What a Long Night battle reports back to the map. */
export interface NightResult {
  won: boolean;
  hp: Record<string, number>;
}

export interface ResultData {
  stageId: string;
  won: boolean;
  reason?: 'wiped' | 'time';
  rounds: number;
  fallen: number;
  mvp: string;
  outcome: ReturnType<typeof applyBattleResult>;
}

const HAND_CX = 1010;
const HAND_Y = 950;
const HAND_DIP = 150;
const SLOT_Y = 196;
const SLOT_SCALE = 0.42;
const SLOT_GAP = 128;
const ALLY_POS = [{ x: 760, y: 746 }, { x: 510, y: 700 }, { x: 260, y: 758 }];
const ENEMY_POS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 1420, y: 742 }],
  2: [{ x: 1300, y: 738 }, { x: 1570, y: 712 }],
  3: [{ x: 1230, y: 746 }, { x: 1452, y: 702 }, { x: 1672, y: 754 }],
};
/** A gated tutorial step: only the matching action is allowed while it is shown. */
interface TutStep {
  msg: string;
  /** Where the bubble points; null = centred, no arrow. */
  at: (s: BattleScene) => { x: number; y: number; dir: 'down' | 'up' } | null;
  /** Card the player must cast; omitted for tap-to-continue and lantern steps. */
  card?: (c: Card) => boolean;
  lantern?: boolean;
  tap?: boolean;
  /** Area outlined for the player (defaults to the card or lantern the step asks for). */
  focus?: (s: BattleScene) => { x: number; y: number; w: number; h: number } | null;
}

/** Stage 1-1 for new players: a scripted, hand-held first battle. */
const TUTORIAL_SCRIPT: BattleScript = {
  hands: {
    1: ['wren_strike', 'odile_lullaby', 'wren_strike', 'bastian_brolly', 'odile_tincture', 'wren_kindle', 'bastian_bash'],
    2: ['wren_kindle', 'odile_tincture', 'bastian_brolly'],
  },
  lit: { 1: 'bastian_bash', 2: 'wren_kindle' },
  ardor: { 3: { wren: 5 } },
  fireflies: { 4: 5 },
  enemyHpMult: 2,
  noDefeat: true,
};

const TUTORIAL_HINTS = ['cast', 'beats', 'merge', 'firefly', 'finale', 'lantern', 'intent'];

const EFFECTS = new Set(['damage', 'heal', 'shield', 'status', 'resist', 'statusEnd', 'ardor', 'firefly', 'snuff', 'death']);

export class BattleScene extends Phaser.Scene {
  private engine!: BattleEngine;
  private stage!: StageDef;
  private views = new Map<string, UnitView>();
  private statusState = new Map<string, Map<StatusId, number>>();
  private cards = new Map<number, CardView>();
  private handOrder: number[] = [];
  private slotFrames: Phaser.GameObjects.Image[] = [];
  private slotItems: Phaser.GameObjects.GameObject[] = [];
  private fx!: BattleFx;
  private busy = true;
  private auto = false;
  /** Fighting a Long Night encounter. */
  night = false;
  private speed = 1;
  private ended = false;
  private resolveQueued = false;
  private roundText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private lantern!: Phaser.GameObjects.Container;
  private lanternPips: Phaser.GameObjects.Image[] = [];
  private lanternGlow!: Phaser.GameObjects.Image;
  private lanternLabel!: Phaser.GameObjects.Text;
  private castBanner!: Phaser.GameObjects.Container;
  private castTitle!: Phaser.GameObjects.Text;
  private castDesc!: Phaser.GameObjects.Text;
  private tooltip?: Phaser.GameObjects.Container;
  private unitTip?: Phaser.GameObjects.Container;
  private hint?: { id: string; c: Phaser.GameObjects.Container };
  private autoBtn!: DiamondButton;
  private speedBtn!: DiamondButton;
  private damageBy = new Map<string, number>();
  /** Remaining gated tutorial steps per round (1-1 only, until finished once). */
  private tutSteps: Record<number, TutStep[]> | null = null;
  private tutStep: TutStep | null = null;
  private tutBubble?: Phaser.GameObjects.Container;

  constructor() {
    super('Battle');
  }

  create(data: BattleData): void {
    this.views = new Map();
    this.statusState = new Map();
    this.cards = new Map();
    this.handOrder = [];
    this.slotFrames = [];
    this.slotItems = [];
    this.damageBy = new Map();
    this.busy = true;
    this.ended = false;
    this.resolveQueued = false;
    this.hint = undefined;
    this.tooltip = undefined;
    this.unitTip = undefined;
    this.lanternPips = [];
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.speed = 1;
    this.auto = false;
    this.tutStep = null;
    this.tutBubble = undefined;
    fadeIn(this);

    this.night = !!data.night && !!saves.get().night.run;
    const run = this.night ? saves.get().night.run! : null;
    const node = run ? currentNode(run) : undefined;
    this.stage = run && node ? stageFor(run, node) : getStage(data.stageId);
    const save = saves.get();
    const guided = !this.night && !!this.stage.tutorial && !saves.hasHint('tutorialDone');
    // The script needs the starter trio, so the guided battle always fields them.
    const team = guided ? ['wren', 'odile', 'bastian'] : run ? aliveTeam(run) : save.team;
    this.tutSteps = guided ? this.buildTutorial() : null;
    // The troupe's full art and Finale banners, for the cut-ins (fetched now if not already in).
    void needArt(this.game, team.flatMap((id) => {
      const ch = CHARACTERS.find((c) => c.id === id);
      const banner = FINALE_BANNER[id] ?? (ch ? finaleBannerFor(Phaser.Display.Color.HexStringToColor(ch.palette.primary).color) : 'gilt');
      return [`hf:characters/${id}`, `hf:ui/finale_${banner}`];
    }));
    this.engine = new BattleEngine({
      stage: this.stage,
      team: team.map((id) => {
        const o = save.roster[id] ?? { level: 1, insight: 0, resonance: 0 };
        return { charId: id, level: effectiveLevel(o), resonance: o.resonance, hpFrac: run ? run.hp[id] : 1 };
      }),
      seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0,
      script: guided ? TUTORIAL_SCRIPT : undefined,
      mods: run ? runMods(run, node) : undefined,
    });

    this.add.image(W / 2, H / 2, ensureBg(this, this.stage.bg)).setDisplaySize(W, H).setDepth(0);
    const fog = this.add.image(W / 2, 640, 'fx:glow').setDisplaySize(W * 1.6, 380).setTint(this.stage.bg === 'street' ? 0x8fa8a2 : 0xc8a888).setAlpha(0.08).setDepth(5);
    this.tweens.add({ targets: fog, x: W / 2 + 120, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.fx = new BattleFx(this);
    new Atmosphere(this, { depth: 140, fireflies: 6 });

    this.buildHud();
    this.setSpeed(1);
    this.engine.allies.forEach((u, i) => {
      const v = new UnitView(this, u, { ...ALLY_POS[i], scale: 0.85 });
      this.views.set(u.uid, v);
      this.bindUnitTip(v);
      v.setInteractive(() => this.flashUnitTip(u.uid));
      v.appear(i * 120);
    });

    this.input.dragDistanceThreshold = 22;
    this.input.keyboard?.on('keydown-ESC', () => this.openPause('pause'));
    this.input.keyboard?.on('keydown-SPACE', () => this.toggleAuto());

    audio.play(this.stage.boss ? 'boss' : 'battle');
    void this.intro();
  }

  // ===================================================================== HUD

  private buildHud(): void {
    // Thin, translucent strip like the reference: plain text over a soft dark gradient.
    const strip = this.add.graphics().setDepth(300);
    strip.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0, 0.55, 0);
    strip.fillRect(0, 30, 560, 104);
    this.add.rectangle(40, 86, 400, 1, 0xe8dcc0, 0.25).setOrigin(0, 0.5).setDepth(301);
    this.waveText = text(this, 44, 44, '', { size: 26, color: CSS.cream, spacing: 1 }).setDepth(301);
    this.roundText = text(this, 230, 44, '', { size: 26, color: CSS.cream, spacing: 1 }).setDepth(301);
    const intelLabel = text(this, 44, 110, 'Field Notes', { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5).setDepth(301);
    this.add.image(44 + intelLabel.width + 24, 110, 'icon:intel').setDisplaySize(28, 28).setDepth(301).setAlpha(0.8);
    this.add.zone(240, 90, 440, 110).setDepth(302).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { audio.sfx('tap'); this.openPause('intel'); });
    this.buildLighting();

    this.buildLantern();

    this.autoBtn = new DiamondButton(this, 1650, 76, 'auto', () => this.toggleAuto()).setDepth(300);
    this.speedBtn = new DiamondButton(this, 1750, 76, 'speed', () => this.setSpeed(this.speed === 1 ? 2 : 1)).setDepth(300);
    new DiamondButton(this, 1850, 76, 'pause', () => this.openPause('pause')).setDepth(300);
    text(this, 1650, 132, 'AUTO', { size: 22, font: 'display', bold: true, color: CSS.creamDim, spacing: 2 }).setOrigin(0.5).setDepth(300);
    text(this, 1750, 132, 'SPEED', { size: 22, font: 'display', bold: true, color: CSS.creamDim, spacing: 2 }).setOrigin(0.5).setDepth(300);
    // Remembered from the last fight (the guided first battle always starts by hand, at normal speed).
    if (!this.tutSteps) {
      const st = saves.get().settings;
      if (st.speed === 2) this.setSpeed(2);
      if (st.auto) {
        this.auto = true;
        this.autoBtn.setOn(true);
      }
    }

    const nr = this.night ? saves.get().night.run : null;
    const nn = nr ? currentNode(nr) : undefined;
    const nightOmen = nr && nn?.omen && !nr.keepsakes.includes('umbrella') ? omen(nn.omen) : null;
    if (this.stage.rule || nightOmen) {
      const rule = nightOmen ? { name: `Omen · ${nightOmen.name}`, desc: nightOmen.blurb } : this.stage.rule === 'fireflyBloom'
        ? { name: 'Firefly Bloom', desc: 'Two fireflies light your Verses each round.' }
        : { name: 'Restless Dim', desc: 'Enemies begin with 2 Ardor — Finales come early.' };
      const c = this.add.container(1700, 220).setDepth(300);
      const bg = this.add.nineslice(0, 0, 'ui:paper', undefined, 360, 112, 14, 14, 14, 14);
      c.add([bg, text(this, -160, -30, rule.name, { size: 26, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0, 0.5),
        text(this, -160, 14, rule.desc, { size: 22, color: CSS.paperSub, wrap: 320 }).setOrigin(0, 0.5)]);
    }

    this.castBanner = this.add.container(40, 870).setDepth(320).setAlpha(0);
    const cb = this.add.nineslice(0, 0, 'ui:dark', undefined, 660, 170, 12, 12, 12, 12).setOrigin(0);
    this.castTitle = text(this, 28, 22, '', { size: 34, font: 'display', bold: true, color: CSS.goldLight });
    this.castDesc = text(this, 28, 72, '', { size: 24, color: CSS.cream, wrap: 610, lineSpacing: 2 });
    this.castBanner.add([cb, this.castTitle, this.castDesc]);
    this.refreshRoundText();
  }

  /** Warm key light from the upper left, drifting dust in the shafts, darker floor (reference lighting). */
  private buildLighting(): void {
    const warm = this.stage.bg === 'docks' || this.stage.bg === 'clocktower' ? 0xbfd0e8 : 0xffd49a;
    for (let i = 0; i < 3; i++) {
      const ray = this.add.image(-120 + i * 260, -80, 'fx:beam').setOrigin(0, 0.5).setDepth(8)
        .setRotation(0.62 + i * 0.07).setDisplaySize(1500 + i * 200, 180 + i * 60).setTint(warm).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.09);
      this.tweens.add({ targets: ray, alpha: 0.16, duration: 4200 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const floor = this.add.graphics().setDepth(9);
    floor.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55);
    floor.fillRect(0, H * 0.72, W, H * 0.28);
    const sky = this.add.graphics().setDepth(9);
    sky.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0.35, 0, 0);
    sky.fillRect(0, 0, W, 180);
  }

  private buildLantern(): void {
    const c = this.add.container(110, 236).setDepth(300);
    this.lanternGlow = this.add.image(0, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(230, 230).setAlpha(0);
    const painted = dropIn(this, 'ui', 'lantern1');
    const icon = this.add.image(0, painted ? -10 : 0, painted ?? 'icon:summon');
    if (painted) icon.setScale(150 / icon.height);
    else icon.setDisplaySize(104, 104);
    c.add([this.lanternGlow, icon]);
    // Title, a row of firefly sockets, and the count, hung from the top of the lantern.
    const top = painted ? -10 - icon.displayHeight / 2 : -52;
    c.add(text(this, 64, top - 2, 'LANTERN', { size: 24, font: 'display', bold: true, color: CSS.cream, spacing: 3 }).setOrigin(0, 0));
    for (let i = 0; i < LANTERN.capacity; i++) {
      c.add(this.add.circle(80 + i * 34, top + 50, 11, 0x0b0c10, 0.45).setStrokeStyle(1, 0xe8dcc0, 0.35));
      const p = this.add.image(80 + i * 34, top + 50, 'fx:firefly').setScale(0.6);
      this.lanternPips.push(p);
      c.add(p);
    }
    this.lanternLabel = text(this, 64, top + 84, '', { size: 21, italic: true, color: CSS.firefly }).setOrigin(0, 0.5);
    c.add(this.lanternLabel);
    this.add.zone(c.x + 100, c.y, 330, 170).setDepth(302).setInteractive({ useHandCursor: true }).on('pointerup', () => this.tapLantern());
    this.lantern = c;
    this.refreshLantern();
  }

  private refreshLantern(): void {
    const n = this.engine.fireflies;
    this.lanternPips.forEach((p, i) => p.setAlpha(i < n ? 1 : 0).setTint(0xffffff));
    const full = n >= LANTERN.capacity;
    this.tweens.killTweensOf(this.lanternGlow);
    if (this.engine.lanternHour) {
      this.lanternGlow.setAlpha(0.9);
      this.lanternLabel.setText('Lantern Hour!');
    } else if (full) {
      this.lanternGlow.setAlpha(0.4);
      this.tweens.add({ targets: this.lanternGlow, alpha: 0.95, duration: 600, yoyo: true, repeat: -1 });
      this.lanternLabel.setText('Tap for +1 Beat');
    } else {
      this.lanternGlow.setAlpha(0.12 * n);
      this.lanternLabel.setText(`${n} / ${LANTERN.capacity} fireflies`);
    }
  }

  private refreshRoundText(): void {
    this.waveText.setText(`Wave: ${this.engine.wave + 1}/${this.engine.waveCount}`);
    this.roundText.setText(`Round: ${Math.max(1, this.engine.round)}/${this.stage.roundLimit}`);
  }

  // ===================================================================== flow

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private async intro(): Promise<void> {
    await this.wait(500);
    const events = this.engine.start();
    await this.playEvents(events);
    if (this.stage.tutorial) this.bark('a0', 'The lamps are going out. Let us light them back up!');
    if (this.stage.boss) this.bark('a0', 'Everything we have — all at once!');
    platform.gameplayStart();
    this.beginPlanning();
  }

  private beginPlanning(): void {
    this.busy = false;
    this.dipHand(false);
    this.buildSlots();
    this.refreshLantern();
    this.tutorial();
    if (this.auto) this.time.delayedCall(400, () => this.autoStep());
  }

  private canPlan(): boolean {
    return !this.busy && !this.ended && this.engine.phase === 'planning' && !this.resolveQueued;
  }

  private queueResolve(): void {
    if (!this.engine.readyToResolve || this.resolveQueued) return;
    this.resolveQueued = true;
    this.time.delayedCall(420, () => void this.resolve());
  }

  private async resolve(): Promise<void> {
    this.resolveQueued = false;
    if (this.busy || !this.engine.readyToResolve) return;
    this.busy = true;
    this.hideTooltip();
    this.hideUnitTip();
    if (this.hint) saves.markHint(this.hint.id);
    this.clearHint();
    this.clearTutBubble();
    this.dipHand(true);
    for (const it of this.slotItems) if (it.getData('move')) this.tweens.add({ targets: it, alpha: 0.25, duration: 200 });
    const events = this.engine.resolveRound();
    this.fx.setDim(0.38);
    await this.playEvents(events);
    this.fx.setDim(0);
    if (this.ended) return;
    this.beginPlanning();
  }

  private async playEvents(events: BattleEvent[]): Promise<void> {
    let i = 0;
    let castSlot = 0;
    while (i < events.length) {
      const e = events[i++];
      const effects: BattleEvent[] = [];
      while (i < events.length && EFFECTS.has(events[i].t)) effects.push(events[i++]);
      switch (e.t) {
        case 'cast':
        case 'fizzle':
          castSlot = this.nextCastSlot(castSlot);
          if (e.t === 'cast') await this.playCast(e, effects, castSlot);
          else this.consumeSlot(castSlot);
          castSlot++;
          break;
        case 'enemyAct':
          await this.playEnemy(e, effects);
          break;
        case 'dazed': {
          const v = this.views.get(e.uid);
          if (v) {
            v.pulseIntent();
            this.fx.label(v.center.x, v.top - 20, 'Dazed', '#c9a8f0');
          }
          await this.playEffects(effects);
          await this.wait(450);
          break;
        }
        case 'upkeep':
          await this.playEffects(effects, 140);
          break;
        case 'waveClear':
          this.consumeAllSlots();
          if (e.wave + 1 < this.engine.waveCount) await this.fx.banner(`WAVE ${e.wave + 2}`, 'The Dimming gathers again');
          break;
        case 'waveSpawn':
          this.spawnWave(e.uids);
          this.refreshRoundText();
          await this.wait(500);
          break;
        case 'roundStart':
          this.clearSlots();
          this.refreshRoundText();
          if (e.round > 1) this.flashRound(e.round);
          break;
        case 'purge':
          for (const cid of e.cids) this.removeCard(cid);
          this.applyMerges(e.merges);
          this.layoutHand();
          break;
        case 'dealCard': {
          const v = this.makeCard(e.card);
          v.setPosition(W + 160, HAND_Y + (this.busy ? HAND_DIP : 0));
          this.handOrder.splice(e.index, 0, e.card.cid);
          this.applyMerges(e.merges);
          this.layoutHand(260);
          audio.sfx('card');
          await this.wait(70);
          break;
        }
        case 'finaleCard': {
          const v = this.makeCard(e.card);
          v.setPosition(W + 160, HAND_Y);
          this.handOrder.push(e.card.cid);
          this.layoutHand(320);
          await this.wait(320);
          this.fx.glowAt(v.x, v.y, C.gold, 360);
          audio.sfx('merge');
          break;
        }
        case 'light': {
          const v = this.cards.get(e.cid);
          if (v) {
            await this.fx.flyFirefly(new Phaser.Math.Vector2(Phaser.Math.Between(300, 1600), -40), new Phaser.Math.Vector2(v.homeX, v.homeY - CARD_DH / 2), 650);
            v.update_({ lit: true });
            audio.sfx('firefly');
          }
          break;
        }
        case 'intents':
          for (const [uid, intent] of Object.entries(e.intents)) {
            const target = intent?.targetUid ? this.engine.unit(intent.targetUid) : undefined;
            this.views.get(uid)?.setIntent(intent, target?.defId);
          }
          this.syncStatuses();
          this.syncTarget();
          break;
        case 'victory':
          this.consumeAllSlots();
          await this.finish(true, e.rounds, e.fallen);
          return;
        case 'defeat':
          this.consumeAllSlots();
          await this.finish(false, this.engine.round, this.engine.fallen, e.reason);
          return;
        case 'roundEnd':
          this.consumeAllSlots();
          break;
        default:
          await this.playEffects([e, ...effects]);
      }
    }
  }

  private nextCastSlot(from: number): number {
    let k = from;
    while (k < this.slotItems.length && this.slotItems[k].getData('move')) k++;
    return k;
  }

  /** Any queued action that was cancelled (wave cleared, battle over) drops its card at once. */
  private consumeAllSlots(): void {
    this.slotItems.forEach((it, k) => {
      if (it && (it as Phaser.GameObjects.Container).alpha > 0.3) this.consumeSlot(k);
    });
  }

  private consumeSlot(k: number): void {
    const it = this.slotItems[k] as Phaser.GameObjects.Container | undefined;
    if (!it) return;
    this.tweens.add({ targets: it, alpha: 0, scale: (it.scale ?? 1) * 1.15, duration: 260 });
  }

  // ===================================================================== casts

  private async playCast(e: Extract<BattleEvent, { t: 'cast' }>, effects: BattleEvent[], slot: number): Promise<void> {
    const caster = this.views.get(e.casterUid);
    const { char, verse } = findVerse(e.verseId);
    if (!caster) return;
    const slotItem = this.slotItems[slot] as Phaser.GameObjects.Container | undefined;
    if (slotItem) {
      this.tweens.add({ targets: slotItem, scale: slotItem.scale * 1.25, duration: 120, yoyo: true });
      this.time.delayedCall(260, () => this.consumeSlot(slot));
    }
    if (e.finale) {
      audio.sfx('finale');
      await this.fx.cutIn(ensurePortrait(this, char.id), verse.name, char.name, char.title, Phaser.Display.Color.HexStringToColor(char.palette.primary).color, FACE_POINTS[char.id], FINALE_BANNER[char.id]);
      this.fx.shake(0.006, 260);
    }
    this.showCastBanner(verse.name + (e.rank > 1 ? '  ' + '★'.repeat(e.rank) : ''), describeVerse(verse, e.rank, e.lit), e.finale ? CSS.gold : CSS.goldLight);
    const mood = MOOD_COLOR[char.mood];
    caster.castPose();
    this.fx.ring(caster.x, caster.y, mood, 320, 600, true);
    this.fx.glowAt(caster.center.x, caster.center.y, mood, 260, 500);
    const hostile = verse.effects.some((fx) => fx.kind === 'damage');
    if (e.finale && e.targetUids.length > 0) {
      // Finales fire a volley of comets bearing the verse's emblem.
      const tos = e.targetUids.map((uid) => this.views.get(uid)?.center).filter((p): p is Phaser.Math.Vector2 => !!p);
      await this.fx.finaleVolley(caster.center, tos, mood, verseEmblem(this, verse), hostile);
    } else if (hostile && e.targetUids.length > 0) {
      const t = this.views.get(e.targetUids[0]);
      if (t) {
        await caster.lunge(t.x, verse.type === 'mass' ? 40 : 80);
        if (verse.type === 'mass' || e.targetUids.length > 1) {
          for (const uid of e.targetUids) {
            const tv = this.views.get(uid);
            if (tv) this.fx.beam(caster.center, tv.center, mood);
          }
        }
      }
    } else {
      await this.wait(220);
    }
    await this.playEffects(effects);
    await this.wait(260);
  }

  private async playEnemy(e: Extract<BattleEvent, { t: 'enemyAct' }>, effects: BattleEvent[]): Promise<void> {
    const v = this.views.get(e.uid);
    if (!v) return;
    v.pulseIntent();
    this.showCastBanner(e.name, `${v.unit.name}${e.finale ? ' unleashes its Finale' : ''}`, e.finale ? '#ff9a8a' : '#e8b0a0');
    audio.sfx('enemy');
    if (e.finale) {
      this.fx.flash(0xff3a2a, 260, 0.35);
      this.fx.shake(0.007, 300);
      await this.fx.banner(e.name.toUpperCase(), `${v.unit.name} — Finale`, '#ffb0a0');
    }
    this.fx.glowAt(v.center.x, v.center.y, 0x9a7cff, 300, 500);
    const hostile = e.kind === 'attack' || e.kind === 'mass' || e.kind === 'debuff';
    if (hostile && e.targetUids.length > 0) {
      const t = this.views.get(e.targetUids[0]);
      if (t) await v.lunge(t.x, e.kind === 'mass' ? 40 : 90);
    } else {
      await this.wait(240);
    }
    await this.playEffects(effects);
    await this.wait(280);
  }

  private async playEffects(effects: BattleEvent[], stagger = 95): Promise<void> {
    const deaths: Promise<void>[] = [];
    let advShown = false;
    let healSfx = false;
    for (const e of effects) {
      switch (e.t) {
        case 'damage': {
          const v = this.views.get(e.targetUid);
          if (!v) break;
          const src = e.sourceUid ? this.engine.unit(e.sourceUid) : undefined;
          const c = v.center;
          if (e.dot) {
            this.fx.glowAt(c.x, c.y, 0xff8a3a, 220, 400);
            this.fx.number(c.x, v.top - 10, e.amount, 'dot');
          } else {
            const color = src ? MOOD_COLOR[src.mood] : 0xffffff;
            this.fx.slash(c.x, c.y, src?.side === 'enemy' ? 0xb48cff : color, src?.side === 'ally', e.crit ? 1.4 : 1);
            this.fx.burst(c.x, c.y, e.crit ? C.gold : 0xfff2d8, e.crit ? 22 : 12);
            this.fx.number(c.x, v.top - 10, e.amount - e.absorbed, e.crit ? 'crit' : 'dmg');
            if (e.absorbed > 0) this.fx.number(c.x + 70, v.top + 30, e.absorbed, 'absorb');
            v.hitFlash(e.crit);
            audio.sfx(e.crit ? 'crit' : 'hit');
            if (e.crit) this.fx.shake(0.004, 140);
            if (!advShown && src?.side === 'ally' && e.adv !== 0) {
              advShown = true;
              this.fx.label(c.x, v.top - 70, e.adv === 1 ? 'Mood advantage' : 'Mood disadvantage', e.adv === 1 ? CSS.gold : CSS.muted);
            }
            if (e.sourceUid && src?.side === 'ally') this.damageBy.set(e.sourceUid, (this.damageBy.get(e.sourceUid) ?? 0) + e.amount);
          }
          v.setHp(e.hp, e.shield);
          await this.wait(stagger);
          break;
        }
        case 'heal': {
          const v = this.views.get(e.targetUid);
          if (!v) break;
          this.fx.number(v.center.x, v.top - 10, e.amount, 'heal');
          this.fx.rise(v.center.x, v.center.y + 40, C.heal, 14);
          v.setHp(e.hp, v.shield);
          if (!healSfx) audio.sfx('heal');
          healSfx = true;
          await this.wait(stagger * 0.6);
          break;
        }
        case 'shield': {
          const v = this.views.get(e.targetUid);
          if (!v) break;
          this.fx.ring(v.center.x, v.center.y, C.shield, 300, 500);
          this.fx.number(v.center.x, v.top - 10, e.amount, 'shield');
          v.setHp(v.hp, e.shield);
          audio.sfx('shield');
          await this.wait(stagger * 0.6);
          break;
        }
        case 'status': {
          const v = this.views.get(e.targetUid);
          if (!v) break;
          const info = STATUS_INFO[e.status];
          this.fx.label(v.center.x, v.top - 50, info.name, info.good ? CSS.gold : '#d8a8f0');
          this.statusOf(e.targetUid).set(e.status, e.turns);
          this.renderStatuses(e.targetUid);
          if (!info.good) audio.sfx('debuff');
          await this.wait(stagger * 0.5);
          break;
        }
        case 'resist': {
          const v = this.views.get(e.targetUid);
          if (v) this.fx.label(v.center.x, v.top - 50, 'Resisted', CSS.muted);
          break;
        }
        case 'statusEnd':
          this.statusOf(e.targetUid).delete(e.status);
          this.renderStatuses(e.targetUid);
          break;
        case 'ardor':
          this.views.get(e.uid)?.setArdor(e.value);
          break;
        case 'firefly': {
          const v = this.views.get(e.casterUid);
          if (v) {
            audio.sfx('firefly');
            void this.fx.flyFirefly(v.center, new Phaser.Math.Vector2(this.lantern.x, this.lantern.y), 800).then(() => {
              this.fx.glowAt(this.lantern.x, this.lantern.y, C.firefly, 200, 400);
              this.refreshLanternTo(e.lantern);
            });
          }
          break;
        }
        case 'snuff': {
          const v = this.views.get(e.sourceUid);
          audio.sfx('snuff');
          if (v) {
            this.fx.label(v.center.x, v.top - 40, e.amount > 0 ? `Snuffed ${e.amount} fireflies` : 'The Lantern is empty', '#e8e08a');
            for (let k = 0; k < e.amount; k++) {
              void this.fx.flyFirefly(new Phaser.Math.Vector2(this.lantern.x, this.lantern.y), v.center, 700 + k * 90);
            }
          }
          this.refreshLanternTo(e.lantern);
          await this.wait(400);
          break;
        }
        case 'death': {
          const v = this.views.get(e.uid);
          if (!v) break;
          audio.sfx('death');
          this.fx.rise(v.center.x, v.center.y, v.unit.side === 'enemy' ? 0xb48cff : 0xffffff, 26);
          this.statusOf(e.uid).clear();
          deaths.push(v.die());
          break;
        }
        default:
          break;
      }
    }
    await Promise.all(deaths);
    this.syncTarget();
  }

  private refreshLanternTo(n: number): void {
    // Visual count follows the event stream, not the (already final) engine state.
    const real = this.engine.fireflies;
    this.engine.fireflies = n;
    this.refreshLantern();
    this.engine.fireflies = real;
  }

  private statusOf(uid: string): Map<StatusId, number> {
    let m = this.statusState.get(uid);
    if (!m) {
      m = new Map();
      this.statusState.set(uid, m);
    }
    return m;
  }

  private renderStatuses(uid: string): void {
    const m = this.statusOf(uid);
    this.views.get(uid)?.setStatuses([...m.entries()].map(([id, turns]) => ({ id, turns })));
  }

  private syncStatuses(): void {
    for (const u of this.engine.units) {
      const m = this.statusOf(u.uid);
      m.clear();
      for (const s of u.statuses) m.set(s.id, s.turns);
      this.renderStatuses(u.uid);
      const v = this.views.get(u.uid);
      if (v && u.alive) {
        v.setArdor(u.ardor);
        v.setHp(u.hp, u.shield, false);
      }
    }
  }

  private showCastBanner(title: string, desc: string, color: string): void {
    this.castTitle.setText(title).setColor(color);
    this.castDesc.setText(desc);
    this.tweens.killTweensOf(this.castBanner);
    this.castBanner.setAlpha(0).setX(10);
    this.tweens.add({ targets: this.castBanner, alpha: 1, x: 40, duration: 180 });
    this.tweens.add({ targets: this.castBanner, alpha: 0, delay: 1700, duration: 300 });
  }

  private flashRound(round: number): void {
    const t = text(this, W / 2, 330, `ROUND ${round}`, { size: 44, font: 'display', bold: true, color: CSS.cream, spacing: 10, shadow: true }).setOrigin(0.5).setDepth(640).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 200, yoyo: true, hold: 500, onComplete: () => t.destroy() });
  }

  private spawnWave(uids: string[]): void {
    const pos = ENEMY_POS[uids.length] ?? ENEMY_POS[3];
    const seen = saves.get().seen;
    uids.forEach((uid, i) => {
      const u = this.engine.unit(uid)!;
      if (!seen.includes(u.defId)) seen.push(u.defId);
      const p = u.boss ? { x: 1440, y: 790 } : pos[i];
      const v = new UnitView(this, u, { ...p, scale: u.boss ? 0.95 : 0.85 });
      v.setInteractive(() => {
        this.tapEnemy(uid);
        this.flashUnitTip(uid);
      });
      this.bindUnitTip(v);
      this.views.set(uid, v);
      v.appear(i * 140);
    });
    this.syncTarget();
  }

  private syncTarget(): void {
    for (const [uid, v] of this.views) {
      if (v.unit.side !== 'enemy') continue;
      const alive = this.engine.unit(uid)?.alive && v.unit.wave === this.engine.wave;
      v.setTargeted(!!alive && uid === this.engine.targetUid);
    }
  }

  // ===================================================================== unit tooltip

  private bindUnitTip(v: UnitView): void {
    v.hit.on('pointerover', () => this.showUnitTip(v.unit.uid));
    v.hit.on('pointerout', (p: Phaser.Input.Pointer) => {
      // Lifting a finger counts as "out"; keep the timed tip visible on touch screens.
      if (!p.wasTouch) this.hideUnitTip();
    });
  }

  private flashUnitTip(uid: string): void {
    this.showUnitTip(uid);
    const tip = this.unitTip;
    this.time.delayedCall(2600, () => {
      if (this.unitTip === tip) this.hideUnitTip();
    });
  }

  private showUnitTip(uid: string): void {
    this.hideUnitTip();
    const u = this.engine.unit(uid);
    const v = this.views.get(uid);
    if (!u || !v || !u.alive) return;
    const lines: { s: string; color: string; size?: number }[] = [];
    lines.push({ s: `HP ${u.hp} / ${u.maxHp}${u.shield > 0 ? `   ·   Shield ${u.shield}` : ''}`, color: CSS.cream });
    lines.push({ s: `Ardor ${u.ardor} / 5${u.side === 'ally' ? (u.ardor >= 5 ? ' — Finale ready' : '') : u.ardor >= 5 ? ' — Finale next!' : ''}`, color: CSS.goldLight });
    if (u.statuses.length) lines.push({ s: u.statuses.map((st) => `${STATUS_INFO[st.id].name} (${st.turns})`).join('   '), color: '#d8a8f0' });
    if (u.side === 'enemy' && u.intent) {
      const def = getEnemy(u.defId);
      const move = u.intent.finale ? def.finale : def.moves.find((m) => m.id === u.intent!.moveId)!;
      const target = u.intent.targetUid ? this.engine.unit(u.intent.targetUid)?.name.split(' ')[0] : undefined;
      lines.push({ s: `Next: ${move.name}${target ? ` → ${target}` : ''}`, color: u.intent.finale ? '#ffb0a0' : CSS.cream });
      lines.push({ s: describeEffects(move.effects).join(' '), color: CSS.creamDim, size: 22 });
    }
    const c = this.add.container(0, 0).setDepth(720);
    const w = 500;
    const own = u.side === 'ally' ? saves.get().roster[u.defId] : undefined;
    const lvTxt = own ? `${insightLabel(own.insight)} Lv ${own.level}` : `Lv ${u.level}`;
    const title = text(this, 24, 18, `${u.name}  ·  ${lvTxt}`, { size: 28, font: 'display', bold: true, color: u.side === 'enemy' ? '#f0b8a8' : CSS.goldLight });
    c.add(title);
    let y = 18 + title.height + 6;
    for (const l of lines) {
      const t = text(this, 24, y, l.s, { size: l.size ?? 24, color: l.color, wrap: w - 48 });
      c.add(t);
      y += t.height + 4;
    }
    const bg = this.add.nineslice(0, 0, 'ui:dark', undefined, w, y + 16, 12, 12, 12, 12).setOrigin(0);
    c.addAt(bg, 0);
    const x = u.side === 'enemy' ? v.homeX - w - 120 : v.homeX + 120;
    c.setPosition(Phaser.Math.Clamp(x, 20, W - w - 20), Phaser.Math.Clamp(v.homeY - v.height - 20, 150, 700));
    this.unitTip = c;
  }

  private hideUnitTip(): void {
    this.unitTip?.destroy();
    this.unitTip = undefined;
  }

  // ===================================================================== hand

  private handPos(i: number, n: number): { x: number; y: number } {
    const spacing = Math.min(176, 1560 / Math.max(1, n));
    return { x: HAND_CX + (i - (n - 1) / 2) * spacing, y: HAND_Y };
  }

  private layoutHand(duration = 220): void {
    const n = this.handOrder.length;
    this.handOrder.forEach((cid, i) => {
      const v = this.cards.get(cid);
      if (!v) return;
      const p = this.handPos(i, n);
      v.homeX = p.x;
      v.homeY = p.y;
      v.setDepth(200 + i);
      this.tweens.killTweensOf(v);
      this.tweens.add({ targets: v, x: p.x, y: p.y + (this.busy ? HAND_DIP : 0), scale: HAND_SCALE, alpha: 1, duration, ease: 'Cubic.easeOut' });
    });
  }

  private dipHand(down: boolean): void {
    for (const cid of this.handOrder) {
      const v = this.cards.get(cid);
      if (!v) continue;
      this.tweens.killTweensOf(v);
      this.tweens.add({ targets: v, y: v.homeY + (down ? HAND_DIP : 0), alpha: down ? 0.75 : 1, duration: 260, ease: 'Cubic.easeOut' });
    }
  }

  private makeCard(card: Card): CardView {
    const owner = this.engine.unit(card.ownerUid)!;
    const v = new CardView(this, W + 200, HAND_Y, card, owner.defId).setScale(HAND_SCALE);
    this.cards.set(card.cid, v);
    v.setInteractive({ useHandCursor: true, draggable: true });
    v.on('pointerdown', () => {
      v.setData('dragged', false);
      v.setData('downAt', this.time.now);
      if (this.canPlan()) this.showTooltip(v);
    });
    v.on('pointerover', () => {
      if (!this.canPlan() || !this.handOrder.includes(v.cid)) return;
      this.tweens.killTweensOf(v);
      this.tweens.add({ targets: v, x: v.homeX, y: v.homeY - 30, scale: HAND_SCALE, duration: 120 });
      v.setSelected(true);
      this.showTooltip(v);
    });
    v.on('pointerout', () => {
      v.setSelected(false);
      if (v.getData('dragged') || !this.handOrder.includes(v.cid)) return;
      this.tweens.killTweensOf(v);
      this.tweens.add({ targets: v, x: v.homeX, y: v.homeY + (this.busy ? HAND_DIP : 0), scale: HAND_SCALE, duration: 140 });
      this.hideTooltip();
    });
    v.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (v.getData('dragged')) return;
      this.hideTooltip();
      // On touch screens a long press is for reading the card, not casting it.
      if (p.wasTouch && this.time.now - (v.getData('downAt') ?? 0) > 450) return;
      this.tapCard(v.cid);
    });
    v.on('dragstart', () => {
      if (!this.canPlan() || v.card.finale || !this.handOrder.includes(v.cid) || this.tutStep) return;
      v.setData('dragged', true);
      this.hideTooltip();
      this.tweens.killTweensOf(v);
      v.setDepth(400);
      this.tweens.add({ targets: v, scale: HAND_SCALE * 1.1, duration: 120 });
    });
    v.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
      if (!v.getData('dragged')) return;
      v.setPosition(x, y);
    });
    v.on('dragend', () => {
      if (!v.getData('dragged')) return;
      this.dropCard(v);
    });
    return v;
  }

  private removeCard(cid: number): void {
    const v = this.cards.get(cid);
    this.handOrder = this.handOrder.filter((c) => c !== cid);
    this.cards.delete(cid);
    if (v) this.tweens.add({ targets: v, alpha: 0, y: v.y + 80, duration: 240, onComplete: () => v.destroy() });
  }

  private applyMerges(steps: MergeStep[]): void {
    for (const m of steps) {
      const keep = this.cards.get(m.keep);
      const gone = this.cards.get(m.remove);
      this.handOrder = this.handOrder.filter((c) => c !== m.remove);
      this.cards.delete(m.remove);
      if (keep) {
        keep.update_({ rank: m.rank as Card['rank'], lit: m.lit });
        this.time.delayedCall(200, () => keep.mergeFlash());
      }
      if (gone && keep) {
        gone.disableInteractive();
        this.tweens.killTweensOf(gone);
        this.tweens.add({ targets: gone, x: keep.homeX || keep.x, y: keep.homeY || keep.y, alpha: 0, scale: HAND_SCALE * 0.8, duration: 220, onComplete: () => gone.destroy() });
      } else {
        gone?.destroy();
      }
      audio.sfx('merge');
    }
  }

  private mergeHint(): void {
    this.time.delayedCall(260, () => this.showHint('merge', 'Identical Verses side by side merge into a stronger rank. Casting the card between two twins merges them for free!', HAND_CX, HAND_Y - CARD_DH / 2 - 20, 'down', 5500));
  }

  private showTooltip(v: CardView): void {
    this.hideTooltip();
    const { char, verse } = findVerse(v.card.verseId);
    const c = this.add.container(0, 0).setDepth(700);
    const w = 560;
    const title = text(this, 0, 0, verse.name, { size: 32, font: 'display', bold: true, color: v.card.finale ? CSS.gold : CSS.goldLight });
    const meta = text(this, 0, 0, `${char.name}  ·  ${v.card.finale ? 'Finale' : TYPE_LABEL[verse.type]}  ·  ${'★'.repeat(v.card.rank)}`, { size: 22, color: CSS.creamDim });
    const desc = text(this, 0, 0, describeVerse(verse, v.card.rank, v.card.lit), { size: 24, color: CSS.cream, wrap: w - 48, lineSpacing: 2 });
    const h = 40 + title.height + meta.height + desc.height + 24;
    const bg = this.add.nineslice(0, 0, 'ui:dark', undefined, w, h, 12, 12, 12, 12).setOrigin(0);
    title.setPosition(24, 18);
    meta.setPosition(24, 18 + title.height + 2);
    desc.setPosition(24, 30 + title.height + meta.height);
    c.add([bg, title, meta, desc]);
    const x = Phaser.Math.Clamp(v.homeX - w / 2, 20, W - w - 20);
    c.setPosition(x, v.homeY - CARD_DH / 2 - h - 34);
    this.tooltip = c;
  }

  private hideTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = undefined;
  }

  // ===================================================================== planning

  private tapCard(cid: number): void {
    if (!this.canPlan() || !this.handOrder.includes(cid)) return;
    const v = this.cards.get(cid);
    if (v && !this.tutAllows(v.card)) return;
    const res = this.engine.cast(cid, this.engine.targetUid);
    if (!res.ok || !v) {
      audio.sfx('deny');
      return;
    }
    audio.sfx('card');
    this.handOrder = this.handOrder.filter((c) => c !== cid);
    this.putInSlot(v, this.engine.queue.length - 1);
    this.applyMerges(res.merges);
    this.layoutHand();
    this.completeHint('cast');
    if (v.card.lit) this.completeHint('firefly');
    if (v.card.finale) this.completeHint('finale');
    if (res.merges.length && !this.tutSteps) this.mergeHint();
    this.tutAdvance();
    this.afterPlan();
  }

  private dropCard(v: CardView): void {
    const normal = this.handOrder.filter((cid) => !this.cards.get(cid)?.card.finale);
    const from = this.handOrder.indexOf(v.cid);
    let best = from;
    let bestD = Infinity;
    normal.forEach((_cid, i) => {
      const d = Math.abs(this.handPos(i, this.handOrder.length).x - v.x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    this.time.delayedCall(30, () => v.setData('dragged', false));
    if (best === from || !this.canPlan()) {
      this.layoutHand(180);
      return;
    }
    const res = this.engine.move(v.cid, best);
    if (!res.ok) {
      audio.sfx('deny');
      this.layoutHand(180);
      return;
    }
    audio.sfx('card');
    this.handOrder.splice(from, 1);
    this.handOrder.splice(best, 0, v.cid);
    this.addMoveToken(this.engine.queue.length - 1);
    this.layoutHand(200);
    this.applyMerges(res.merges);
    this.completeHint('move');
    if (res.merges.length) this.mergeHint();
    this.afterPlan();
  }

  private tapEnemy(uid: string): void {
    if (this.ended) return;
    if (this.engine.setTarget(uid)) {
      audio.sfx('tap');
      this.syncTarget();
      this.completeHint('intent');
    }
  }

  private tapLantern(): void {
    if (!this.canPlan()) return;
    if (this.tutStep && !this.tutStep.lantern) {
      this.tutNudge();
      return;
    }
    if (!this.engine.lightLantern()) {
      if (!this.engine.lanternHour) toast(this, `The Lantern needs ${LANTERN.capacity} fireflies`, 'firefly');
      audio.sfx('deny');
      return;
    }
    audio.sfx('lantern');
    this.fx.flash(C.firefly, 400, 0.25);
    for (let i = 0; i < 18; i++) {
      void this.fx.flyFirefly(new Phaser.Math.Vector2(this.lantern.x, this.lantern.y), new Phaser.Math.Vector2(Phaser.Math.Between(200, 1700), Phaser.Math.Between(150, 800)), 900 + i * 40);
    }
    void this.fx.banner('LANTERN HOUR', 'An extra Beat this round', CSS.firefly);
    this.completeHint('lantern');
    this.tutAdvance();
    this.buildSlots();
    this.refreshLantern();
    this.afterPlan();
  }

  private afterPlan(): void {
    this.refreshSlotHighlight();
    this.refreshLantern();
    if (this.engine.readyToResolve) this.queueResolve();
  }

  private undoAll(): void {
    if (!this.canPlan() || this.tutStep || !this.engine.undo()) return;
    while (this.engine.undo()) { /* unwind the whole plan */ }
    audio.sfx('back');
    this.rebuildPlan();
  }

  /** Recreates hand + slot views from engine state (used after undo). */
  private rebuildPlan(): void {
    for (const v of this.cards.values()) v.destroy();
    this.cards.clear();
    for (const it of this.slotItems) it.destroy();
    this.slotItems = [];
    this.handOrder = this.engine.hand.map((c) => c.cid);
    for (const c of this.engine.hand) this.makeCard(c).setPosition(HAND_CX, HAND_Y);
    this.buildSlots();
    this.engine.queue.forEach((q, i) => {
      if (q.kind === 'cast') {
        const v = this.makeCard(q.card);
        this.putInSlot(v, i, false);
      } else this.addMoveToken(i);
    });
    this.layoutHand(120);
    this.refreshSlotHighlight();
    this.refreshLantern();
  }

  // ===================================================================== slots

  private slotPos(k: number): { x: number; y: number } {
    return { x: W / 2 + (k - (this.engine.beats - 1) / 2) * SLOT_GAP, y: SLOT_Y };
  }

  private buildSlots(): void {
    for (const f of this.slotFrames) f.destroy();
    this.slotFrames = [];
    for (let k = 0; k < this.engine.beats; k++) {
      const p = this.slotPos(k);
      const bonus = k >= 3;
      const f = this.add.image(p.x, p.y, 'card:back').setScale(SLOT_SCALE).setDepth(240).setAlpha(0.62);
      if (bonus) f.setTint(0xe8f8a0);
      f.setInteractive({ useHandCursor: true });
      // Tapping any filled slot sends every planned Verse back to the hand at once.
      f.on('pointerup', () => {
        if (k < this.engine.queue.length) this.undoAll();
      });
      this.slotFrames.push(f);
    }
    this.slotItems.forEach((it, k) => {
      const p = this.slotPos(k);
      this.tweens.add({ targets: it, x: p.x, y: p.y, duration: 200 });
    });
    this.refreshSlotHighlight();
  }

  private refreshSlotHighlight(): void {
    const next = this.engine.queue.length;
    this.slotFrames.forEach((f, k) => {
      this.tweens.killTweensOf(f);
      f.setAlpha(k === next && this.canPlan() ? 1 : 0.75);
      if (k === next && this.canPlan()) this.tweens.add({ targets: f, alpha: 0.6, duration: 700, yoyo: true, repeat: -1 });
    });
    this.slotItems.forEach((it, k) => {
      // Any planned Verse can be tapped to send the whole plan back, so each shows the return mark.
      const can = k >= 0 && this.canPlan() && !this.engine.readyToResolve;
      const u = (it as Phaser.GameObjects.Container).getByName?.('undo') as Phaser.GameObjects.Image | null;
      u?.setVisible(can);
    });
  }

  private putInSlot(v: CardView, k: number, animate = true): void {
    v.disableInteractive();
    v.setSelected(false);
    this.tweens.killTweensOf(v);
    const p = this.slotPos(k);
    v.setDepth(250);
    const undo = this.add.image(84, -150, 'icon:undo').setDisplaySize(60, 60).setName('undo').setVisible(false);
    v.add(undo);
    if (animate) this.tweens.add({ targets: v, x: p.x, y: p.y, scale: SLOT_SCALE, duration: 220, ease: 'Cubic.easeOut' });
    else v.setPosition(p.x, p.y).setScale(SLOT_SCALE);
    this.slotItems[k] = v;
  }

  private addMoveToken(k: number): void {
    const p = this.slotPos(k);
    const c = this.add.container(p.x, p.y).setDepth(250).setData('move', true);
    const bg = this.add.image(0, 0, 'card:back').setScale(SLOT_SCALE).setTint(0xb0a890);
    const ic = this.add.image(0, -10, 'icon:move').setDisplaySize(64, 64);
    const t = text(this, 0, 40, 'MOVE', { size: 20, font: 'display', bold: true, color: CSS.cream, spacing: 3 }).setOrigin(0.5);
    const undo = this.add.image(36, -64, 'icon:undo').setDisplaySize(26, 26).setName('undo').setVisible(false);
    c.add([bg, ic, t, undo]);
    this.slotItems[k] = c;
  }

  private clearSlots(): void {
    for (const it of this.slotItems) it.destroy();
    this.slotItems = [];
    for (const [cid, v] of this.cards) {
      if (!this.handOrder.includes(cid)) {
        this.cards.delete(cid);
        v.destroy();
      }
    }
    this.buildSlots();
  }

  // ===================================================================== auto / speed / pause

  private toggleAuto(): void {
    if (this.tutStep || Object.values(this.tutSteps ?? {}).some((l) => l.length > 0)) {
      toast(this, 'Auto unlocks once the lesson is over', 'auto');
      return;
    }
    this.auto = !this.auto;
    this.autoBtn.setOn(this.auto);
    saves.get().settings.auto = this.auto;
    saves.commit();
    toast(this, this.auto ? 'Auto battle on' : 'Auto battle off', 'auto');
    if (this.auto && this.canPlan()) this.autoStep();
  }

  private autoStep(): void {
    if (!this.auto || !this.canPlan()) return;
    const a = chooseAutoAction(this.engine);
    if (!a) {
      this.queueResolve();
      return;
    }
    if (a.kind === 'lantern') this.tapLantern();
    else {
      if (a.targetUid) this.engine.setTarget(a.targetUid);
      this.syncTarget();
      this.tapCard(a.cid);
    }
    if (!this.engine.readyToResolve) this.time.delayedCall(380, () => this.autoStep());
  }

  private setSpeed(s: number): void {
    this.speed = s;
    this.tweens.timeScale = s;
    this.time.timeScale = s;
    this.speedBtn?.setOn(s > 1);
    if (saves.get().settings.speed !== s) {
      saves.get().settings.speed = s;
      saves.commit();
    }
  }

  private openPause(mode: 'pause' | 'intel'): void {
    if (this.ended || this.scene.isPaused()) return;
    platform.gameplayStop();
    this.scene.launch('Pause', { mode, stageId: this.stage.id });
    this.scene.pause();
  }

  /** Called by the pause overlay. */
  resumeFromPause(): void {
    this.scene.resume();
    if (!this.ended) platform.gameplayStart();
  }

  // ===================================================================== end

  private async finish(won: boolean, rounds: number, fallen: number, reason?: 'wiped' | 'time'): Promise<void> {
    this.ended = true;
    this.busy = true;
    this.clearHint();
    this.clearTutBubble();
    platform.gameplayStop();
    const save = saves.get();
    if (won && this.tutSteps) {
      saves.markHint('tutorialDone');
      for (const id of TUTORIAL_HINTS) saves.markHint(id);
    }
    if (this.night) {
      // The Long Night: no stars or drops here — wounds go back to the map.
      const hp: Record<string, number> = {};
      for (const u of this.engine.allies) hp[u.defId] = u.alive ? u.hp / u.maxHp : 0;
      audio.play(null);
      audio.sfx(won ? 'victory' : 'defeat');
      await this.fx.banner(won ? 'THE HOUR PASSES' : 'THE LIGHT FADES', won ? undefined : 'The night is too long for this troupe', won ? CSS.gold : '#c8b8d8');
      const result: NightResult = { won, hp };
      goTo(this, 'Night', { result });
      return;
    }
    const outcome = applyBattleResult(save, this.stage, won, rounds, fallen);
    saves.commit();
    if (won && outcome.stars.count === 3) platform.happytime();
    let mvp = this.engine.allies[0].defId;
    let best = -1;
    for (const u of this.engine.allies) {
      const d = this.damageBy.get(u.uid) ?? 0;
      if (d > best && (u.alive || best < 0)) {
        best = d;
        mvp = u.defId;
      }
    }
    audio.play(null);
    audio.sfx(won ? 'victory' : 'defeat');
    await this.fx.banner(won ? 'VICTORY' : 'THE LIGHT FADES', won ? undefined : reason === 'time' ? 'The night ran out of rounds' : 'Every lantern has gone dark', won ? CSS.gold : '#c8b8d8');
    const result: ResultData = { stageId: this.stage.id, won, reason, rounds, fallen, mvp, outcome };
    goTo(this, 'Result', result);
  }

  // ===================================================================== tutorial

  private tutorial(): void {
    const r = this.engine.round;
    if (this.tutSteps) {
      this.tutStep = null;
      this.tutAdvance();
      return;
    }
    const lit = this.engine.hand.find((c) => c.lit);
    if (r === 1) this.showHint('cast', 'Tap a Verse to cast it. You have 3 Beats each round.', HAND_CX, HAND_Y - CARD_DH / 2 - 20, 'down');
    if (r <= 2 && lit) {
      const v = this.cards.get(lit.cid);
      if (v) this.showHint('firefly', 'A firefly lit this Verse: +30% power, and casting it feeds your Lantern.', v.homeX, v.homeY - CARD_DH / 2 - 20, 'down');
    }
    if (r === 1 && this.stage.id === '1-2') {
      const e = this.engine.aliveEnemies[0];
      const v = e && this.views.get(e.uid);
      if (v) this.showHint('intent', 'Enemies show their next move and target. Tap an enemy to focus your attacks on it.', v.x, v.top - 140, 'down');
    }
    if (this.stage.id === '1-3' && r === 1) this.showHint('move', 'Drag a Verse to move it (costs 1 Beat). Use it to set up merges.', HAND_CX, HAND_Y - CARD_DH / 2 - 20, 'down');
    if (this.engine.canLightLantern) this.showHint('lantern', 'Your Lantern is full! Tap it for an extra Beat this round.', this.lantern.x + 180, this.lantern.y + 100, 'up');
    const merged = r >= 2 ? this.engine.hand.find((c) => c.rank > 1) : undefined;
    if (merged) {
      const v = this.cards.get(merged.cid);
      if (v) this.showHint('merge', 'Identical Verses side by side merged into a stronger rank (more stars, more power).', v.homeX, v.homeY - CARD_DH / 2 - 20, 'down', 5500);
    }
    const fin = this.engine.hand.find((c) => c.finale);
    if (fin) {
      const v = this.cards.get(fin.cid);
      if (v) this.showHint('finale', 'Ardor is full — a Finale is ready! It is a powerful Verse that never merges.', v.homeX, v.homeY - CARD_DH / 2 - 20, 'down');
    }
  }

  private buildTutorial(): Record<number, TutStep[]> {
    const atCard = (pick: (c: Card) => boolean) => (s: BattleScene) => {
      const card = s.engine.hand.find((c) => pick(c) && s.handOrder.includes(c.cid));
      const v = card && s.cards.get(card.cid);
      return v ? { x: v.homeX, y: v.homeY - CARD_DH / 2 - 20, dir: 'down' as const } : null;
    };
    const atEnemy = (s: BattleScene) => {
      const e = s.engine.aliveEnemies[0];
      const v = e && s.views.get(e.uid);
      return v ? { x: v.x, y: v.top - 120, dir: 'down' as const } : null;
    };
    const lullaby = (c: Card) => c.verseId === 'odile_lullaby';
    const strike2 = (c: Card) => c.verseId === 'wren_strike' && c.rank >= 2;
    const normal = (c: Card) => !c.finale;
    return {
      1: [
        { msg: 'A Mothling! The icon above an enemy shows its next move — and who it will hit. Plan around it.', at: atEnemy, tap: true, focus: (s) => {
          const e = s.engine.aliveEnemies[0];
          const v = e && s.views.get(e.uid);
          return v ? { x: v.x, y: (v.top - 70 + v.y) / 2, w: 300, h: v.y - v.top + 150 } : null;
        } },
        { msg: 'These are your Verses. Each round you get 3 Beats to cast them.\n\nTap Lullaby Dose — the card between the two Strikes.', at: atCard(lullaby), card: lullaby },
        { msg: 'The two Strikes slid together and merged into a ★★ Verse — much stronger! Cast it.', at: atCard(strike2), card: strike2 },
        { msg: 'One Beat left. Cast any Verse — the round then plays out on its own.', at: () => ({ x: HAND_CX, y: HAND_Y - CARD_DH / 2 - 20, dir: 'down' }), card: normal },
      ],
      2: [
        { msg: 'A firefly lit this Verse: +30% power, and casting it feeds the Lantern. Cast it!', at: atCard((c) => c.lit), card: (c) => c.lit },
      ],
      3: [
        { msg: "Corvin's Ardor is full, so his Finale is ready. Finales are huge and never merge. Unleash it!", at: atCard((c) => c.finale), card: (c) => c.finale },
      ],
      4: [
        { msg: 'Five fireflies — the Lantern is full! Tap it for a fourth Beat this round.', at: () => ({ x: this.lantern.x + 160, y: this.lantern.y + 90, dir: 'up' }), lantern: true },
        { msg: "That's everything! Finish the fight your way. (Drag a Verse to move it for 1 Beat; tap an enemy to focus it.)", at: () => null, tap: true },
      ],
    };
  }

  /** Shows the next gated step for this round, if any. */
  private tutAdvance(): void {
    if (!this.tutSteps || this.ended) return;
    const list = this.tutSteps[this.engine.round];
    this.clearTutBubble();
    this.tutStep = null;
    // Skip steps whose subject is missing (e.g. the card got merged away).
    while (list?.length) {
      const step = list.shift()!;
      if (step.card && !this.engine.hand.some((c) => step.card!(c) && this.handOrder.includes(c.cid))) continue;
      if (step.lantern && !this.engine.canLightLantern) continue;
      this.tutStep = step;
      // Let merges and deals settle before pointing at a card.
      this.time.delayedCall(step.card ? 380 : 120, () => this.tutStep === step && this.drawTutBubble(step));
      return;
    }
  }

  private tutAllows(card: Card): boolean {
    const step = this.tutStep;
    if (!step || (step.card && step.card(card))) return true;
    this.tutNudge();
    return false;
  }

  private tutNudge(): void {
    audio.sfx('deny');
    const b = this.tutBubble;
    if (b) this.tweens.add({ targets: b, scale: 1.04, duration: 90, yoyo: true });
  }

  /** The rectangle a tutorial step wants the player to look at or tap. */
  private tutFocus(step: TutStep): { x: number; y: number; w: number; h: number; card?: CardView } | null {
    if (step.focus) return step.focus(this);
    if (step.card) {
      const card = this.engine.hand.find((c) => step.card!(c) && this.handOrder.includes(c.cid));
      const v = card && this.cards.get(card.cid);
      return v ? { x: v.homeX, y: v.homeY, w: CARD_DW, h: CARD_DH, card: v } : null;
    }
    if (step.lantern) return { x: this.lantern.x + 100, y: this.lantern.y, w: 340, h: 190 };
    return null;
  }

  /** Pulsing gilt outline with corner brackets around what to tap, so the guide is unmistakable. */
  private focusRing(r: { x: number; y: number; w: number; h: number; card?: CardView }): Phaser.GameObjects.Container {
    const c = this.add.container(r.x, r.y);
    if (r.card) return this.cardRing(c, r.card);
    const g = this.add.graphics();
    const hw = r.w / 2;
    const hh = r.h / 2;
    g.lineStyle(10, C.gold, 0.22).strokeRoundedRect(-hw - 3, -hh - 3, r.w + 6, r.h + 6, 12);
    g.lineStyle(3.5, 0xffe7a8, 1).strokeRoundedRect(-hw, -hh, r.w, r.h, 10);
    const L = Math.min(34, r.w / 4);
    g.lineStyle(5, 0xfff0c0, 1);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = sx * (hw + 10);
      const cy = sy * (hh + 10);
      g.beginPath();
      g.moveTo(cx, cy - sy * L);
      g.lineTo(cx, cy);
      g.lineTo(cx - sx * L, cy);
      g.strokePath();
    }
    c.add(g);
    this.tweens.add({ targets: c, scale: { from: 1, to: 1.04 }, alpha: { from: 1, to: 0.7 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  /**
   * A card's guide traces the card itself: its own glow, a gilt line on its edge and brackets on
   * its corners, riding along when it lifts under the pointer. It pulses in brightness, not size.
   */
  private cardRing(c: Phaser.GameObjects.Container, v: CardView): Phaser.GameObjects.Container {
    const glow = this.add.image(0, 0, 'card:auraLit').setScale(HAND_SCALE).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe7a8);
    const g = this.add.graphics();
    const hw = CARD_DW / 2;
    const hh = CARD_DH / 2;
    g.lineStyle(3, 0xffe7a8, 1).strokeRect(-hw, -hh, CARD_DW, CARD_DH);
    const L = 26;
    g.lineStyle(5, 0xfff0c0, 1);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = sx * (hw + 7);
      const cy = sy * (hh + 7);
      g.beginPath();
      g.moveTo(cx, cy - sy * L);
      g.lineTo(cx, cy);
      g.lineTo(cx - sx * L, cy);
      g.strokePath();
    }
    c.add([glow, g]);
    const follow = () => {
      if (!c.active || !v.active) return;
      c.setPosition(v.x, v.y).setScale(v.scaleX / HAND_SCALE);
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, follow);
    c.once(Phaser.GameObjects.Events.DESTROY, () => this.events.off(Phaser.Scenes.Events.POST_UPDATE, follow));
    this.tweens.add({ targets: glow, alpha: { from: 1, to: 0.35 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: g, alpha: { from: 1, to: 0.7 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  private drawTutBubble(step: TutStep): void {
    if (this.ended) return;
    const at = step.at(this);
    const msg = step.tap ? `${step.msg}\n\nTap anywhere to continue ▸` : step.msg;
    const c = this.bubble(msg, at?.x ?? W / 2, at?.y ?? H / 2 - 120, at?.dir ?? 'up', !!at, 600);
    c.setDepth(830);
    if (step.tap) {
      const z = this.add.zone(W / 2, H / 2, W, H).setInteractive();
      c.addAt(z, 0);
      z.once('pointerup', () => {
        if (this.tutStep !== step) return;
        audio.sfx('tap');
        this.tutAdvance();
      });
    }
    // The outline lives on its own top layer so cards and units never cover it.
    const f = this.tutFocus(step);
    if (f) {
      const ring = this.focusRing(f).setDepth(900);
      c.once(Phaser.GameObjects.Events.DESTROY, () => ring.destroy());
      c.on('tut-fade', () => this.tweens.add({ targets: ring, alpha: 0, duration: 160 }));
    }
    this.tutBubble = c;
  }

  private clearTutBubble(): void {
    const c = this.tutBubble;
    if (!c) return;
    this.tutBubble = undefined;
    this.tweens.killTweensOf(c);
    c.emit('tut-fade');
    this.tweens.add({ targets: c, alpha: 0, duration: 160, onComplete: () => c.destroy() });
  }

  /** Paper speech bubble with an arrow pointing at (x, y). */
  private bubble(msg: string, x: number, y: number, dir: 'down' | 'up', arrow = true, wrap = 520): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0).setDepth(820);
    const t = text(this, 0, 0, msg, { size: 26, color: CSS.paperText, wrap, lineSpacing: 2 });
    const w = t.width + 48;
    const h = t.height + 36;
    const bx = Phaser.Math.Clamp(x - w / 2, 20, W - w - 20);
    const by = Phaser.Math.Clamp(arrow ? (dir === 'down' ? y - h - 26 : y + 26) : y - h / 2, 20, H - h - 20);
    const bg = this.add.nineslice(bx, by, 'ui:paper', undefined, w, h, 14, 14, 14, 14).setOrigin(0);
    t.setPosition(bx + 24, by + 18);
    c.add([bg, t]);
    if (arrow) c.add(this.add.triangle(x, dir === 'down' ? y - 14 : y + 14, 0, 0, 36, 0, 18, 22, C.paper).setAngle(dir === 'down' ? 0 : 180));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 260 });
    if (arrow) this.tweens.add({ targets: c, y: dir === 'down' ? -8 : 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  private showHint(id: string, msg: string, x: number, y: number, dir: 'down' | 'up', autoHideMs = 0): void {
    if (this.hint || saves.hasHint(id) || this.ended || this.tutSteps) return;
    const c = this.bubble(msg, x, y, dir);
    this.hint = { id, c };
    if (autoHideMs) this.time.delayedCall(autoHideMs, () => this.completeHint(id));
  }

  private completeHint(id: string): void {
    if (this.hint?.id !== id) return;
    saves.markHint(id);
    this.clearHint();
  }

  private clearHint(): void {
    if (!this.hint) return;
    const c = this.hint.c;
    this.hint = undefined;
    this.tweens.killTweensOf(c);
    this.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => c.destroy() });
  }

  private bark(uid: string, line: string): void {
    const v = this.views.get(uid);
    if (!v) return;
    const t = text(this, 0, 0, line, { size: 24, italic: true, color: CSS.paperText, wrap: 360 });
    const w = t.width + 36;
    const h = t.height + 24;
    const c = this.add.container(v.x - w / 2 + 40, v.top - h - 110).setDepth(810);
    const bg = this.add.nineslice(0, 0, 'ui:paperPlain', undefined, w, h, 12, 12, 12, 12).setOrigin(0);
    t.setPosition(18, 12);
    c.add([bg, t]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 220, yoyo: true, hold: 2600, onComplete: () => c.destroy() });
  }
}
