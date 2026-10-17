import { CHARACTERS } from '../data/characters';
import type { Rarity } from '../data/types';
import { MAX_RESONANCE } from '../battle/rules';
import type { Rng } from '../battle/rng';
import type { SaveData } from '../persistence/schema';

export const RITE = {
  cost: 160,
  rates: { 5: 0.04, 4: 0.24 } as Record<5 | 4, number>,
  /** A ★5 is guaranteed on this light if none came before. */
  pity: 40,
  dupeRefund: 60,
};

export interface RiteResult {
  id: string;
  rarity: Rarity;
  isNew: boolean;
  /** Resonance after this light (dupes raise it). */
  resonance: number;
  refund: number;
}

export function riteCost(count: number): number {
  return RITE.cost * count;
}

function rollRarity(rng: Rng, pity: number): Rarity {
  if (pity + 1 >= RITE.pity) return 5;
  const r = rng.next();
  if (r < RITE.rates[5]) return 5;
  if (r < RITE.rates[5] + RITE.rates[4]) return 4;
  return 3;
}

/** Spends Glimmer and resolves `count` lights. Returns null when unaffordable. */
export function performRite(save: SaveData, count: number, rng: Rng): RiteResult[] | null {
  const cost = riteCost(count);
  if (save.glimmer < cost) return null;
  save.glimmer -= cost;
  const results: RiteResult[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(rng, save.pity);
    save.pity = rarity === 5 ? 0 : save.pity + 1;
    save.totalPulls++;
    const pool = CHARACTERS.filter((c) => c.rarity === rarity);
    const char = rng.pick(pool);
    const owned = save.roster[char.id];
    if (!owned) {
      save.roster[char.id] = { level: 1, exp: 0, resonance: 0 };
      results.push({ id: char.id, rarity, isNew: true, resonance: 0, refund: 0 });
    } else if (owned.resonance < MAX_RESONANCE) {
      owned.resonance++;
      results.push({ id: char.id, rarity, isNew: false, resonance: owned.resonance, refund: 0 });
    } else {
      save.glimmer += RITE.dupeRefund;
      results.push({ id: char.id, rarity, isNew: false, resonance: owned.resonance, refund: RITE.dupeRefund });
    }
  }
  return results;
}
