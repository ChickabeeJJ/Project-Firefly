import Phaser from 'phaser';
import type { VerseDef } from '../data/types';
import { CHARACTERS, getCharacter } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { artScale, dropIn } from './assets';
import { backgroundCanvas, type BgId } from './backgrounds';
import { CARD_H, CARD_W, PCARD_H, PCARD_W, portraitCardCanvas, verseArtCanvas } from './cardArt';
import { dollCanvas, drawDoll } from './doll';
import { enemyCanvas } from './enemyArt';
import { iconCanvas, ICON_NAMES } from './icons';
import { ITEM_ICON_IDS, itemIconCanvas } from './itemIcons';
import { grain, makeCanvas, mix, rgba } from './paint';
import { accentButton, uiTextureSpecs } from './uiTextures';

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
const PAINTED_PORTRAIT_H = 1600;
/** Battle height of painted characters before the 0.85 field scale. */
const PAINTED_DOLL_H = 385;
/** …and no wider than this (full renders with big props or capes are wide). */
const PAINTED_DOLL_W = 420;
/** Battle heights of painted enemies that should not stand as tall as a person. */
const PAINTED_ENEMY_H: Partial<Record<string, number>> = { mothling: 260, lampeater: 320, hound: 310, chimewisp: 410 };

function add(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
}

/** 128 px intent badge: one painted icon, two crossed swords for a mass attack, a dimmed lantern for a snuff. */
function intentCanvas(scene: Phaser.Scene, key: string, kind: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(128, 128);
  const s = size(scene, key);
  const k = 112 / Math.max(s.w, s.h);
  const w = s.w * k;
  const h = s.h * k;
  ctx.imageSmoothingQuality = 'high';
  if (kind === 'mass') {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(64, 64);
      ctx.scale(dir * 0.86, 0.86);
      ctx.drawImage(source(scene, key), -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  } else {
    if (kind === 'snuff') ctx.filter = 'grayscale(0.85) brightness(0.6)';
    ctx.drawImage(source(scene, key), 64 - w / 2, 64 - h / 2, w, h);
  }
  return canvas;
}

/** A 360 px object re-set like the menu icons: about 290 px tall, standing on the shared baseline. */
function onBaseline(scene: Phaser.Scene, key: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(300, 300);
  const s = size(scene, key);
  const k = (0.8 * 300) / Math.max(s.w, s.h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source(scene, key), 150 - (s.w * k) / 2, 275 - s.h * k, s.w * k, s.h * k);
  return canvas;
}

function source(scene: Phaser.Scene, key: string): CanvasImageSource {
  return scene.textures.get(key).getSourceImage() as CanvasImageSource;
}

function size(scene: Phaser.Scene, key: string): { w: number; h: number } {
  const f = scene.textures.getFrame(key);
  return { w: f.width, h: f.height };
}

/** Painted renders whose figure looks to the left; mirrored in battle so the troupe faces the enemy. */
/** Where each painted Luminary's face sits in their full-body art (fractions of width/height). */
export const FACE_POINTS: Record<string, [number, number]> = {
  wren: [0.572, 0.2], odile: [0.495, 0.135], evangeline: [0.45, 0.17], bastian: [0.52, 0.2], augustin: [0.5, 0.08],
  clementine: [0.555, 0.17], delphine: [0.56, 0.17], hesper: [0.61, 0.11], ichabod: [0.62, 0.17], kit: [0.54, 0.125], marigold: [0.6, 0.1], ottoline: [0.6, 0.1], teddy: [0.54, 0.085],
  percival: [0.565, 0.2], rook: [0.55, 0.095], nell: [0.545, 0.115], cassian: [0.575, 0.08],
  sorrel: [0.54, 0.085], lazare: [0.5, 0.08], lys: [0.585, 0.1],
};

/** Painted emblem (ui/motif_<name>, or a stat icon) standing in for each code-drawn card motif. */
const MOTIF_ART: Record<string, string> = {
  candle: 'lantern', lantern: 'lantern', cards: 'hourglass', newspaper: 'scroll', note: 'scroll', crescent: 'orb', swirl: 'orb',
  eye: 'orb', crystal: 'orb', meteor: 'fire', telescope: 'compass', wings: 'dove', metronome: 'metronome', rain: 'umbrella',
  camera: 'key', shield: 'stat_def', fist: 'stat_atk', glove: 'stat_atk',
};

/** Verses whose emblem is a specific painted object (ui/obj_*) rather than their motif's. */
const VERSE_OBJECT: Record<string, string> = {
  percival_front: 'lily', percival_finale: 'lily', cassian_wind: 'watch', cassian_finale: 'watch',
  rook_haymaker: 'letters', rook_onetwo: 'scales', evangeline_noblesse: 'cage',
};
/** Motifs that read better as one of the painted objects. */
const MOTIF_OBJECT: Record<string, string> = { crystal: 'crystal', note: 'quill', eye: 'orb' };

/** Texture key of a verse's painted emblem (the object on its card), or null if it has none. */
export function verseEmblem(scene: Phaser.Scene, v: VerseDef): string | null {
  const obj = VERSE_OBJECT[v.id] ?? MOTIF_OBJECT[v.art.motif];
  return (obj ? dropIn(scene, 'ui', `obj_${obj}`) : null)
    ?? dropIn(scene, 'ui', `motif_${MOTIF_ART[v.art.motif] ?? ''}`)
    ?? (MOTIF_ART[v.art.motif]?.startsWith('stat_') ? dropIn(scene, 'ui', MOTIF_ART[v.art.motif]) : null);
}

export const ART_FACES_LEFT = new Set(['bastian', 'ichabod', 'hesper', 'kit', 'rook', 'nell', 'cassian']);

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

/** Painted lantern (ui/lanternN) on a warm glow, boxed like the procedural rite lanterns. */
function paintedLantern(scene: Phaser.Scene, key: string, glowColor: string): HTMLCanvasElement {
  const W0 = 200;
  const H0 = 240;
  const { canvas, ctx } = makeCanvas(W0, H0);
  const g = ctx.createRadialGradient(W0 / 2, H0 * 0.42, 4, W0 / 2, H0 * 0.42, W0 / 2);
  g.addColorStop(0, rgba(glowColor, 0.7));
  g.addColorStop(1, rgba(glowColor, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W0, H0);
  const s = size(scene, key);
  const k = Math.min((W0 * 1.15) / s.w, (H0 - 4) / s.h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source(scene, key), (W0 - s.w * k) / 2, 2, s.w * k, s.h * k);
  return canvas;
}

export function registerBaseArt(scene: Phaser.Scene): void {
  // Painted lanterns replace the rite's paper lanterns (★3 hexagonal, ★4 round, ★5 star).
  ([['3', 'lantern1', '#ffd27a'], ['4', 'lantern2', '#b48cff'], ['5', 'lantern3', '#ffb030']] as const).forEach(([r, id, col]) => {
    const k = dropIn(scene, 'ui', id);
    if (k) add(scene, `rite:lantern${r}`, paintedLantern(scene, k, col));
  });
  for (const s of uiTextureSpecs()) add(scene, s.key, s.canvas);
  // Painted currency icons: Glimmer crystal everywhere, the gilt star for collected-star totals.
  const crystal = dropIn(scene, 'ui', 'icon_glimmer');
  if (crystal) add(scene, 'icon:glimmer', fitHeight(scene, crystal, 128));
  const star = dropIn(scene, 'ui', 'icon_star');
  add(scene, 'icon:starp', star ? fitHeight(scene, star, 128) : iconCanvas('star4', ICON_COLORS.star4));
  // Painted element badges (ui/icon_sun…) and status icons (ui/status_might…) replace the line icons.
  for (const name of ICON_NAMES) {
    const painted = dropIn(scene, 'ui', `icon_${name}`) ?? dropIn(scene, 'ui', `status_${name}`);
    add(scene, `icon:${name}`, painted ? fitHeight(scene, painted, 128) : iconCanvas(name, ICON_COLORS[name]));
  }
  // Enemy intent chips use painted icons: the stat set, the status set and a snuffed lantern.
  const INTENT_ART: Record<string, string> = { attack: 'stat_atk', mass: 'stat_atk', shield: 'stat_def', heal: 'stat_hp', buff: 'status_might', debuff: 'status_frail', snuff: 'motif_lantern' };
  for (const [kind, id] of Object.entries(INTENT_ART)) {
    const art = dropIn(scene, 'ui', id);
    if (art) add(scene, `intent:${kind}`, intentCanvas(scene, art, kind));
  }
  for (const [k, id] of [['HP', 'hp'], ['ATK', 'atk'], ['DEF', 'def']] as const) {
    const art = dropIn(scene, 'ui', `stat_${id}`);
    if (art) add(scene, `stat:${k}`, fitHeight(scene, art, 96));
  }
  for (const id of ['troupe', 'story', 'atlas', 'achievements', 'notice', 'profile', 'gramophone', 'settings', 'pawnshop', 'menu', 'rite']) {
    const k = dropIn(scene, 'ui', `menu_${id}`);
    if (k) add(scene, `menu:${id}`, fitHeight(scene, k, 300));
  }
  // Sign-in sheet: the pocket watch, set on the same baseline as the painted menu icons.
  const watch = dropIn(scene, 'ui', 'obj_watch');
  if (watch) add(scene, 'menu:signin', onBaseline(scene, watch));
  for (const id of ITEM_ICON_IDS) add(scene, `item:${id}`, dropIn(scene, 'ui', `item_${id}`) ? fitHeight(scene, dropIn(scene, 'ui', `item_${id}`)!, 128) : itemIconCanvas(id));
  for (const c of CHARACTERS) {
    const battle = dropIn(scene, 'battle', c.id) ?? dropIn(scene, 'characters', c.id);
    // Painted figures are full-proportioned (not chibi) and wider, so they stand a little shorter.
    add(scene, `doll:${c.id}`, battle ? facingRight(fitBox(scene, battle, Math.round(PAINTED_DOLL_H * artScale(battle)), PAINTED_DOLL_W), c.id) : dollCanvas(c.look, BATTLE_DOLL_SCALE));
    add(scene, `head:${c.id}`, headCanvas(scene, c.id));
    // Mid-size body art (battle/<id>, 640 px) keeps boot light; full art streams in later.
    const body = dropIn(scene, 'battle', c.id) ?? dropIn(scene, 'characters', c.id);
    const paintedBody = body ? { img: source(scene, body), ...size(scene, body) } : undefined;
    const vp = dropIn(scene, 'ui', `vpanel_${panelFor(c.id)}`);
    const panel = vp ? { img: source(scene, vp), ...size(scene, vp) } : undefined;
    for (const v of [...c.verses, c.finale]) {
      const painted = dropIn(scene, 'cards', v.id);
      const mk = verseEmblem(scene, v);
      const motifArt = mk ? { img: source(scene, mk), ...size(scene, mk) } : undefined;
      add(scene, `card:${v.id}`, painted ? cardCanvasFromImage(scene, painted) : verseArtCanvas(c, v, paintedBody, panel, motifArt, FACE_POINTS[c.id]));
    }
  }
  for (const e of ENEMIES) {
    const painted = dropIn(scene, 'enemies', e.id);
    add(scene, `enemy:${e.kind}`, painted ? dimmed(fitHeight(scene, painted, PAINTED_ENEMY_H[e.kind] ?? (e.boss ? 520 : 400))) : enemyCanvas(e.kind, 1));
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
  // Full art if it has streamed in yet; until then the 640 px battle art stands in.
  const painted = dropIn(scene, 'characters', charId) ?? dropIn(scene, 'battle', charId);
  if (painted) {
    const s0 = size(scene, painted);
    // Art already within budget is used as-is (no second copy in memory).
    if (s0.h <= PAINTED_PORTRAIT_H) return painted;
    const key = `hfp:${charId}`;
    if (!scene.textures.exists(key)) {
      const s = s0;
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

/**
 * Element card backgrounds (ui/panel_<name>), chosen per Luminary from their element, with the
 * palette deciding between the warm / cool variants. Missing files fall back to a gradient.
 */
const PANELS: Record<string, string> = {
  crimson: '#a8322e', verdant: '#3f6a3a', tide: '#2c3f86', gilt: '#c8a24a', amethyst: '#6a3f9a', umber: '#5a4636',
};
const MOOD_PANELS: Record<string, string[]> = { sun: ['crimson', 'gilt', 'verdant'], moon: ['tide', 'umber'], star: ['amethyst', 'verdant', 'umber'] };

export function panelFor(charId: string): string {
  const c = getCharacter(charId);
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const p = hex(c.palette.primary);
  let best = MOOD_PANELS[c.mood][0];
  let bestD = Infinity;
  for (const name of MOOD_PANELS[c.mood]) {
    const q = hex(PANELS[name]);
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

export function elementPanel(scene: Phaser.Scene, charId: string): string | null {
  return dropIn(scene, 'ui', `panel_${panelFor(charId)}`);
}

export function ensurePortraitCard(scene: Phaser.Scene, charId: string): string {
  const key = `pcard:${charId}`;
  if (scene.textures.exists(key)) return key;
  const painted = dropIn(scene, 'battle', charId) ?? dropIn(scene, 'characters', charId);
  if (!painted) {
    add(scene, key, portraitCardCanvas(getCharacter(charId)));
    return key;
  }
  // Painted card: palette backdrop, upper-body crop, same frame as the procedural card.
  const c = getCharacter(charId);
  const { canvas, ctx } = makeCanvas(PCARD_W, PCARD_H);
  const panel = elementPanel(scene, charId);
  if (panel) {
    const ps = size(scene, panel);
    cover(ctx, source(scene, panel), ps.w, ps.h, PCARD_W, PCARD_H, 0.5);
    ctx.fillStyle = rgba('#0b0b0e', 0.18);
    ctx.fillRect(0, 0, PCARD_W, PCARD_H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, PCARD_H);
    g.addColorStop(0, mix(c.palette.primary, '#ffffff', 0.12));
    g.addColorStop(1, mix(c.palette.primary, c.palette.ink, 0.75));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, PCARD_W, PCARD_H);
  }
  const s = size(scene, painted);
  // Upper-body framing with headroom: the figure starts ~7% below the top edge.
  const scale = Math.min((PCARD_W * 1.5) / s.w, (PCARD_H * 1.08) / s.h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source(scene, painted), (PCARD_W - s.w * scale) / 2, PCARD_H * 0.07, s.w * scale, s.h * scale);
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
  grain(ctx, PCARD_W, PCARD_H, 0.015, charId.length * 31);
  add(scene, key, canvas);
  return key;
}

/** Re-renders the textures that carry the accent colour after the player picks a new theme. */
export function refreshThemeTextures(scene: Phaser.Scene): void {
  const tex = scene.textures;
  if (tex.exists('ui:btnAmber')) tex.remove('ui:btnAmber');
  tex.addCanvas('ui:btnAmber', accentButton());
}
