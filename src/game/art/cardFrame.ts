import { CARD_H, CARD_W } from './cardArt';
import { type Ctx, grain, makeCanvas, rgba, roundRectPath } from './paint';

// Verse card frames, in the spirit of a 1920s theatre playbill crossed with a tarot deck:
// ink bevel, double gilt rule, fan filigree in every corner, a portrait medallion, a rank
// cartouche on top and an engraved nameplate below. Finales are gold leaf with a sunburst crown.
// Everything outside the art window is opaque, so any illustration sits inside the same frame.

export const FRAME = {
  /** Art window inset from the card edge. */
  inset: 11,
  /** Portrait medallion centre and radius. */
  medal: { x: 40, y: 42, r: 29 },
  /** Rank cartouche centre. */
  rank: { x: CARD_W / 2 + 18, y: 26 },
  /** Nameplate top edge. */
  plateY: CARD_H - 74,
  /** Type seal centre (straddles art and plate). */
  seal: { x: CARD_W / 2, y: CARD_H - 74 },
};

interface Metal {
  hi: string;
  mid: string;
  lo: string;
}

const BRASS: Metal = { hi: '#f2dba0', mid: '#b98e46', lo: '#6e5226' };
const GOLD: Metal = { hi: '#fff0b8', mid: '#e0b44a', lo: '#8a5e14' };

function metalGrad(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, m: Metal): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, m.hi);
  g.addColorStop(0.35, m.mid);
  g.addColorStop(0.55, m.hi);
  g.addColorStop(1, m.lo);
  return g;
}

/** Quarter fan with ticks and a bead, drawn in the top-left corner and mirrored. */
function cornerFan(ctx: Ctx, m: Metal, big: boolean): void {
  const r = big ? 40 : 30;
  ctx.save();
  ctx.strokeStyle = metalGrad(ctx, 0, 0, r, r, m);
  ctx.fillStyle = metalGrad(ctx, 0, 0, r, r, m);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(6, 6, r, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(6, 6, r - 7, 0, Math.PI / 2);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const a = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(6 + Math.cos(a) * (r - 7), 6 + Math.sin(a) * (r - 7));
    ctx.lineTo(6 + Math.cos(a) * r, 6 + Math.sin(a) * r);
    ctx.stroke();
  }
  // stepped deco notch
  ctx.fillRect(6, 6, 14, 3);
  ctx.fillRect(6, 6, 3, 14);
  ctx.beginPath();
  ctx.arc(6 + r * 0.72, 6 + r * 0.72, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function corners(ctx: Ctx, m: Metal, big: boolean): void {
  const pts: [number, number, number, number][] = [[0, 0, 1, 1], [CARD_W, 0, -1, 1], [0, CARD_H, 1, -1], [CARD_W, CARD_H, -1, -1]];
  for (const [x, y, sx, sy] of pts) {
    ctx.save();
    ctx.translate(x + sx * 3, y + sy * 3);
    ctx.scale(sx, sy);
    cornerFan(ctx, m, big);
    ctx.restore();
  }
}

/** Frame mask: everything except the art window, filled with the bevel. */
function bevel(ctx: Ctx, m: Metal, gold: boolean): void {
  const i = FRAME.inset;
  ctx.save();
  const outer = roundRectPath(0, 0, CARD_W, CARD_H, 12);
  const inner = roundRectPath(i, i, CARD_W - i * 2, CARD_H - i * 2, 5);
  const band = new Path2D();
  band.addPath(outer);
  band.addPath(inner);
  ctx.fillStyle = gold ? '#2a1c08' : '#121014';
  ctx.fill(band, 'evenodd');
  // outer ink line + gilt rule + hairline
  ctx.strokeStyle = '#050406';
  ctx.lineWidth = 3;
  ctx.stroke(roundRectPath(1.5, 1.5, CARD_W - 3, CARD_H - 3, 11));
  ctx.strokeStyle = metalGrad(ctx, 0, 0, CARD_W, CARD_H, m);
  ctx.lineWidth = gold ? 4 : 2.5;
  ctx.stroke(roundRectPath(5, 5, CARD_W - 10, CARD_H - 10, 9));
  ctx.lineWidth = 1.2;
  ctx.stroke(roundRectPath(i - 1, i - 1, CARD_W - (i - 1) * 2, CARD_H - (i - 1) * 2, 6));
  ctx.restore();
  // inner shadow on the art so the frame reads as raised
  ctx.save();
  ctx.clip(inner);
  const sh = 16;
  for (const [x0, y0, x1, y1] of [[i, i, i + sh, i], [i, i, i, i + sh], [CARD_W - i, i, CARD_W - i - sh, i], [i, CARD_H - i, i, CARD_H - i - sh]] as const) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba('#000000', 0.55));
    g.addColorStop(1, rgba('#000000', 0));
    ctx.fillStyle = g;
    ctx.fillRect(i, i, CARD_W - i * 2, CARD_H - i * 2);
  }
  ctx.restore();
}

function medallion(ctx: Ctx, m: Metal): void {
  const { x, y, r } = FRAME.medal;
  ctx.save();
  ctx.shadowColor = rgba('#000000', 0.6);
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#0d0b0f';
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = metalGrad(ctx, x - r, y - r, x + r, y + r, m);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r + 6.5, 0, Math.PI * 2);
  ctx.stroke();
  // beads on the ring
  ctx.fillStyle = metalGrad(ctx, x - r, y - r, x + r, y + r, m);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * (r + 6.5), y + Math.sin(a) * (r + 6.5), 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cartouche(ctx: Ctx, m: Metal, gold: boolean): void {
  const { x, y } = FRAME.rank;
  const w = 118;
  const h = 26;
  const p = new Path2D();
  p.moveTo(x - w / 2, y);
  p.lineTo(x - w / 2 + 12, y - h / 2);
  p.lineTo(x + w / 2 - 12, y - h / 2);
  p.lineTo(x + w / 2, y);
  p.lineTo(x + w / 2 - 12, y + h / 2);
  p.lineTo(x - w / 2 + 12, y + h / 2);
  p.closePath();
  ctx.fillStyle = gold ? '#2a1c08' : '#0f0d11';
  ctx.fill(p);
  ctx.strokeStyle = metalGrad(ctx, x - w / 2, y, x + w / 2, y, m);
  ctx.lineWidth = 1.6;
  ctx.stroke(p);
  if (gold) {
    // sunburst crown rising from the cartouche
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = metalGrad(ctx, x - 60, y - 30, x + 60, y, GOLD);
    ctx.lineWidth = 1.4;
    for (let k = -5; k <= 5; k++) {
      const a = -Math.PI / 2 + k * 0.17;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 16, y - 8 + Math.sin(a) * 16);
      ctx.lineTo(x + Math.cos(a) * 30, y - 8 + Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function nameplate(ctx: Ctx, m: Metal, gold: boolean): void {
  const y0 = FRAME.plateY;
  const x0 = 7;
  const x1 = CARD_W - 7;
  const y1 = CARD_H - 7;
  // shadow lip above the plate
  const lip = ctx.createLinearGradient(0, y0 - 26, 0, y0);
  lip.addColorStop(0, rgba('#000000', 0));
  lip.addColorStop(1, rgba('#000000', 0.75));
  ctx.fillStyle = lip;
  ctx.fillRect(FRAME.inset, y0 - 26, CARD_W - FRAME.inset * 2, 26);
  // plate body with notched ends (ticket stub)
  const p = new Path2D();
  p.moveTo(x0, y0);
  p.lineTo(x1, y0);
  p.lineTo(x1, y1 - 6);
  p.quadraticCurveTo(x1, y1, x1 - 6, y1);
  p.lineTo(x0 + 6, y1);
  p.quadraticCurveTo(x0, y1, x0, y1 - 6);
  p.closePath();
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, gold ? '#3a2710' : '#1d1a20');
  g.addColorStop(1, gold ? '#1c1206' : '#0b0a0d');
  ctx.fillStyle = g;
  ctx.fill(p);
  ctx.strokeStyle = metalGrad(ctx, x0, y0, x1, y0, m);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 + 12, y0 + 5);
  ctx.lineTo(x1 - 12, y0 + 5);
  ctx.stroke();
  // engraved diamonds at both ends of the plate
  for (const x of [x0 + 18, x1 - 18]) {
    ctx.fillStyle = metalGrad(ctx, x - 5, y0 + 40, x + 5, y0 + 50, m);
    ctx.beginPath();
    ctx.moveTo(x, y0 + 36);
    ctx.lineTo(x + 5, y0 + 42);
    ctx.lineTo(x, y0 + 48);
    ctx.lineTo(x - 5, y0 + 42);
    ctx.closePath();
    ctx.fill();
  }
  // seal socket
  const { x, y } = FRAME.seal;
  ctx.fillStyle = '#0b0a0d';
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = metalGrad(ctx, x - 19, y - 19, x + 19, y + 19, m);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, Math.PI * 2);
  ctx.stroke();
}

export function cardFrameCanvas(gold: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CARD_W, CARD_H);
  const m = gold ? GOLD : BRASS;
  bevel(ctx, m, gold);
  nameplate(ctx, m, gold);
  corners(ctx, m, gold);
  medallion(ctx, m);
  cartouche(ctx, m, gold);
  grain(ctx, CARD_W, CARD_H, 0.035, gold ? 41 : 17);
  return canvas;
}

/** Soft firefly aura for lit cards (drawn behind the frame). */
export function cardAuraCanvas(color: string, blur: number): HTMLCanvasElement {
  const pad = 34;
  const { canvas, ctx } = makeCanvas(CARD_W + pad * 2, CARD_H + pad * 2);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = rgba('#ffffff', 0.9);
  ctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) ctx.stroke(roundRectPath(pad, pad, CARD_W, CARD_H, 12));
  return canvas;
}

/** Diagonal shine band swept across Finale cards. */
export function cardShineCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(120, CARD_H + 80);
  const g = ctx.createLinearGradient(0, 0, 120, 0);
  g.addColorStop(0, rgba('#fff6d8', 0));
  g.addColorStop(0.5, rgba('#fff6d8', 0.55));
  g.addColorStop(1, rgba('#fff6d8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 120, CARD_H + 80);
  return canvas;
}
