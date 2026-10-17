// Dev-only art preview (not part of the game bundle): renders procedural art for inspection.
import { CHARACTERS } from './game/data/characters';
import { dollCanvas } from './game/art/doll';
import { enemyCanvas } from './game/art/enemyArt';
import type { EnemyKind } from './game/data/types';
import { verseArtCanvas, CARD_W, CARD_H } from './game/art/cardArt';
import { backgroundCanvas, type BgId } from './game/art/backgrounds';

const which = new URLSearchParams(location.search).get('v') ?? 'dolls';
const out = document.createElement('canvas');
document.body.appendChild(out);
const ctx = out.getContext('2d')!;

if (which === 'dolls') {
  const scale = 1.2;
  out.width = 5 * 270;
  out.height = 2 * 470;
  ctx.fillStyle = '#4a5654';
  ctx.fillRect(0, 0, out.width, out.height);
  CHARACTERS.forEach((c, i) => {
    const cv = dollCanvas(c.look, scale);
    ctx.drawImage(cv, (i % 5) * 270, Math.floor(i / 5) * 470);
    ctx.fillStyle = '#fff';
    ctx.font = '16px serif';
    ctx.fillText(c.name, (i % 5) * 270 + 10, Math.floor(i / 5) * 470 + 462);
  });
}
if (which === 'enemies') {
  const kinds: EnemyKind[] = ['mothling', 'usher', 'mannequin', 'hound', 'widow', 'lampeater', 'curtaincaller', 'gloam'];
  out.width = 1800;
  out.height = 1100;
  const g = ctx.createLinearGradient(0, 0, 0, out.height);
  g.addColorStop(0, '#2e3a3c');
  g.addColorStop(1, '#151a1d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, out.width, out.height);
  let x = 10;
  let y = 10;
  for (const k of kinds) {
    const cv = enemyCanvas(k, 0.9);
    if (x + cv.width > out.width) { x = 10; y += 560; }
    ctx.drawImage(cv, x, y);
    x += cv.width + 10;
  }
}
if (which === 'cards') {
  const cols = 10;
  out.width = cols * (CARD_W * 0.6 + 8);
  out.height = 3 * (CARD_H * 0.6 + 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, out.width, out.height);
  let i = 0;
  for (const c of CHARACTERS) {
    for (const v of [...c.verses, c.finale]) {
      const cv = verseArtCanvas(c, v);
      const col = Math.floor(i / 3);
      const row = i % 3;
      ctx.drawImage(cv, col * (CARD_W * 0.6 + 8), row * (CARD_H * 0.6 + 8), CARD_W * 0.6, CARD_H * 0.6);
      i++;
    }
  }
}
if (which.startsWith('bg_')) {
  const cv = backgroundCanvas(which.slice(3) as BgId);
  out.width = 1920;
  out.height = 1080;
  ctx.drawImage(cv, 0, 0, 1920, 1080);
}
(window as unknown as { __ready: boolean }).__ready = true;
