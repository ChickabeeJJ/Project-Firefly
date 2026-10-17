import { describe, expect, it } from 'vitest';
import { freshSave, sanitizeSave } from '../src/game/persistence/schema';
import { applyBattleResult, frontierStage, isUnlocked, REWARDS } from '../src/game/systems/progression';
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
    expect(s.roster.wren.level).toBe(40);
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
    expect(five).toBeGreaterThan(0.035);
    expect(five).toBeLessThan(0.07);
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
    expect(claimAchievement(save, 'first_light')).toBe(100);
    expect(save.glimmer).toBe(g + 100);
    expect(claimAchievement(save, 'first_light')).toBe(0);
  });
});
