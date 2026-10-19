import { track } from './tasks';
import { CHARACTERS } from '../data/characters';
import type { Rarity } from '../data/types';
import { MAX_RESONANCE } from '../battle/rules';
import type { Rng } from '../battle/rng';
import type { SaveData } from '../persistence/schema';

export const RITE = {
  cost: 160,
  rates: { 5: 0.01, 4: 0.24 } as Record<5 | 4, number>,
  /** A ★5 is guaranteed on this light if none came before. */
  pity: 70,
  dupeRefund: 10,
};

/** A Rite banner. Featured Luminaries take half of their rarity's results (R1999's rate-up). */
export interface Banner {
  id: string;
  name: string;
  /** Tab label. */
  tag: string;
  blurb: string;
  featured?: string;
  featured4?: string[];
}

export const BANNERS: Banner[] = [
  {
    id: 'thirteenth', name: 'The Thirteenth Hour', tag: 'Event', featured: 'cassian', featured4: ['rook', 'nell'],
    blurb: 'The clockmaker’s son has come to collect every stolen minute. Cassian Vire answers the light more often.',
  },
  {
    id: 'dove', name: 'The Caged Dove', tag: 'Event', featured: 'evangeline', featured4: ['kit', 'teddy'],
    blurb: 'Every dove she sets free carries a name home. Aveline Halcyon answers the light more often.',
  },
  {
    id: 'lantern', name: 'The Lantern Rite', tag: 'Standard',
    blurb: 'Light a lantern on Lake Vell. Someone in the dark will answer.',
  },
];

export function getBanner(id: string): Banner {
  return BANNERS.find((b) => b.id === id) ?? BANNERS[0];
}

/** Event banners rotate weekly; returns ms until the current one closes (next Monday 05:00). */
export function bannerTimeLeft(now = new Date()): number {
  const end = new Date(now);
  end.setHours(5, 0, 0, 0);
  const add = (8 - end.getDay()) % 7 || (now >= end ? 7 : 0);
  end.setDate(end.getDate() + add);
  return end.getTime() - now.getTime();
}

/** Each Luminary's chance per light on a banner (for the Details panel). */
export function bannerOdds(b: Banner): { id: string; rarity: Rarity; p: number }[] {
  const out: { id: string; rarity: Rarity; p: number }[] = [];
  for (const r of [5, 4, 3] as const) {
    const rate = r === 3 ? 1 - RITE.rates[5] - RITE.rates[4] : RITE.rates[r];
    const pool = CHARACTERS.filter((c) => c.rarity === r);
    const feat = r === 5 && b.featured ? [b.featured] : r === 4 ? b.featured4 ?? [] : [];
    for (const c of pool) {
      const p = feat.length ? (feat.includes(c.id) ? rate * 0.5 / feat.length : (rate * 0.5) / (pool.length - feat.length)) : rate / pool.length;
      out.push({ id: c.id, rarity: r, p });
    }
  }
  return out;
}

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
export function performRite(save: SaveData, count: number, rng: Rng, bannerId = 'lantern'): RiteResult[] | null {
  const banner = getBanner(bannerId);
  const cost = riteCost(count);
  if (save.glimmer < cost) return null;
  save.glimmer -= cost;
  track(save, 'rite', count);
  const results: RiteResult[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(rng, save.pity);
    save.pity = rarity === 5 ? 0 : save.pity + 1;
    save.totalPulls++;
    const pool = CHARACTERS.filter((c) => c.rarity === rarity);
    const feat = rarity === 5 && banner.featured ? [banner.featured] : rarity === 4 ? banner.featured4 ?? [] : [];
    const featPool = pool.filter((c) => feat.includes(c.id));
    const restPool = pool.filter((c) => !feat.includes(c.id));
    // Among the non-featured, a Luminary you do not own yet is three times as likely to answer.
    const fresh = (c: (typeof pool)[number]) => (save.roster[c.id] ? 1 : 3);
    const weighted = (list: typeof pool) => {
      let r = rng.next() * list.reduce((a, c) => a + fresh(c), 0);
      for (const c of list) if ((r -= fresh(c)) < 0) return c;
      return list[list.length - 1];
    };
    const char = featPool.length && (rng.next() < 0.5 || !restPool.length) ? rng.pick(featPool) : weighted(restPool.length ? restPool : pool);
    save.history.unshift({ id: char.id, rarity, b: banner.id, t: Date.now() });
    if (save.history.length > 100) save.history.length = 100;
    const owned = save.roster[char.id];
    if (!owned) {
      save.roster[char.id] = { level: 1, insight: 0, resonance: 0 };
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
