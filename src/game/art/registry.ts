import Phaser from 'phaser';
import { CHARACTERS, getCharacter } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { backgroundCanvas, type BgId } from './backgrounds';
import { portraitCardCanvas, verseArtCanvas } from './cardArt';
import { dollCanvas, drawDoll } from './doll';
import { enemyCanvas } from './enemyArt';
import { iconCanvas, ICON_NAMES } from './icons';
import { makeCanvas, mix, rgba } from './paint';
import { uiTextureSpecs } from './uiTextures';

// Turns procedural canvases into Phaser textures. Base art is built once at boot; large
// portraits and backgrounds are built on first use.

export const ICON_COLORS: Record<string, string> = {
  sun: '#e8a33d', moon: '#8fa7d6', star: '#b886e0',
  might: '#e2be6a', weak: '#b8a0d8', frail: '#e0584c', burn: '#ef8a3a', daze: '#b886e0', regen: '#7fd39a',
  attack: '#e0584c', mass: '#ef8a4a', buff: '#e2be6a', debuff: '#b886e0', shield: '#8fc3e8', heal: '#7fd39a', snuff: '#dcef72',
  star4: '#e2be6a', glimmer: '#dcef72', check: '#7fd39a',
};

export const BATTLE_DOLL_SCALE = 1;
export const PORTRAIT_SCALE = 2.4;

function add(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
}

function headCanvas(charId: string): HTMLCanvasElement {
  const c = getCharacter(charId);
  const size = 160;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, mix(c.palette.primary, '#1a1a1a', 0.35));
  g.addColorStop(1, mix(c.palette.primary, '#0a0a0a', 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2 - 110 * 1.05, size / 2 - 146 * 1.05);
  ctx.scale(1.05, 1.05);
  drawDoll(ctx, c.look);
  ctx.restore();
  ctx.strokeStyle = rgba('#000000', 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

export function registerBaseArt(scene: Phaser.Scene): void {
  for (const s of uiTextureSpecs()) add(scene, s.key, s.canvas);
  for (const name of ICON_NAMES) add(scene, `icon:${name}`, iconCanvas(name, ICON_COLORS[name]));
  for (const c of CHARACTERS) {
    add(scene, `doll:${c.id}`, dollCanvas(c.look, BATTLE_DOLL_SCALE));
    add(scene, `head:${c.id}`, headCanvas(c.id));
    for (const v of [...c.verses, c.finale]) add(scene, `card:${v.id}`, verseArtCanvas(c, v));
  }
  for (const kind of new Set(ENEMIES.map((e) => e.kind))) add(scene, `enemy:${kind}`, enemyCanvas(kind, 1));
}

export function ensureBg(scene: Phaser.Scene, id: BgId): string {
  const key = `bg:${id}`;
  add(scene, key, backgroundCanvas(id));
  return key;
}

export function ensurePortrait(scene: Phaser.Scene, charId: string): string {
  const key = `portrait:${charId}`;
  if (!scene.textures.exists(key)) add(scene, key, dollCanvas(getCharacter(charId).look, PORTRAIT_SCALE));
  return key;
}

export function ensurePortraitCard(scene: Phaser.Scene, charId: string): string {
  const key = `pcard:${charId}`;
  if (!scene.textures.exists(key)) add(scene, key, portraitCardCanvas(getCharacter(charId)));
  return key;
}
