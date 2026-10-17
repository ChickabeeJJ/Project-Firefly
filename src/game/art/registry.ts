import Phaser from 'phaser';
import { CHARACTERS, getCharacter } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { dropIn } from './assets';
import { backgroundCanvas, type BgId } from './backgrounds';
import { CARD_H, CARD_W, PCARD_H, PCARD_W, portraitCardCanvas, verseArtCanvas } from './cardArt';
import { dollCanvas, drawDoll } from './doll';
import { enemyCanvas } from './enemyArt';
import { iconCanvas, ICON_NAMES } from './icons';
import { grain, makeCanvas, mix, rgba } from './paint';
import { uiTextureSpecs } from './uiTextures';

// Turns art into Phaser textures. Drop-in images (src/assets/art) win over procedural art and are
// normalised to the same sizes, so scenes never need to know which one they got.

export const ICON_COLORS: Record<string, string> = {
  sun: '#e8a33d', moon: '#8fa7d6', star: '#b886e0',
  might: '#e2be6a', weak: '#b8a0d8', frail: '#e0584c', burn: '#ef8a3a', daze: '#b886e0', regen: '#7fd39a',
  attack: '#e0584c', mass: '#ef8a4a', buff: '#e2be6a', debuff: '#b886e0', shield: '#8fc3e8', heal: '#7fd39a', snuff: '#dcef72',
  star4: '#e2be6a', glimmer: '#dcef72', check: '#7fd39a',
};

export const BATTLE_DOLL_SCALE = 1;
export const PORTRAIT_SCALE = 2.4;
/** Painted portraits are stored at this height (memory cap). */
const PAINTED_PORTRAIT_H = 1200;
/** Battle height of painted characters before the 0.85 field scale. */
const PAINTED_DOLL_H = 330;
/** …and no wider than this (full renders with big props or capes are wide). */
const PAINTED_DOLL_W = 360;
/** Battle heights of painted enemies that should not stand as tall as a person. */
const PAINTED_ENEMY_H: Partial<Record<string, number>> = { mothling: 230, lampeater: 280, hound: 270, chimewisp: 360 };

function add(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
}

function source(scene: Phaser.Scene, key: string): CanvasImageSource {
  return scene.textures.get(key).getSourceImage() as CanvasImageSource;
}

function size(scene: Phaser.Scene, key: string): { w: number; h: number } {
  const f = scene.textures.getFrame(key);
  return { w: f.width, h: f.height };
}

/** Painted renders whose figure looks to the left; mirrored in battle so the troupe faces the enemy. */
export const ART_FACES_LEFT = new Set(['bastian', 'ichabod', 'hesper']);

function facingRight(canvas: HTMLCanvasElement, charId: string): HTMLCanvasElement {
  if (!ART_FACES_LEFT.has(charId)) return canvas;
  const { canvas: out, ctx } = makeCanvas(canvas.width, canvas.height);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

/** Image resized to fit inside a box, keeping its aspect. */
function fitBox(scene: Phaser.Scene, key: string, maxH: number, maxW: number): HTMLCanvasElement {
  const s = size(scene, key);
  return fitHeight(scene, key, Math.min(maxH, Math.round((maxW * s.h) / s.w)));
}

/** Image resized to a fixed height, keeping its aspect (bottom-centre usage). */
function fitHeight(scene: Phaser.Scene, key: string, height: number): HTMLCanvasElement {
  const s = size(scene, key);
  const w = Math.max(1, Math.round((s.w * height) / s.h));
  const { canvas, ctx } = makeCanvas(w, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source(scene, key), 0, 0, w, height);
  return canvas;
}

/** Image scaled to cover a box, anchored horizontally centred and vertically at `anchorY` (0 top, 1 bottom). */
function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, w: number, h: number, anchorY = 0.5, zoom = 1): void {
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - dw) / 2, (h - dh) * anchorY, dw, dh);
}

function headCanvas(scene: Phaser.Scene, charId: string): HTMLCanvasElement {
  const c = getCharacter(charId);
  const sz = 160;
  const { canvas, ctx } = makeCanvas(sz, sz);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sz / 2, sz / 2, sz / 2 - 2, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, sz);
  g.addColorStop(0, mix(c.palette.primary, '#1a1a1a', 0.35));
  g.addColorStop(1, mix(c.palette.primary, '#0a0a0a', 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sz, sz);
  const painted = dropIn(scene, 'heads', charId);
  if (painted) {
    const s = size(scene, painted);
    cover(ctx, source(scene, painted), s.w, s.h, sz, sz, 0.3);
  } else {
    ctx.translate(sz / 2 - 110 * 1.05, sz / 2 - 146 * 1.05);
    ctx.scale(1.05, 1.05);
    drawDoll(ctx, c.look);
  }
  ctx.restore();
  ctx.strokeStyle = rgba('#000000', 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sz / 2, sz / 2, sz / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

function cardCanvasFromImage(scene: Phaser.Scene, key: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CARD_W, CARD_H);
  const s = size(scene, key);
  cover(ctx, source(scene, key), s.w, s.h, CARD_W, CARD_H, 0.4);
  return canvas;
}

/** Painted enemies get a faint violet cast so the Dimmed read as foes next to the troupe. */
function dimmed(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, 'rgba(70, 40, 110, 0.04)');
  g.addColorStop(1, 'rgba(30, 14, 50, 0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

export function registerBaseArt(scene: Phaser.Scene): void {
  for (const s of uiTextureSpecs()) add(scene, s.key, s.canvas);
  for (const name of ICON_NAMES) add(scene, `icon:${name}`, iconCanvas(name, ICON_COLORS[name]));
  for (const c of CHARACTERS) {
    const battle = dropIn(scene, 'battle', c.id) ?? dropIn(scene, 'characters', c.id);
    // Painted figures are full-proportioned (not chibi) and wider, so they stand a little shorter.
    add(scene, `doll:${c.id}`, battle ? facingRight(fitBox(scene, battle, PAINTED_DOLL_H, PAINTED_DOLL_W), c.id) : dollCanvas(c.look, BATTLE_DOLL_SCALE));
    add(scene, `head:${c.id}`, headCanvas(scene, c.id));
    const body = dropIn(scene, 'characters', c.id);
    const paintedBody = body ? { img: source(scene, body), ...size(scene, body) } : undefined;
    for (const v of [...c.verses, c.finale]) {
      const painted = dropIn(scene, 'cards', v.id);
      add(scene, `card:${v.id}`, painted ? cardCanvasFromImage(scene, painted) : verseArtCanvas(c, v, paintedBody));
    }
  }
  for (const e of ENEMIES) {
    const painted = dropIn(scene, 'enemies', e.id);
    add(scene, `enemy:${e.kind}`, painted ? dimmed(fitHeight(scene, painted, PAINTED_ENEMY_H[e.kind] ?? (e.boss ? 470 : 350))) : enemyCanvas(e.kind, 1));
  }
}

export function ensureBg(scene: Phaser.Scene, id: BgId): string {
  const painted = dropIn(scene, 'bg', id);
  if (painted) return painted;
  const key = `bg:${id}`;
  add(scene, key, backgroundCanvas(id));
  return key;
}

/** Large standing portrait. Painted art keys start with "hf:" — size them with fitPortrait(). */
export function ensurePortrait(scene: Phaser.Scene, charId: string): string {
  const painted = dropIn(scene, 'characters', charId);
  if (painted) {
    const key = `hfp:${charId}`;
    if (!scene.textures.exists(key)) {
      const s = size(scene, painted);
      add(scene, key, s.h > PAINTED_PORTRAIT_H ? fitHeight(scene, painted, PAINTED_PORTRAIT_H) : fitHeight(scene, painted, s.h));
    }
    return key;
  }
  const key = `portrait:${charId}`;
  if (!scene.textures.exists(key)) add(scene, key, dollCanvas(getCharacter(charId).look, PORTRAIT_SCALE));
  return key;
}

export function isPaintedPortrait(key: string): boolean {
  return key.startsWith('hfp:');
}

export function ensurePortraitCard(scene: Phaser.Scene, charId: string): string {
  const key = `pcard:${charId}`;
  if (scene.textures.exists(key)) return key;
  const painted = dropIn(scene, 'characters', charId);
  if (!painted) {
    add(scene, key, portraitCardCanvas(getCharacter(charId)));
    return key;
  }
  // Painted card: palette backdrop, upper-body crop, same frame as the procedural card.
  const c = getCharacter(charId);
  const { canvas, ctx } = makeCanvas(PCARD_W, PCARD_H);
  const g = ctx.createLinearGradient(0, 0, 0, PCARD_H);
  g.addColorStop(0, mix(c.palette.primary, '#ffffff', 0.12));
  g.addColorStop(1, mix(c.palette.primary, c.palette.ink, 0.75));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PCARD_W, PCARD_H);
  const s = size(scene, painted);
  const scale = Math.min((PCARD_W * 1.7) / s.w, (PCARD_H * 1.15) / s.h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source(scene, painted), (PCARD_W - s.w * scale) / 2, -PCARD_H * 0.02, s.w * scale, s.h * scale);
  const shadeG = ctx.createLinearGradient(0, PCARD_H * 0.62, 0, PCARD_H);
  shadeG.addColorStop(0, rgba('#0b0b0e', 0));
  shadeG.addColorStop(1, rgba('#0b0b0e', 0.95));
  ctx.fillStyle = shadeG;
  ctx.fillRect(0, PCARD_H * 0.62, PCARD_W, PCARD_H * 0.38);
  ctx.strokeStyle = '#0b0b0e';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, PCARD_W, PCARD_H);
  ctx.strokeStyle = rgba('#f3ead6', 0.7);
  ctx.lineWidth = 2;
  ctx.strokeRect(9, 9, PCARD_W - 18, PCARD_H - 18);
  grain(ctx, PCARD_W, PCARD_H, 0.04, charId.length * 31);
  add(scene, key, canvas);
  return key;
}
