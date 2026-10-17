import type { Mood } from '../data/types';

// Tunable battle constants. Keep every balance number here.
export const HAND_LIMIT = 7;
export const BASE_BEATS = 3;
export const MAX_RANK = 3;
export const RANK_MULT = [1, 1.5, 2.5] as const;
export const ARDOR_MAX = 5;

export const LANTERN = {
  capacity: 5,
  /** Effect bonus of a lit card. */
  litBonus: 0.3,
  /** Fireflies that land on cards at the start of each round. */
  lightsPerRound: 1,
  /** Lit cards in hand are capped so the light stays special. */
  maxLitInHand: 3,
  /** Extra Beats granted by the Lantern Hour. */
  bonusBeats: 1,
};

export const MOOD_ADV = 1.25;
export const MOOD_DISADV = 0.85;
export const CRIT_CHANCE = 0.1;
export const CRIT_MULT = 1.5;
export const DEF_CONSTANT = 300;

export const STATUS_MULT = {
  might: 0.3,
  weak: 0.25,
  frail: 0.3,
};

/** Sun beats Moon, Moon beats Star, Star beats Sun. */
export const BEATS: Record<Mood, Mood> = { sun: 'moon', moon: 'star', star: 'sun' };

export function moodRelation(attacker: Mood, defender: Mood): 1 | 0 | -1 {
  if (BEATS[attacker] === defender) return 1;
  if (BEATS[defender] === attacker) return -1;
  return 0;
}

// Progression scaling, shared by the engine and the meta screens.
export const ALLY_LEVEL_GROWTH = 0.07;
export const ENEMY_LEVEL_GROWTH = 0.085;
/** Global enemy tuning knobs (balance sim: tests/balance.sim.test.ts). */
export const ENEMY_ATK_SCALE = 2.8;
export const ENEMY_HP_SCALE = 0.65;
export const RESONANCE_GROWTH = 0.06;
export const MAX_LEVEL = 40;
export const MAX_RESONANCE = 5;
