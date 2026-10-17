import type Phaser from 'phaser';
import { getStage } from '../data/stages';
import { CHAPTER_ENDINGS, CHAPTER_OPENERS } from '../data/story';
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

/** The chapter-ending cinematic owed after winning `stageId`, if any and not yet seen. */
export function storyAfter(stageId: string): string | null {
  const id = CHAPTER_ENDINGS[stageId];
  return id && !seen(id) ? id : null;
}

/** Brand-new players: prologue, then straight into the guided first battle. */
export function startPrologue(scene: Phaser.Scene): void {
  scene.scene.start('Cinematic', { ids: ['prologue'], next: { scene: 'Battle', data: { stageId: '1-1' } } });
}
