import { CHARACTERS } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { CHAPTERS, STAGES } from '../data/stages';
import type { SaveData } from '../persistence/schema';

// Milestones shown in the Achievements panel. Each pays Glimmer once, when claimed.

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  reward: number;
  /** Current progress and the goal. */
  progress: (s: SaveData) => [number, number];
}

const totalStars = (s: SaveData) => Object.values(s.stars).reduce((a, b) => a + b, 0);
const chapterClears = (s: SaveData, ch: number) => STAGES.filter((st) => st.chapter === ch && st.id in s.stars).length;
const maxLevel = (s: SaveData) => Math.max(...Object.values(s.roster).map((o) => o.level));

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_light', name: 'First Light', desc: 'Finish the tutorial battle.', reward: 100, progress: (s) => [s.stars['1-1'] !== undefined ? 1 : 0, 1] },
  ...CHAPTERS.map((ch, i): Achievement => {
    const n = STAGES.filter((st) => st.chapter === ch.id).length;
    return { id: `chapter_${ch.id}`, name: ch.name, desc: `Clear every stage of Chapter ${ch.id}.`, reward: 300 + i * 150, progress: (s) => [chapterClears(s, ch.id), n] };
  }),
  { id: 'stars_30', name: 'Starlit', desc: 'Earn 30 stars.', reward: 200, progress: (s) => [totalStars(s), 30] },
  { id: 'stars_all', name: 'Every Lamp Ablaze', desc: `Earn all ${STAGES.length * 3} stars.`, reward: 1200, progress: (s) => [totalStars(s), STAGES.length * 3] },
  { id: 'perfect_10', name: 'Encore!', desc: 'Earn 3 stars on 10 stages.', reward: 300, progress: (s) => [Object.values(s.stars).filter((v) => v === 3).length, 10] },
  { id: 'rite_1', name: 'The First Rite', desc: 'Hold a Lantern Rite.', reward: 160, progress: (s) => [s.totalPulls, 1] },
  { id: 'rite_50', name: 'Devoted', desc: 'Light the Lantern 50 times.', reward: 480, progress: (s) => [s.totalPulls, 50] },
  { id: 'troupe_8', name: 'A Full Bill', desc: 'Recruit 8 Luminaries.', reward: 300, progress: (s) => [Object.keys(s.roster).length, 8] },
  { id: 'troupe_all', name: 'The Whole Company', desc: `Recruit all ${CHARACTERS.length} Luminaries.`, reward: 1000, progress: (s) => [Object.keys(s.roster).length, CHARACTERS.length] },
  { id: 'level_20', name: 'Seasoned', desc: 'Raise a Luminary to Lv 20.', reward: 200, progress: (s) => [maxLevel(s), 20] },
  { id: 'level_40', name: 'Headliner', desc: 'Raise a Luminary to Lv 40.', reward: 500, progress: (s) => [maxLevel(s), 40] },
  { id: 'atlas_8', name: 'Field Notes', desc: 'Meet 8 kinds of Dimmed.', reward: 200, progress: (s) => [s.seen.length, 8] },
  { id: 'atlas_all', name: 'Complete Atlas', desc: `Meet all ${ENEMIES.length} kinds of Dimmed.`, reward: 600, progress: (s) => [s.seen.length, ENEMIES.length] },
];

export type AchievementState = 'locked' | 'ready' | 'claimed';

export function achievementState(s: SaveData, a: Achievement): AchievementState {
  if (s.claimed.includes(a.id)) return 'claimed';
  const [cur, goal] = a.progress(s);
  return cur >= goal ? 'ready' : 'locked';
}

export function claimableCount(s: SaveData): number {
  return ACHIEVEMENTS.filter((a) => achievementState(s, a) === 'ready').length;
}

/** Pays the reward once; returns the Glimmer granted (0 if not claimable). */
export function claimAchievement(s: SaveData, id: string): number {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a || achievementState(s, a) !== 'ready') return 0;
  s.claimed.push(id);
  s.glimmer += a.reward;
  return a.reward;
}

/** Lamplighter level shown on the lobby badge. */
export function playerLevel(s: SaveData): number {
  return 1 + Math.floor(totalStars(s) / 2);
}

export { totalStars };
