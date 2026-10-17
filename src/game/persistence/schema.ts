import { CHARACTERS, STARTER_TEAM } from '../data/characters';
import { STAGES } from '../data/stages';
import { MAX_LEVEL, MAX_RESONANCE } from '../battle/rules';

export const SAVE_VERSION = 1;
export const STARTING_GLIMMER = 1600;

export interface OwnedCharacter {
  level: number;
  exp: number;
  resonance: number;
}

export interface Settings {
  music: number;
  sfx: number;
}

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
}

export function freshSave(): SaveData {
  const roster: Record<string, OwnedCharacter> = {};
  for (const id of STARTER_TEAM) roster[id] = { level: 1, exp: 0, resonance: 0 };
  return {
    version: SAVE_VERSION,
    glimmer: STARTING_GLIMMER,
    roster,
    team: [...STARTER_TEAM],
    stars: {},
    pity: 0,
    totalPulls: 0,
    settings: { music: 0.6, sfx: 0.8 },
    hints: [],
  };
}

const charIds = new Set(CHARACTERS.map((c) => c.id));
const stageIds = new Set(STAGES.map((s) => s.id));

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

  const roster: Record<string, OwnedCharacter> = {};
  if (r.roster && typeof r.roster === 'object') {
    for (const [id, v] of Object.entries(r.roster as Record<string, unknown>)) {
      if (!charIds.has(id) || !v || typeof v !== 'object') continue;
      const o = v as Record<string, unknown>;
      roster[id] = {
        level: Math.round(num(o.level, 1, MAX_LEVEL, 1)),
        exp: Math.round(num(o.exp, 0, 1e7, 0)),
        resonance: Math.round(num(o.resonance, 0, MAX_RESONANCE, 0)),
      };
    }
  }
  for (const id of STARTER_TEAM) roster[id] ??= { level: 1, exp: 0, resonance: 0 };

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
    settings: { music: num(s.music, 0, 1, base.settings.music), sfx: num(s.sfx, 0, 1, base.settings.sfx) },
    hints: Array.isArray(r.hints) ? (r.hints as unknown[]).filter((h): h is string => typeof h === 'string').slice(0, 64) : [],
  };
}
