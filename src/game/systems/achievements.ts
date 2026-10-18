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
const maxInsight = (s: SaveData) => Math.max(...Object.values(s.roster).map((o) => o.insight));
const perfects = (s: SaveData) => Object.values(s.stars).filter((v) => v === 3).length;
const owned = (s: SaveData, rarity: number) => CHARACTERS.filter((c) => c.rarity === rarity && s.roster[c.id]).length;
const maxResonance = (s: SaveData) => Math.max(0, ...Object.values(s.roster).map((o) => o.resonance));
const maxLevel = (s: SaveData) => Math.max(0, ...Object.values(s.roster).map((o) => o.level));
const atInsight = (s: SaveData, n: number) => Object.values(s.roster).filter((o) => o.insight >= n).length;
const watched = (s: SaveData, prefix: string) => s.hints.filter((h) => h.startsWith(`cine:${prefix}`)).length;
const chapterPerfect = (s: SaveData, ch: number) => STAGES.filter((st) => st.chapter === ch && s.stars[st.id] === 3).length;
const bossDown = (s: SaveData, id: string) => (id in s.stars ? 1 : 0);

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
  { id: 'level_20', name: 'Seasoned', desc: 'Kindle a Luminary to Kindle I.', reward: 200, progress: (s) => [maxInsight(s), 1] },
  { id: 'level_40', name: 'Headliner', desc: 'Kindle a Luminary to Kindle II.', reward: 500, progress: (s) => [maxInsight(s), 2] },
  { id: 'atlas_8', name: 'Field Notes', desc: 'Meet 8 kinds of Dimmed.', reward: 200, progress: (s) => [s.seen.length, 8] },
  { id: 'atlas_all', name: 'Complete Atlas', desc: `Meet all ${ENEMIES.length} kinds of Dimmed.`, reward: 600, progress: (s) => [s.seen.length, ENEMIES.length] },
  // Story
  { id: 'boss_curtain', name: 'Curtain Down', desc: 'Defeat the Curtain-Caller.', reward: 150, progress: (s) => [bossDown(s, '1-8'), 1] },
  { id: 'boss_gloam', name: 'Remember My Name', desc: 'Defeat Madame Gloam.', reward: 200, progress: (s) => [bossDown(s, '2-8'), 1] },
  { id: 'boss_brine', name: 'The Tide Turns', desc: 'Defeat Keeper Brine.', reward: 250, progress: (s) => [bossDown(s, '3-8'), 1] },
  { id: 'boss_hourless', name: 'Let the Morning Come', desc: 'Defeat the Hourless King.', reward: 400, progress: (s) => [bossDown(s, '4-8'), 1] },
  { id: 'reader_5', name: 'Night Reader', desc: 'Watch 5 story scenes to the end.', reward: 120, progress: (s) => [watched(s, ''), 5] },
  { id: 'reader_ch1', name: 'Dead-Letter Office', desc: 'Watch every Chapter I interlude.', reward: 150, progress: (s) => [watched(s, 'ch1_i'), 4] },
  { id: 'reader_ch2', name: 'Front of House', desc: 'Watch every Chapter II interlude.', reward: 150, progress: (s) => [watched(s, 'ch2_i'), 5] },
  { id: 'reader_ch3', name: 'Message in a Bottle', desc: 'Watch every Chapter III interlude.', reward: 150, progress: (s) => [watched(s, 'ch3_i'), 5] },
  { id: 'reader_ch4', name: 'Four Hundred and Thirteen Steps', desc: 'Watch every Chapter IV interlude.', reward: 150, progress: (s) => [watched(s, 'ch4_i'), 5] },
  // Mastery
  ...CHAPTERS.map((ch): Achievement => {
    const n = STAGES.filter((st) => st.chapter === ch.id).length;
    return { id: `perfect_ch${ch.id}`, name: `Flawless · ${ch.name}`, desc: `Earn 3 stars on every Chapter ${ch.id} stage.`, reward: 250, progress: (s) => [chapterPerfect(s, ch.id), n] };
  }),
  { id: 'perfect_3', name: 'Bravo', desc: 'Earn 3 stars on 3 stages.', reward: 100, progress: (s) => [perfects(s), 3] },
  { id: 'perfect_25', name: 'Standing Ovation', desc: 'Earn 3 stars on 25 stages.', reward: 600, progress: (s) => [perfects(s), 25] },
  { id: 'stars_10', name: 'First Constellation', desc: 'Earn 10 stars.', reward: 80, progress: (s) => [totalStars(s), 10] },
  { id: 'stars_60', name: 'Night Sky', desc: 'Earn 60 stars.', reward: 400, progress: (s) => [totalStars(s), 60] },
  // Rite
  { id: 'rite_10', name: 'A String of Lanterns', desc: 'Light the Lantern 10 times.', reward: 200, progress: (s) => [s.totalPulls, 10] },
  { id: 'rite_100', name: 'Lake of Lights', desc: 'Light the Lantern 100 times.', reward: 800, progress: (s) => [s.totalPulls, 100] },
  { id: 'five_1', name: 'A Star Falls', desc: 'Recruit a ★5 Luminary.', reward: 200, progress: (s) => [owned(s, 5), 1] },
  { id: 'five_3', name: 'Constellation', desc: 'Recruit three ★5 Luminaries.', reward: 500, progress: (s) => [owned(s, 5), 3] },
  { id: 'four_all', name: 'Supporting Cast', desc: 'Recruit every ★4 Luminary.', reward: 400, progress: (s) => [owned(s, 4), CHARACTERS.filter((c) => c.rarity === 4).length] },
  { id: 'troupe_4', name: 'A Quartet', desc: 'Recruit 4 Luminaries.', reward: 100, progress: (s) => [Object.keys(s.roster).length, 4] },
  { id: 'troupe_12', name: 'Repertory Company', desc: 'Recruit 12 Luminaries.', reward: 500, progress: (s) => [Object.keys(s.roster).length, 12] },
  { id: 'resonance_1', name: 'Echo', desc: 'Deepen any Luminary’s Echo.', reward: 100, progress: (s) => [maxResonance(s), 1] },
  { id: 'resonance_max', name: 'Perfect Pitch', desc: 'Fill a Luminary’s Echo to the brim.', reward: 600, progress: (s) => [maxResonance(s), 5] },
  // Growth
  { id: 'lv_30', name: 'Apprentice', desc: 'Raise a Luminary to the level cap before their first Kindling.', reward: 120, progress: (s) => [Math.max(maxLevel(s), maxInsight(s) > 0 ? 30 : 0), 30] },
  { id: 'insight_3', name: 'Luminous', desc: 'Kindle a ★5 Luminary to Kindle III.', reward: 900, progress: (s) => [maxInsight(s), 3] },
  { id: 'insight_team', name: 'Lamplit Troupe', desc: 'Have four Luminaries at Kindle I or higher.', reward: 400, progress: (s) => [atInsight(s, 1), 4] },
  { id: 'hoard', name: 'Magpie', desc: 'Hold 5,000 Glimmer at once.', reward: 150, progress: (s) => [s.glimmer, 5000] },
  { id: 'sovereigns', name: 'Thirteen-Hour Coins', desc: 'Hold 50,000 Brass Sovereigns.', reward: 200, progress: (s) => [s.items.sovereign, 50000] },
  { id: 'atlas_4', name: 'Sketchbook', desc: 'Meet 4 kinds of Dimmed.', reward: 80, progress: (s) => [s.seen.length, 4] },
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
