import type { StatBlock } from '../data/types';
import { ALLY_LEVEL_GROWTH, ENEMY_ATK_SCALE, ENEMY_HP_SCALE, ENEMY_LEVEL_GROWTH, RESONANCE_GROWTH } from './rules';

export function allyStats(base: StatBlock, level: number, resonance: number): StatBlock {
  const lv = 1 + ALLY_LEVEL_GROWTH * (level - 1);
  const res = 1 + RESONANCE_GROWTH * resonance;
  return {
    hp: Math.round(base.hp * lv * res),
    atk: Math.round(base.atk * lv * res),
    def: Math.round(base.def * lv),
  };
}

export function enemyStats(base: StatBlock, level: number): StatBlock {
  const lv = 1 + ENEMY_LEVEL_GROWTH * (level - 1);
  return {
    hp: Math.round(base.hp * lv * ENEMY_HP_SCALE),
    atk: Math.round(base.atk * lv * ENEMY_ATK_SCALE),
    def: Math.round(base.def * lv),
  };
}
