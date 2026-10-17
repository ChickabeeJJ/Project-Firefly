import { STAGES } from '../data/stages';
import type { StageDef } from '../data/types';
import { MAX_LEVEL } from '../battle/rules';
import type { OwnedCharacter, SaveData } from '../persistence/schema';

export const REWARDS = {
  firstClear: 160,
  perfectBonus: 80,
  repeatClear: 40,
};

export function expToNext(level: number): number {
  return 60 + 40 * level;
}

export function stageExp(stage: StageDef): number {
  return 40 + 25 * stage.level;
}

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

export interface LevelUp {
  id: string;
  from: number;
  to: number;
  expGained: number;
}

export function grantExp(owned: OwnedCharacter, id: string, amount: number): LevelUp {
  const from = owned.level;
  owned.exp += amount;
  while (owned.level < MAX_LEVEL && owned.exp >= expToNext(owned.level)) {
    owned.exp -= expToNext(owned.level);
    owned.level++;
  }
  if (owned.level >= MAX_LEVEL) owned.exp = 0;
  return { id, from, to: owned.level, expGained: amount };
}

export interface VictoryOutcome {
  stars: StarResult;
  glimmer: number;
  firstClear: boolean;
  levelUps: LevelUp[];
}

/** Applies a finished battle to the save. Called exactly once per battle. */
export function applyBattleResult(save: SaveData, stage: StageDef, won: boolean, rounds: number, fallen: number): VictoryOutcome {
  const stars = computeStars(stage, won, rounds, fallen);
  if (!won) return { stars, glimmer: 0, firstClear: false, levelUps: [] };
  const firstClear = !(stage.id in save.stars);
  const prevBest = save.stars[stage.id] ?? 0;
  let glimmer = firstClear ? REWARDS.firstClear : REWARDS.repeatClear;
  if (stars.count === 3 && prevBest < 3) glimmer += REWARDS.perfectBonus;
  save.stars[stage.id] = Math.max(prevBest, stars.count);
  save.glimmer += glimmer;
  const exp = stageExp(stage);
  const levelUps = save.team.filter((id) => save.roster[id]).map((id) => grantExp(save.roster[id], id, exp));
  return { stars, glimmer, firstClear, levelUps };
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
