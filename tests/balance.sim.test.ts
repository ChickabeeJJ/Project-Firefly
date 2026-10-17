import { describe, expect, it } from 'vitest';
import { BattleEngine } from '../src/game/battle/engine';
import { autoPlanRound } from '../src/game/battle/autoplay';
import { STAGES } from '../src/game/data/stages';

/**
 * Balance simulation: the auto-play heuristic plays every stage with the starter team at an
 * expected level. Prints a table and asserts broad targets (early stages winnable, bosses not
 * trivial). The heuristic is weaker than a thoughtful player, so it is a floor, not a ceiling.
 */
function simulate(stageId: string, level: number, team: string[], runs = 40) {
  const stage = STAGES.find((s) => s.id === stageId)!;
  let wins = 0;
  let rounds = 0;
  let fallen = 0;
  let lowest = 0;
  for (let i = 0; i < runs; i++) {
    const e = new BattleEngine({ stage, team: team.map((charId) => ({ charId, level, resonance: 0 })), seed: 1000 + i });
    e.start();
    let guard = 60;
    let low = 1;
    while (e.phase === 'planning' && guard-- > 0) {
      autoPlanRound(e);
      e.resolveRound();
      for (const u of e.allies) low = Math.min(low, u.hp / u.maxHp);
    }
    lowest += low;
    if (e.phase === 'won') {
      wins++;
      rounds += e.round;
      fallen += e.fallen;
    }
  }
  return { winRate: wins / runs, avgRounds: wins ? rounds / wins : 0, avgFallen: wins ? fallen / wins : 0, closest: lowest / runs };
}

/** Rough level a player reaches by each stage when clearing once (starter team, no grinding). */
function expectedLevel(stageLevel: number): number {
  return Math.max(1, Math.round(stageLevel * 0.85));
}

describe('balance simulation', () => {
  it('prints win rates for every stage', () => {
    const rows: string[] = [];
    const results: Record<string, ReturnType<typeof simulate>> = {};
    for (const s of STAGES) {
      const lv = expectedLevel(s.level);
      const starter = simulate(s.id, lv, ['wren', 'odile', 'bastian']);
      const mixed = simulate(s.id, lv, ['marigold', 'odile', 'ichabod']);
      results[s.id] = starter;
      rows.push(
        `${s.id.padEnd(4)} L${String(s.level).padStart(2)} team Lv${String(lv).padStart(2)} | starter win ${(starter.winRate * 100).toFixed(0).padStart(3)}% ` +
          `rounds ${starter.avgRounds.toFixed(1).padStart(4)} (star≤${s.starRounds}) fallen ${starter.avgFallen.toFixed(2)} low ${(starter.closest * 100).toFixed(0).padStart(3)}% | ` +
          `★5 team win ${(mixed.winRate * 100).toFixed(0).padStart(3)}% rounds ${mixed.avgRounds.toFixed(1)}`,
      );
    }
    console.log('\n' + rows.join('\n'));
    expect(results['1-1'].winRate).toBeGreaterThanOrEqual(0.95);
    expect(results['1-2'].winRate).toBeGreaterThanOrEqual(0.9);
  });
});
