import type Phaser from 'phaser';
import { getStage } from '../data/stages';
import { CHAPTER_ENDINGS, CHAPTER_OPENERS, STAGE_INTERLUDES } from '../data/story';
import { saves } from '../persistence/SaveService';
import { goTo } from '../ui/kit';

// Every way into a stage goes through here, so the story plays no matter which button the
// player used: chapter opener (first time only), then the stage's own intro (first time only).

const seen = (id: string) => saves.hasHint(`cine:${id}`) || saves.hasHint(`story:${id.replace('stage:', '')}`);

export function storyBefore(stageId: string): string[] {
  const st = getStage(stageId);
  const ids: string[] = [];
  const opener = st.index === 1 ? CHAPTER_OPENERS[st.chapter] : undefined;
  if (opener && !seen(opener)) ids.push(opener);
  if (st.intro?.length && !seen(`stage:${stageId}`)) ids.push(`stage:${stageId}`);
  return ids;
}

/** Opens the team screen for a stage, playing any unseen story first. */
export function goToStage(scene: Phaser.Scene, stageId: string): void {
  const ids = storyBefore(stageId);
  if (ids.length) goTo(scene, 'Cinematic', { ids, next: { scene: 'Formation', data: { stageId } } });
  else goTo(scene, 'Formation', { stageId });
}

/** Story owed after winning `stageId` (an interlude or the chapter ending), if not yet seen. */
export function storyAfter(stageId: string): { id: string; chapterEnd: boolean } | null {
  const end = CHAPTER_ENDINGS[stageId];
  if (end && !seen(end)) return { id: end, chapterEnd: true };
  const mid = STAGE_INTERLUDES[stageId];
  return mid && !seen(mid) ? { id: mid, chapterEnd: false } : null;
}

/** Brand-new players: prologue, then straight into the guided first battle. */
export function startPrologue(scene: Phaser.Scene): void {
  scene.scene.start('Cinematic', { ids: ['prologue'], next: { scene: 'Battle', data: { stageId: '1-1' } } });
}
