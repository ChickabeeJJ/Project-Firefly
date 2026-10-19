import type { SaveData } from '../persistence/schema';
import { grant, type ItemId } from './growth';

// Daily and weekly tasks, as the reference's task board. Events are counted as they happen; the
// day's sheet turns over at local midnight and the week's on Monday.

export type TaskEvent = 'win' | 'trial' | 'rite' | 'levelup' | 'kindle' | 'signin' | 'night' | 'perfect';

export interface TaskRecord {
  day: string;
  week: string;
  daily: Partial<Record<TaskEvent, number>>;
  weekly: Partial<Record<TaskEvent, number>>;
  claimed: string[];
}

export interface TaskDef {
  id: string;
  name: string;
  event: TaskEvent;
  goal: number;
  glimmer: number;
  items?: Partial<Record<ItemId, number>>;
}

export const DAILY: TaskDef[] = [
  { id: 'd_signin', name: 'Sign in for the day', event: 'signin', goal: 1, glimmer: 10 },
  { id: 'd_win', name: 'Win 3 battles', event: 'win', goal: 3, glimmer: 20, items: { dust: 1500 } },
  { id: 'd_trial', name: 'Clear a Supplies or Kindling stage', event: 'trial', goal: 1, glimmer: 10, items: { sovereign: 800 } },
  { id: 'd_level', name: 'Level up a Luminary', event: 'levelup', goal: 1, glimmer: 10 },
  { id: 'd_rite', name: 'Hold a Lantern Rite', event: 'rite', goal: 1, glimmer: 10 },
];

export const WEEKLY: TaskDef[] = [
  { id: 'w_win', name: 'Win 20 battles', event: 'win', goal: 20, glimmer: 60, items: { dust: 8000 } },
  { id: 'w_signin', name: 'Sign in on 5 days', event: 'signin', goal: 5, glimmer: 50 },
  { id: 'w_night', name: 'Climb 8 hours of the Long Night', event: 'night', goal: 8, glimmer: 70, items: { spring: 1 } },
  { id: 'w_perfect', name: 'Earn 3 stars on 5 stages', event: 'perfect', goal: 5, glimmer: 40, items: { sovereign: 4000 } },
  { id: 'w_trial', name: 'Clear 8 Supplies or Kindling stages', event: 'trial', goal: 8, glimmer: 50, items: { moth: 1, velvet: 1, tide: 1 } },
  { id: 'w_kindle', name: 'Kindle a Luminary', event: 'kindle', goal: 1, glimmer: 40 },
];

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** The Monday that starts this date's week. */
export function weekKey(d: Date): string {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(m);
}

export const freshTasks = (): TaskRecord => ({ day: '', week: '', daily: {}, weekly: {}, claimed: [] });

/** Turns the sheets over when a day or week has passed. */
export function tasksFor(save: SaveData, now = new Date()): TaskRecord {
  const t = save.tasks;
  const d = dayKey(now);
  const w = weekKey(now);
  if (t.day !== d) {
    t.day = d;
    t.daily = {};
    t.claimed = t.claimed.filter((id) => !id.startsWith('d_'));
  }
  if (t.week !== w) {
    t.week = w;
    t.weekly = {};
    t.claimed = t.claimed.filter((id) => !id.startsWith('w_'));
  }
  return t;
}

export function track(save: SaveData, ev: TaskEvent, n = 1, now = new Date()): void {
  const t = tasksFor(save, now);
  t.daily[ev] = (t.daily[ev] ?? 0) + n;
  t.weekly[ev] = (t.weekly[ev] ?? 0) + n;
}

export function taskProgress(save: SaveData, def: TaskDef): [number, number] {
  const t = tasksFor(save);
  const src = def.id.startsWith('d_') ? t.daily : t.weekly;
  return [Math.min(def.goal, src[def.event] ?? 0), def.goal];
}

export type TaskState = 'locked' | 'ready' | 'claimed';

export function taskState(save: SaveData, def: TaskDef): TaskState {
  if (tasksFor(save).claimed.includes(def.id)) return 'claimed';
  const [c, g] = taskProgress(save, def);
  return c >= g ? 'ready' : 'locked';
}

export function claimTask(save: SaveData, id: string): boolean {
  const def = [...DAILY, ...WEEKLY].find((x) => x.id === id);
  if (!def || taskState(save, def) !== 'ready') return false;
  save.tasks.claimed.push(id);
  save.glimmer += def.glimmer;
  if (def.items) grant(save, def.items);
  return true;
}

export function readyTaskCount(save: SaveData): number {
  return [...DAILY, ...WEEKLY].filter((d) => taskState(save, d) === 'ready').length;
}

export function sanitizeTasks(raw: unknown): TaskRecord {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const counts = (v: unknown) => {
    const out: Partial<Record<TaskEvent, number>> = {};
    if (v && typeof v === 'object') for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && n >= 0) out[k as TaskEvent] = Math.min(1e6, Math.round(n));
    return out;
  };
  return {
    day: typeof o.day === 'string' ? o.day : '',
    week: typeof o.week === 'string' ? o.week : '',
    daily: counts(o.daily),
    weekly: counts(o.weekly),
    claimed: Array.isArray(o.claimed) ? (o.claimed as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 64) : [],
  };
}
