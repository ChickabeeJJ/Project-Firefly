import { getCharacter } from '../data/characters';
import type { OwnedCharacter, SaveData } from '../persistence/schema';

// Character growth, modelled on Reverse: 1999.
//   • Levels are bought with Wick Dust (≈ Dust) and Brass Sovereigns (≈ Sharpodonty);
//     each level costs more than the last.
//   • Each Insight tier has a level cap (30 / 40 / 50 / 60). At the cap, Insight is raised with
//     chapter materials + Sovereigns; the level resets to 1 but every stat gained is kept.
//   • ★5 Luminaries have three Insight tiers, everyone else two.
// Internally a character's progress is a count of "steps" (levels bought); the battle engine's
// stat curve uses effectiveLevel() = 1 + steps / 3, so a fully raised ★4 matches the old Lv 40.

export type ItemId = 'dust' | 'sovereign' | 'moth' | 'velvet' | 'tide' | 'spring';

export interface ItemDef {
  id: ItemId;
  name: string;
  /** Icon texture key. */
  icon: string;
  blurb: string;
  source: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  dust: { id: 'dust', name: 'Wick Dust', icon: 'item:dust', blurb: 'Ash from a wick that burned through the Dimming, kept stoppered in glass. It still remembers being light — feed it to a Luminary and they grow brighter.', source: 'Any stage · Pawnshop' },
  sovereign: { id: 'sovereign', name: 'Brass Sovereign', icon: 'item:sovereign', blurb: 'Pre-Dimming coinage, stamped with a clock that has thirteen hours. Every trade in Vellmoor still runs on them.', source: 'Any stage · Pawnshop' },
  moth: { id: 'moth', name: 'Moth-Wing Scale', icon: 'item:moth', blurb: 'A dusty scale shed by a Mothling. Ground fine, it lets a Luminary see further into the dark.', source: 'Chapter 1 stages · Pawnshop' },
  velvet: { id: 'velvet', name: 'Velvet Thread', icon: 'item:velvet', blurb: 'Unpicked from a seat of the Gloaming Theatre. Strong enough to hold a memory in place.', source: 'Chapter 2 stages · Pawnshop' },
  tide: { id: 'tide', name: 'Tide Glass', icon: 'item:tide', blurb: 'Sea glass from a tide that never turned. It holds one second of moving water inside.', source: 'Chapter 3 stages · Pawnshop' },
  spring: { id: 'spring', name: 'Mainspring Coil', icon: 'item:spring', blurb: 'A coil from the Cathedral Clock, still wound with a stolen hour.', source: 'Chapter 4 stages · Pawnshop' },
};

export const ITEM_ORDER: ItemId[] = ['dust', 'sovereign', 'moth', 'velvet', 'tide', 'spring'];
export const CHAPTER_MATERIAL: Record<number, ItemId> = { 1: 'moth', 2: 'velvet', 3: 'tide', 4: 'spring' };

const CAPS = [30, 40, 50, 60];

export function maxInsight(rarity: number): number {
  return rarity >= 5 ? 3 : 2;
}

export function levelCap(insight: number): number {
  return CAPS[Math.min(insight, CAPS.length - 1)];
}

/** Levels bought so far, across every Insight tier. */
export function steps(o: Pick<OwnedCharacter, 'insight' | 'level'>): number {
  let n = o.level - 1;
  for (let i = 0; i < o.insight; i++) n += levelCap(i) - 1;
  return n;
}

/** Level fed to the stat curve (fractional). */
export function effectiveLevel(o: Pick<OwnedCharacter, 'insight' | 'level'>): number {
  return 1 + steps(o) / 3;
}

export interface Cost {
  dust: number;
  sovereign: number;
}

/** Cost of the level-up that takes step `s` to `s + 1`. */
function stepCost(s: number): Cost {
  return { dust: 60 + 14 * s, sovereign: 25 + 6 * s };
}

/** Total cost to go from the current level to `target` (same Insight tier). */
export function levelCost(o: OwnedCharacter, target: number): Cost {
  const base = steps(o);
  const c = { dust: 0, sovereign: 0 };
  for (let k = 0; k < target - o.level; k++) {
    const s = stepCost(base + k);
    c.dust += s.dust;
    c.sovereign += s.sovereign;
  }
  return c;
}

export function affordable(save: SaveData, cost: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(cost) as [ItemId, number][]).every(([k, v]) => (save.items[k] ?? 0) >= v);
}

function pay(save: SaveData, cost: Partial<Record<ItemId, number>>): void {
  for (const [k, v] of Object.entries(cost) as [ItemId, number][]) save.items[k] = (save.items[k] ?? 0) - v;
}

/** Highest level reachable right now with the items in hand (≥ current level). */
export function maxAffordableLevel(save: SaveData, id: string): number {
  const o = save.roster[id];
  const cap = levelCap(o.insight);
  let lv = o.level;
  while (lv < cap && affordable(save, levelCost(o, lv + 1))) lv++;
  return lv;
}

export function levelUp(save: SaveData, id: string, target: number): boolean {
  const o = save.roster[id];
  if (!o || target <= o.level || target > levelCap(o.insight)) return false;
  const cost = levelCost(o, target);
  if (!affordable(save, cost)) return false;
  pay(save, cost);
  o.level = target;
  return true;
}

/** Items needed to reach Insight `to` (1–3). */
export function insightCost(to: number): Partial<Record<ItemId, number>> {
  if (to === 1) return { sovereign: 2000, moth: 5 };
  if (to === 2) return { sovereign: 8000, velvet: 6, moth: 4 };
  return { sovereign: 20000, tide: 6, spring: 6 };
}

export type InsightState = 'max' | 'needsLevel' | 'ready' | 'short';

export function insightState(save: SaveData, id: string): InsightState {
  const o = save.roster[id];
  if (o.insight >= maxInsight(getCharacter(id).rarity)) return 'max';
  if (o.level < levelCap(o.insight)) return 'needsLevel';
  return affordable(save, insightCost(o.insight + 1)) ? 'ready' : 'short';
}

export function raiseInsight(save: SaveData, id: string): boolean {
  if (insightState(save, id) !== 'ready') return false;
  const o = save.roster[id];
  pay(save, insightCost(o.insight + 1));
  o.insight++;
  o.level = 1;
  return true;
}

/** Converts a pre-Insight save (single level 1–40) into Insight + level with the same power. */
export function fromLegacyLevel(level: number, rarity: number): { insight: number; level: number } {
  let left = Math.max(0, Math.round((level - 1) * 3));
  let insight = 0;
  while (insight < maxInsight(rarity) && left >= levelCap(insight) - 1) {
    left -= levelCap(insight) - 1;
    insight++;
  }
  return { insight, level: Math.min(levelCap(insight), 1 + left) };
}

/** Battle rewards (items) for a won stage. */
export function stageItems(stageLevel: number, chapter: number, firstClear: boolean, perfect: boolean): Partial<Record<ItemId, number>> {
  const mat = CHAPTER_MATERIAL[chapter];
  return {
    dust: (firstClear ? 320 : 110) * stageLevel,
    sovereign: (firstClear ? 140 : 50) * stageLevel,
    ...(mat ? { [mat]: (firstClear ? 3 : 1) + (perfect ? 1 : 0) } : {}),
  };
}

export function grant(save: SaveData, items: Partial<Record<ItemId, number>>): void {
  for (const [k, v] of Object.entries(items) as [ItemId, number][]) save.items[k] = (save.items[k] ?? 0) + v;
}

// ===================================================================== Pawnshop

export interface ShopOffer {
  id: string;
  item: ItemId;
  qty: number;
  price: number;
}

export const SHOP: ShopOffer[] = [
  { id: 'dust_s', item: 'dust', qty: 2000, price: 40 },
  { id: 'dust_l', item: 'dust', qty: 12000, price: 200 },
  { id: 'sov_s', item: 'sovereign', qty: 1000, price: 40 },
  { id: 'sov_l', item: 'sovereign', qty: 6000, price: 200 },
  { id: 'moth', item: 'moth', qty: 2, price: 60 },
  { id: 'velvet', item: 'velvet', qty: 2, price: 80 },
  { id: 'tide', item: 'tide', qty: 2, price: 100 },
  { id: 'spring', item: 'spring', qty: 2, price: 120 },
];

export function buy(save: SaveData, offerId: string): boolean {
  const o = SHOP.find((x) => x.id === offerId);
  if (!o || save.glimmer < o.price) return false;
  save.glimmer -= o.price;
  grant(save, { [o.item]: o.qty });
  return true;
}

const ROMAN = ['0', 'I', 'II', 'III'];
export function insightLabel(insight: number): string {
  return `Kindle ${ROMAN[insight] ?? insight}`;
}

export function formatQty(n: number): string {
  if (n >= 100000) return `${Math.floor(n / 1000)}K`;
  return n.toLocaleString('en-US');
}
