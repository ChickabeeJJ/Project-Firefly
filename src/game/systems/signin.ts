import { track } from './tasks';
import type { SaveData } from '../persistence/schema';
import { type ItemId, ITEMS } from './growth';

/** Monthly sign-in sheet, as in the reference: one reward per calendar day, plus bonuses for days signed. */
export interface SignInRecord {
  /** 'YYYY-MM' the record belongs to; a new month starts a clean sheet. */
  month: string;
  /** Days of the month already claimed. */
  days: number[];
  /** Milestone thresholds (days signed) already paid out. */
  milestones: number[];
}

export type RewardKind = 'glimmer' | ItemId;
export interface Reward {
  kind: RewardKind;
  n: number;
}

/** The week's rhythm; every seventh day pays Glimmer. */
const WEEK: Reward[] = [
  { kind: 'dust', n: 4000 },
  { kind: 'sovereign', n: 3000 },
  { kind: 'moth', n: 2 },
  { kind: 'velvet', n: 2 },
  { kind: 'tide', n: 2 },
  { kind: 'sovereign', n: 5000 },
  { kind: 'glimmer', n: 60 },
];

export const MILESTONES: { days: number; reward: Reward }[] = [
  { days: 7, reward: { kind: 'glimmer', n: 60 } },
  { days: 15, reward: { kind: 'glimmer', n: 100 } },
  { days: 25, reward: { kind: 'glimmer', n: 160 } },
];

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function dayReward(day: number): Reward {
  return WEEK[(day - 1) % WEEK.length];
}

export function rewardName(r: Reward): string {
  return r.kind === 'glimmer' ? 'Glimmer' : ITEMS[r.kind].name;
}

export function rewardIcon(r: Reward): string {
  return r.kind === 'glimmer' ? 'icon:glimmer' : `item:${r.kind}`;
}

/** The current month's record (a stale month is replaced, not mutated in place). */
export function sheetFor(save: SaveData, now = new Date()): SignInRecord {
  const m = monthKey(now);
  if (save.signIn.month !== m) save.signIn = { month: m, days: [], milestones: [] };
  return save.signIn;
}

export function signedToday(save: SaveData, now = new Date()): boolean {
  return sheetFor(save, now).days.includes(now.getDate());
}

function grant(save: SaveData, r: Reward): void {
  if (r.kind === 'glimmer') save.glimmer += r.n;
  else save.items[r.kind] = (save.items[r.kind] ?? 0) + r.n;
}

/** Signs in for today. Returns what was paid (today's reward and any milestone it reached), or null. */
export function signIn(save: SaveData, now = new Date()): { reward: Reward; milestones: Reward[] } | null {
  const sheet = sheetFor(save, now);
  const day = now.getDate();
  if (sheet.days.includes(day)) return null;
  sheet.days.push(day);
  track(save, 'signin', 1, now);
  const reward = dayReward(day);
  grant(save, reward);
  const reached: Reward[] = [];
  for (const m of MILESTONES) {
    if (sheet.days.length >= m.days && !sheet.milestones.includes(m.days)) {
      sheet.milestones.push(m.days);
      grant(save, m.reward);
      reached.push(m.reward);
    }
  }
  return { reward, milestones: reached };
}
