import { describe, expect, it } from 'vitest';
import { BattleEngine } from '../src/game/battle/engine';
import { autoPlanRound } from '../src/game/battle/autoplay';
import { HAND_LIMIT, LANTERN, ARDOR_MAX } from '../src/game/battle/rules';
import { normalCount } from '../src/game/battle/hand';
import { getStage, STAGES } from '../src/game/data/stages';
import type { BattleEvent } from '../src/game/battle/types';

function makeEngine(stageId = '1-1', seed = 7, level = 1) {
  return new BattleEngine({
    stage: getStage(stageId),
    team: ['wren', 'odile', 'bastian'].map((charId) => ({ charId, level, resonance: 0 })),
    seed,
  });
}

describe('battle engine — planning', () => {
  it('starts in planning with a full hand, one lit card and enemy intents', () => {
    const e = makeEngine();
    const ev = e.start();
    expect(e.phase).toBe('planning');
    expect(normalCount(e.hand)).toBe(HAND_LIMIT);
    expect(e.hand.filter((c) => c.lit)).toHaveLength(1);
    expect(ev.some((x) => x.t === 'intents')).toBe(true);
    for (const en of e.aliveEnemies) expect(en.intent).toBeTruthy();
    expect(e.beatsLeft).toBe(3);
  });

  it('casting spends a beat and undo restores hand and queue exactly', () => {
    const e = makeEngine();
    e.start();
    const before = JSON.stringify(e.hand);
    const r = e.cast(e.hand[2].cid);
    expect(r.ok).toBe(true);
    expect(e.beatsLeft).toBe(2);
    expect(e.undo()).toBe(true);
    expect(JSON.stringify(e.hand)).toBe(before);
    expect(e.beatsLeft).toBe(3);
  });

  it('moving a card spends a beat and cannot move finales', () => {
    const e = makeEngine();
    e.start();
    const r = e.move(e.hand[0].cid, 3);
    expect(r.ok).toBe(true);
    expect(e.beatsLeft).toBe(2);
    expect(e.move(e.hand[0].cid, 0).ok).toBe(false);
  });

  it('refuses actions once the beats are spent', () => {
    const e = makeEngine();
    e.start();
    for (let i = 0; i < 3; i++) e.cast(e.hand[0].cid);
    expect(e.readyToResolve).toBe(true);
    expect(e.cast(e.hand[0].cid).ok).toBe(false);
  });

  it('Lantern Hour needs 5 fireflies and grants one extra beat', () => {
    const e = makeEngine();
    e.start();
    expect(e.lightLantern()).toBe(false);
    e.fireflies = LANTERN.capacity;
    expect(e.lightLantern()).toBe(true);
    expect(e.beats).toBe(4);
    expect(e.fireflies).toBe(0);
    expect(e.undo()).toBe(true);
    expect(e.fireflies).toBe(LANTERN.capacity);
    expect(e.beats).toBe(3);
  });
});

describe('battle engine — resolution', () => {
  it('a lit cast feeds the lantern and ardor rises per cast', () => {
    const e = makeEngine('1-1', 3);
    e.start();
    const lit = e.hand.find((c) => c.lit)!;
    const owner = lit.ownerUid;
    e.cast(lit.cid);
    while (e.beatsLeft > 0) e.cast(e.hand.find((c) => c.ownerUid !== owner)?.cid ?? e.hand[0].cid);
    const ev = e.resolveRound();
    expect(ev.some((x) => x.t === 'firefly')).toBe(true);
    expect(e.fireflies).toBeGreaterThanOrEqual(1);
    expect(e.unit(owner)!.ardor).toBeGreaterThanOrEqual(1);
  });

  it('deals a Finale card when a character reaches max ardor, and resets ardor on cast', () => {
    const e = makeEngine('1-2', 11);
    e.start();
    e.unit('a0')!.ardor = ARDOR_MAX;
    for (let i = 0; i < 3; i++) e.cast(e.hand[0].cid);
    e.resolveRound();
    if (e.phase !== 'planning') return;
    const finale = e.hand.find((c) => c.finale && c.ownerUid === 'a0');
    expect(finale).toBeTruthy();
    e.cast(finale!.cid);
    while (e.beatsLeft > 0 && e.hand.some((c) => !c.finale)) e.cast(e.hand.find((c) => !c.finale)!.cid);
    const ev = e.resolveRound();
    const castEv = ev.find((x) => x.t === 'cast' && x.finale);
    expect(castEv).toBeTruthy();
  });

  it('enemy snuff removes fireflies from the lantern', () => {
    const e = makeEngine('1-6', 5, 1);
    e.start();
    e.fireflies = 4;
    // Spend the round on support verses so the Lamp-Eater survives to its Snuff move.
    for (let r = 0; r < 2 && e.phase === 'planning'; r++) {
      while (e.beatsLeft > 0) {
        const c = e.hand.find((x) => e.verseOf(x).type === 'heal' || e.verseOf(x).type === 'shield') ?? e.hand[0];
        e.cast(c.cid, null);
      }
      const ev = e.resolveRound();
      const snuff = ev.find((x) => x.t === 'snuff');
      if (snuff && snuff.t === 'snuff') {
        expect(snuff.lantern).toBeLessThan(4 + 2);
        return;
      }
    }
    throw new Error('Lamp-Eater never snuffed');
  });

  it('every battle terminates with exactly one victory or defeat event', () => {
    for (const stage of STAGES) {
      const e = makeEngine(stage.id, 1234, stage.level);
      const all: BattleEvent[] = e.start();
      let guard = 60;
      while (e.phase === 'planning' && guard-- > 0) {
        autoPlanRound(e);
        all.push(...e.resolveRound());
      }
      const ends = all.filter((x) => x.t === 'victory' || x.t === 'defeat');
      expect(ends, stage.id).toHaveLength(1);
      expect(['won', 'lost']).toContain(e.phase);
      for (const u of e.units) {
        expect(u.hp).toBeGreaterThanOrEqual(0);
        expect(u.hp).toBeLessThanOrEqual(u.maxHp);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const run = () => {
      const e = makeEngine('1-3', 99, 3);
      const out: string[] = [];
      e.start();
      while (e.phase === 'planning') {
        autoPlanRound(e);
        out.push(...e.resolveRound().map((x) => x.t));
      }
      return out.join(',');
    };
    expect(run()).toBe(run());
  });
});
