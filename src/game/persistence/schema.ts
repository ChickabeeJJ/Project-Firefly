import { CHARACTERS, STARTER_TEAM } from '../data/characters';
import { STAGES } from '../data/stages';
import { MAX_RESONANCE } from '../battle/rules';
import type { SignInRecord } from '../systems/signin';
import { THEMES } from '../config/theme';
import { fromLegacyLevel, type ItemId, ITEM_ORDER, levelCap, maxInsight } from '../systems/growth';

export const SAVE_VERSION = 2;
export const STARTING_GLIMMER = 1600;

export interface OwnedCharacter {
  /** Level within the current Insight tier (resets to 1 on Insight). */
  level: number;
  insight: number;
  resonance: number;
}

export interface Settings {
  music: number;
  sfx: number;
  /** Lobby gramophone record. */
  track: 'lobby' | 'rite' | 'battle' | 'boss';
  /** Accent colour preset (config/theme THEMES). */
  theme: string;
  /** Battle toggles, remembered between fights. */
  auto: boolean;
  speed: number;
}

const TRACKS = ['lobby', 'rite', 'battle', 'boss'] as const;

export interface SaveData {
  version: number;
  glimmer: number;
  roster: Record<string, OwnedCharacter>;
  team: string[];
  /** Best stars per cleared stage (presence = cleared). */
  stars: Record<string, number>;
  /** Lights since the last ★5. */
  pity: number;
  totalPulls: number;
  settings: Settings;
  /** Tutorial hints already shown. */
  hints: string[];
  /** Player card number shown in the lobby. */
  playerId: number;
  /** Enemy ids met in battle (Atlas). */
  seen: string[];
  /** Achievement ids already claimed. */
  claimed: string[];
  /** Growth materials (Wick Dust, Brass Sovereigns, Insight materials). */
  items: Record<ItemId, number>;
  /** When this save was last written (ms since epoch). */
  savedAt: number;
  /** Recent Lantern Rite results, newest first (Record screen). */
  history: RiteRecord[];
  /** This month's daily sign-in sheet. */
  signIn: SignInRecord;
}

export interface RiteRecord {
  id: string;
  rarity: number;
  /** Banner id. */
  b: string;
  t: number;
}

export const STARTING_ITEMS: Record<ItemId, number> = { dust: 3000, sovereign: 1500, moth: 0, velvet: 0, tide: 0, spring: 0 };

export function freshSave(): SaveData {
  const roster: Record<string, OwnedCharacter> = {};
  for (const id of STARTER_TEAM) roster[id] = { level: 1, insight: 0, resonance: 0 };
  return {
    version: SAVE_VERSION,
    glimmer: STARTING_GLIMMER,
    roster,
    team: [...STARTER_TEAM],
    stars: {},
    pity: 0,
    totalPulls: 0,
    settings: { music: 0.6, sfx: 0.8, track: 'lobby', theme: 'verdigris', auto: false, speed: 1 },
    hints: [],
    playerId: 100000000 + Math.floor(Math.random() * 899999999),
    seen: [],
    claimed: [],
    items: { ...STARTING_ITEMS },
    savedAt: 0,
    history: [],
    signIn: { month: '', days: [], milestones: [] },
  };
}

const charIds = new Set(CHARACTERS.map((c) => c.id));
const stageIds = new Set(STAGES.map((s) => s.id));

function strings(v: unknown, max: number): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))].slice(0, max) : [];
}

function sanitizeItems(v: unknown, legacy: boolean): Record<ItemId, number> {
  const src = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const out = {} as Record<ItemId, number>;
  for (const id of ITEM_ORDER) out[id] = Math.round(num(src[id], 0, 1e9, legacy ? STARTING_ITEMS[id] * 4 : 0));
  return out;
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

/**
 * Validates untrusted save data (from localStorage or the platform). Anything missing, invalid or
 * unknown falls back to safe defaults rather than throwing.
 */
export function sanitizeSave(raw: unknown): SaveData {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  const legacy = num(r.version, 0, 99, 0) < 2;
  const roster: Record<string, OwnedCharacter> = {};
  if (r.roster && typeof r.roster === 'object') {
    for (const [id, v] of Object.entries(r.roster as Record<string, unknown>)) {
      if (!charIds.has(id) || !v || typeof v !== 'object') continue;
      const o = v as Record<string, unknown>;
      const rarity = CHARACTERS.find((c) => c.id === id)!.rarity;
      const resonance = Math.round(num(o.resonance, 0, MAX_RESONANCE, 0));
      if (legacy) {
        roster[id] = { ...fromLegacyLevel(Math.round(num(o.level, 1, 40, 1)), rarity), resonance };
      } else {
        const insight = Math.round(num(o.insight, 0, maxInsight(rarity), 0));
        roster[id] = { level: Math.round(num(o.level, 1, levelCap(insight), 1)), insight, resonance };
      }
    }
  }
  for (const id of STARTER_TEAM) roster[id] ??= { level: 1, insight: 0, resonance: 0 };

  let team = Array.isArray(r.team) ? (r.team as unknown[]).filter((id): id is string => typeof id === 'string' && !!roster[id]) : [];
  team = [...new Set(team)].slice(0, 3);
  for (const id of STARTER_TEAM) if (team.length < 3 && !team.includes(id)) team.push(id);

  const stars: Record<string, number> = {};
  if (r.stars && typeof r.stars === 'object') {
    for (const [id, v] of Object.entries(r.stars as Record<string, unknown>)) {
      if (stageIds.has(id)) stars[id] = Math.round(num(v, 0, 3, 0));
    }
  }

  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  return {
    version: SAVE_VERSION,
    glimmer: Math.round(num(r.glimmer, 0, 1e9, base.glimmer)),
    roster,
    team,
    stars,
    pity: Math.round(num(r.pity, 0, 1000, 0)),
    totalPulls: Math.round(num(r.totalPulls, 0, 1e7, 0)),
    settings: {
      music: num(s.music, 0, 1, base.settings.music),
      sfx: num(s.sfx, 0, 1, base.settings.sfx),
      track: (TRACKS as readonly string[]).includes(s.track as string) ? (s.track as Settings['track']) : 'lobby',
      theme: typeof s.theme === 'string' && s.theme in THEMES ? s.theme : 'verdigris',
      auto: s.auto === true,
      speed: s.speed === 2 ? 2 : 1,
    },
    hints: strings(r.hints, 1024),
    playerId: Math.round(num(r.playerId, 100000000, 999999999, base.playerId)),
    seen: strings(r.seen, 64),
    claimed: strings(r.claimed, 256),
    items: sanitizeItems(r.items, legacy),
    savedAt: Math.round(num(r.savedAt, 0, 1e14, 0)),
    history: Array.isArray(r.history)
      ? (r.history as unknown[]).slice(0, 100).flatMap((h) => {
        const o = (h && typeof h === 'object' ? h : {}) as Record<string, unknown>;
        return typeof o.id === 'string' && charIds.has(o.id)
          ? [{ id: o.id, rarity: Math.round(num(o.rarity, 3, 5, 3)), b: typeof o.b === 'string' ? o.b : 'lantern', t: Math.round(num(o.t, 0, 1e14, 0)) }]
          : [];
      })
      : [],
    signIn: sanitizeSignIn(r.signIn),
  };
}

function sanitizeSignIn(raw: unknown): SignInRecord {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ints = (v: unknown, max: number) => (Array.isArray(v) ? [...new Set((v as unknown[]).filter((n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= max))] : []);
  return {
    month: typeof o.month === 'string' && /^\d{4}-\d{2}$/.test(o.month) ? o.month : '',
    days: ints(o.days, 31),
    milestones: ints(o.milestones, 31),
  };
}
