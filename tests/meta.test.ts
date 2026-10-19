import { describe, expect, it } from 'vitest';
import { freshSave, sanitizeSave } from '../src/game/persistence/schema';
import { applyBattleResult, frontierStage, isUnlocked, REWARDS, trialUnlocked } from '../src/game/systems/progression';
import { performRite, RITE } from '../src/game/systems/gacha';
import { Rng } from '../src/game/battle/rng';
import { getStage } from '../src/game/data/stages';

describe('save validation', () => {
  it('returns a fresh save for garbage', () => {
    const strip = ({ playerId: _id, ...rest }: ReturnType<typeof freshSave>) => rest;
    expect(strip(sanitizeSave(null))).toEqual(strip(freshSave()));
    expect(strip(sanitizeSave('nope'))).toEqual(strip(freshSave()));
    expect(sanitizeSave(null).playerId).toBeGreaterThanOrEqual(100000000);
  });

  it('drops unknown characters/stages and clamps numbers', () => {
    const s = sanitizeSave({
      glimmer: -50,
      roster: { wren: { level: 999, exp: 'x', resonance: 9 }, hacker: { level: 1 } },
      team: ['wren', 'wren', 'nobody'],
      stars: { '1-1': 7, '9-9': 3 },
      settings: { music: 4 },
    });
    expect(s.glimmer).toBe(0);
    expect(s.roster.hacker).toBeUndefined();
    // legacy (v1) Lv 40 converts to the top of Insight II
    expect(s.roster.wren.insight).toBe(2);
    expect(s.roster.wren.level).toBe(50);
    expect(s.roster.wren.resonance).toBe(5);
    expect(s.team).toHaveLength(3);
    expect(new Set(s.team).size).toBe(3);
    expect(s.stars).toEqual({ '1-1': 3 });
    expect(s.settings.music).toBe(1);
  });
});

describe('progression', () => {
  it('pays first-clear + perfect bonus once, then repeat rewards', () => {
    const save = freshSave();
    const g0 = save.glimmer;
    const stage = getStage('1-1');
    const first = applyBattleResult(save, stage, true, 2, 0);
    expect(first.firstClear).toBe(true);
    expect(first.glimmer).toBe(REWARDS.firstClear + REWARDS.perfectBonus);
    const again = applyBattleResult(save, stage, true, 2, 0);
    expect(again.glimmer).toBe(REWARDS.repeatClear);
    expect(save.glimmer).toBe(g0 + first.glimmer + again.glimmer);
  });

  it('defeat changes nothing', () => {
    const save = freshSave();
    const before = JSON.stringify(save);
    applyBattleResult(save, getStage('1-1'), false, 5, 3);
    expect(JSON.stringify(save)).toBe(before);
  });

  it('unlocks stages in order', () => {
    const save = freshSave();
    expect(isUnlocked(save, '1-1')).toBe(true);
    expect(isUnlocked(save, '1-2')).toBe(false);
    applyBattleResult(save, getStage('1-1'), true, 3, 0);
    expect(isUnlocked(save, '1-2')).toBe(true);
    expect(frontierStage(save).id).toBe('1-2');
  });
});

describe('lantern rite', () => {
  it('refuses when unaffordable and charges correctly', () => {
    const save = freshSave();
    save.glimmer = RITE.cost - 1;
    expect(performRite(save, 1, new Rng(1))).toBeNull();
    save.glimmer = RITE.cost * 10;
    const res = performRite(save, 10, new Rng(1))!;
    expect(res).toHaveLength(10);
    expect(save.totalPulls).toBe(10);
  });

  it('guarantees a ★5 by the pity count', () => {
    const save = freshSave();
    save.glimmer = RITE.cost * RITE.pity;
    const res = performRite(save, RITE.pity, new Rng(424242))!;
    expect(res.some((r) => r.rarity === 5)).toBe(true);
  });

  it('rates roughly match the published odds', () => {
    const save = freshSave();
    save.glimmer = RITE.cost * 20000;
    const res = performRite(save, 20000, new Rng(5))!;
    const five = res.filter((r) => r.rarity === 5).length / res.length;
    const four = res.filter((r) => r.rarity === 4).length / res.length;
    // 1% base with a hard pity at 70 lands near 2% overall.
    expect(five).toBeGreaterThan(0.014);
    expect(five).toBeLessThan(0.027);
    expect(four).toBeGreaterThan(0.21);
    expect(four).toBeLessThan(0.27);
  });
});

describe('achievements', () => {
  it('claims once and only when complete', async () => {
    const { claimAchievement, claimableCount } = await import('../src/game/systems/achievements');
    const save = freshSave();
    expect(claimAchievement(save, 'first_light')).toBe(0);
    applyBattleResult(save, getStage('1-1'), true, 3, 0);
    expect(claimableCount(save)).toBeGreaterThanOrEqual(1);
    const g = save.glimmer;
    expect(claimAchievement(save, 'first_light')).toBe(40);
    expect(save.glimmer).toBe(g + 40);
    expect(claimAchievement(save, 'first_light')).toBe(0);
  });
});

describe('growth (R1999-style)', () => {
  it('levels with Dust + Sovereigns up to the Insight cap, then Insight resets level', async () => {
    const g = await import('../src/game/systems/growth');
    const save = freshSave();
    save.items.dust = 1e7;
    save.items.sovereign = 1e7;
    expect(g.levelUp(save, 'wren', 31)).toBe(false);
    expect(g.levelUp(save, 'wren', 30)).toBe(true);
    const before = g.effectiveLevel(save.roster.wren);
    expect(g.insightState(save, 'wren')).toBe('short');
    save.items.moth = 3;
    expect(g.raiseInsight(save, 'wren')).toBe(true);
    expect(save.roster.wren).toMatchObject({ insight: 1, level: 1 });
    expect(g.effectiveLevel(save.roster.wren)).toBeCloseTo(before);
    expect(save.items.moth).toBe(0);
  });

  it('costs rise with level and stages pay materials', async () => {
    const g = await import('../src/game/systems/growth');
    const o = { level: 1, insight: 0, resonance: 0 };
    const a = g.levelCost(o, 2);
    const b = g.levelCost({ ...o, level: 20 }, 21);
    expect(b.dust).toBeGreaterThan(a.dust);
    const save = freshSave();
    const d0 = save.items.dust;
    const out = applyBattleResult(save, getStage('1-1'), true, 3, 0);
    expect(save.items.dust).toBe(d0 + (out.items.dust ?? 0));
    expect(out.items.moth).toBeGreaterThan(0);
  });
});

describe('trials and banners', () => {
  it('trials drop materials, record a clear and unlock the next level, without stars', () => {
    const save = freshSave();
    for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6']) save.stars[id] = 1;
    const t1 = getStage('t-ember-1');
    const t2 = getStage('t-ember-2');
    expect(trialUnlocked(save, t1)).toBe(true);
    expect(trialUnlocked(save, t2)).toBe(false);
    const dust = save.items.dust;
    const out = applyBattleResult(save, t1, true, 5, 0);
    expect(out.firstClear).toBe(true);
    expect(save.items.dust - dust).toBe(Math.round((t1.drops!.dust) * 1.5));
    expect(save.stars['t-ember-1']).toBeUndefined();
    expect(trialUnlocked(save, t2)).toBe(true);
    // A second clear pays the base amount.
    const before = save.items.dust;
    applyBattleResult(save, t1, true, 5, 0);
    expect(save.items.dust - before).toBe(t1.drops!.dust);
  });

  it('the event banner rates up its featured ★5 and records history', () => {
    const save = freshSave();
    save.glimmer = 1e7;
    let featured = 0;
    let fives = 0;
    const rng = new Rng(7);
    for (let i = 0; i < 400; i++) {
      for (const r of performRite(save, 10, rng, 'dove')!) {
        if (r.rarity === 5) {
          fives++;
          if (r.id === 'evangeline') featured++;
        }
      }
    }
    expect(featured / fives).toBeGreaterThan(0.4);
    expect(save.history.length).toBe(100);
    expect(sanitizeSave(JSON.parse(JSON.stringify(save))).history.length).toBe(100);
  });
});

describe('daily sign-in', () => {
  it('pays once a day, pays milestones once, and starts a new sheet each month', async () => {
    const { signIn, signedToday } = await import('../src/game/systems/signin');
    const save = freshSave();
    const d = (day: number, month = 9) => new Date(2026, month, day, 12);
    expect(signIn(save, d(1))).not.toBeNull();
    expect(signIn(save, d(1))).toBeNull();
    expect(signedToday(save, d(1))).toBe(true);
    const g = save.glimmer;
    for (let day = 2; day <= 7; day++) signIn(save, d(day));
    expect(save.signIn.days.length).toBe(7);
    expect(save.signIn.milestones).toEqual([7]);
    expect(save.glimmer).toBe(g + 60 + 60); // day 7's Glimmer and the 7-day bonus
    signIn(save, d(1, 10));
    expect(save.signIn.days).toEqual([1]);
    expect(save.signIn.milestones).toEqual([]);
  });
});
