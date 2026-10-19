import { describe, expect, it } from 'vitest';
import { Rng } from '../src/game/battle/rng';
import { freshSave, sanitizeSave } from '../src/game/persistence/schema';
import { afterBattle, buildMap, endRun, HOURS, reachable, runMods, startRun } from '../src/game/systems/longnight';

describe('the long night', () => {
  it('builds a thirteen-hour map where every door can be reached and the last is the King', () => {
    for (let seed = 1; seed < 40; seed++) {
      const nodes = buildMap(new Rng(seed));
      for (let h = 2; h <= HOURS; h++) {
        for (const n of nodes.filter((x) => x.hour === h)) {
          expect(nodes.some((p) => p.hour === h - 1 && p.next.includes(n.id))).toBe(true);
        }
      }
      const top = nodes.filter((n) => n.hour === HOURS);
      expect(top).toHaveLength(1);
      expect(top[0].kind).toBe('boss');
      for (const n of nodes) if (n.kind === 'skirmish' || n.kind === 'omen') expect(n.waves?.length).toBeGreaterThan(0);
    }
  });

  it('carries wounds, pays spoils, survives a save round-trip and pays out at the end', () => {
    const save = freshSave();
    const run = startRun(save, 1234);
    const first = reachable(run)[0];
    run.path.push(first.id);
    const ok = afterBattle(run, first, true, Object.fromEntries(run.team.map((id) => [id, 0.6])));
    expect(ok).toBe(true);
    expect(run.embers).toBeGreaterThan(0);
    expect(run.pending?.kind).toBe('spoils');
    for (const id of run.team) expect(run.hp[id]).toBeCloseTo(0.6);
    const back = sanitizeSave(JSON.parse(JSON.stringify(save)));
    expect(back.night.run?.path).toEqual([first.id]);
    run.keepsakes.push('spectacles', 'hourglass');
    expect(runMods(run).allyAtk).toBeCloseTo(1.12 * 1.25);
    const g = save.glimmer;
    const res = endRun(save, false);
    expect(save.night.run).toBeNull();
    expect(res.hours).toBe(0);
    expect(save.glimmer).toBe(g + res.glimmer + res.bonus);
  });
});
