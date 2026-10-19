import { track } from './tasks';
import { STAGES } from '../data/stages';
import type { StageDef } from '../data/types';
import { grant, type ItemId, stageItems } from './growth';
import type { SaveData } from '../persistence/schema';

export const REWARDS = {
  firstClear: 160,
  perfectBonus: 80,
  repeatClear: 40,
};

export interface StarResult {
  won: boolean;
  inTime: boolean;
  noneFallen: boolean;
  count: number;
}

export function computeStars(stage: StageDef, won: boolean, rounds: number, fallen: number): StarResult {
  const inTime = won && rounds <= stage.starRounds;
  const noneFallen = won && fallen === 0;
  return { won, inTime, noneFallen, count: (won ? 1 : 0) + (inTime ? 1 : 0) + (noneFallen ? 1 : 0) };
}

export interface VictoryOutcome {
  stars: StarResult;
  glimmer: number;
  firstClear: boolean;
  /** Growth materials earned (Dust, Sovereigns, chapter material). */
  items: Partial<Record<ItemId, number>>;
}

/** Applies a finished battle to the save. Called exactly once per battle. */
export function applyBattleResult(save: SaveData, stage: StageDef, won: boolean, rounds: number, fallen: number): VictoryOutcome {
  const stars = computeStars(stage, won, rounds, fallen);
  if (!won) return { stars, glimmer: 0, firstClear: false, items: {} };
  track(save, stage.mode ? 'trial' : 'win');
  if (stage.mode) track(save, 'win');
  if (!stage.mode && stars.count === 3) track(save, 'perfect');
  if (stage.mode) {
    // Trials: fixed drops (half again on the first clear), no stars, no Glimmer.
    const firstClear = !save.hints.includes(`trial:${stage.id}`);
    if (firstClear) save.hints.push(`trial:${stage.id}`);
    const items: Partial<Record<ItemId, number>> = {};
    for (const [k, v] of Object.entries(stage.drops ?? {})) items[k as ItemId] = Math.round(v * (firstClear ? 1.5 : 1));
    grant(save, items);
    return { stars, glimmer: 0, firstClear, items };
  }
  const firstClear = !(stage.id in save.stars);
  const prevBest = save.stars[stage.id] ?? 0;
  let glimmer = firstClear ? REWARDS.firstClear : REWARDS.repeatClear;
  if (stars.count === 3 && prevBest < 3) glimmer += REWARDS.perfectBonus;
  save.stars[stage.id] = Math.max(prevBest, stars.count);
  save.glimmer += glimmer;
  const items = stageItems(stage.level, stage.chapter, firstClear, stars.count === 3 && prevBest < 3);
  grant(save, items);
  return { stars, glimmer, firstClear, items };
}

/** Trials open when the story has reached their gate and the previous level is cleared. */
export function trialUnlocked(save: SaveData, t: StageDef): boolean {
  if (t.requires && !(t.requires in save.stars)) return false;
  return t.index === 1 || save.hints.includes(`trial:t-${t.family}-${t.index - 1}`);
}

export function trialCleared(save: SaveData, t: StageDef): boolean {
  return save.hints.includes(`trial:${t.id}`);
}

export function isUnlocked(save: SaveData, stageId: string): boolean {
  const i = STAGES.findIndex((s) => s.id === stageId);
  if (i <= 0) return i === 0;
  return STAGES[i - 1].id in save.stars;
}

/** The furthest unlocked stage that has not been cleared yet (or the last stage). */
export function frontierStage(save: SaveData): StageDef {
  for (const s of STAGES) if (!(s.id in save.stars)) return s;
  return STAGES[STAGES.length - 1];
}
