import { cardAuraCanvas, cardFrameCanvas } from './cardFrame';
import { CARD_H, CARD_W } from './cardArt';
import { type Ctx, glow, grain, makeCanvas, rgba, roundRectPath, seeded } from './paint';

// Paper panels, buttons, card frames and FX particles.

export interface TexSpec {
  key: string;
  canvas: HTMLCanvasElement;
}

function paper(w: number, h: number, base: string, edge: string, seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, base);
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fill(roundRectPath(0, 0, w, h, 10));
  const rnd = seeded(seed);
  ctx.save();
  ctx.clip(roundRectPath(0, 0, w, h, 10));
  for (let i = 0; i < Math.round((w * h) / 116); i++) {
    ctx.fillStyle = rgba('#8a7650', 0.05 + rnd() * 0.05);
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1);
  }
  ctx.restore();
  grain(ctx, w, h, 0.03, seed);
  return canvas;
}

function framed(base: HTMLCanvasElement, line: string, inset: number, width = 2): HTMLCanvasElement {
  const ctx = base.getContext('2d')!;
  ctx.strokeStyle = line;
  ctx.lineWidth = width;
  ctx.stroke(roundRectPath(inset, inset, base.width - inset * 2, base.height - inset * 2, 6));
  return base;
}

function darkPanel(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(128, 128);
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, rgba('#1a1d22', 0.92));
  g.addColorStop(1, rgba('#0e1013', 0.92));
  ctx.fillStyle = g;
  ctx.fill(roundRectPath(0, 0, 128, 128, 8));
  ctx.strokeStyle = rgba('#e2be6a', 0.55);
  ctx.lineWidth = 2;
  ctx.stroke(roundRectPath(5, 5, 118, 118, 5));
  return canvas;
}

function button(fill: string, fill2: string, line: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(160, 80);
  const g = ctx.createLinearGradient(0, 0, 0, 80);
  g.addColorStop(0, fill);
  g.addColorStop(1, fill2);
  ctx.fillStyle = g;
  ctx.fill(roundRectPath(2, 2, 156, 76, 6));
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.stroke(roundRectPath(7, 7, 146, 66, 3));
  ctx.strokeStyle = rgba('#000000', 0.35);
  ctx.lineWidth = 2;
  ctx.stroke(roundRectPath(2, 2, 156, 76, 6));
  grain(ctx, 160, 80, 0.05, 3);
  return canvas;
}

function cardBorder(gold: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CARD_W, CARD_H);
  ctx.strokeStyle = '#0b0b0e';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, CARD_W, CARD_H);
  if (gold) {
    const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    g.addColorStop(0, '#f6dc8a');
    g.addColorStop(0.5, '#b08a3a');
    g.addColorStop(1, '#f3d27a');
    ctx.strokeStyle = g;
    ctx.lineWidth = 9;
    ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);
  } else {
    ctx.strokeStyle = rgba('#f3ead6', 0.85);
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, CARD_W - 16, CARD_H - 16);
  }
  // Bottom type strip
  const sh = 58;
  const g2 = ctx.createLinearGradient(0, CARD_H - sh - 20, 0, CARD_H);
  g2.addColorStop(0, rgba('#0b0b0e', 0));
  g2.addColorStop(0.3, rgba('#0b0b0e', 0.92));
  g2.addColorStop(1, '#0b0b0e');
  ctx.fillStyle = g2;
  ctx.fillRect(0, CARD_H - sh - 20, CARD_W, sh + 20);
  return canvas;
}

function cardBack(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CARD_W, CARD_H);
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, '#2a2622');
  g.addColorStop(1, '#16130f');
  ctx.fillStyle = g;
  ctx.fill(roundRectPath(0, 0, CARD_W, CARD_H, 14));
  ctx.strokeStyle = rgba('#e2be6a', 0.45);
  ctx.lineWidth = 3;
  ctx.stroke(roundRectPath(12, 12, CARD_W - 24, CARD_H - 24, 8));
  lanternEmblem(ctx, CARD_W / 2, CARD_H / 2, 1.1, rgba('#e2be6a', 0.55));
  return canvas;
}

/** The Firefly Nocturne emblem: a lantern inside a lozenge with radiating ticks. */
export function lanternEmblem(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(56, 0);
  ctx.lineTo(0, 78);
  ctx.lineTo(-56, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -26, 9, Math.PI, 0);
  ctx.moveTo(-16, -18);
  ctx.lineTo(16, -18);
  ctx.lineTo(13, 22);
  ctx.lineTo(-13, 22);
  ctx.closePath();
  ctx.moveTo(-18, 26);
  ctx.lineTo(18, 26);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 92, Math.sin(a) * 92);
    ctx.lineTo(Math.cos(a) * 104, Math.sin(a) * 104);
    ctx.stroke();
  }
  ctx.restore();
}

function emblemTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(240, 240);
  lanternEmblem(ctx, 120, 120, 1.05, '#e2be6a');
  return canvas;
}

function litGlow(): HTMLCanvasElement {
  const pad = 30;
  const { canvas, ctx } = makeCanvas(CARD_W + pad * 2, CARD_H + pad * 2);
  ctx.shadowColor = '#dcef72';
  ctx.shadowBlur = 26;
  ctx.strokeStyle = rgba('#e8f8a0', 0.95);
  ctx.lineWidth = 6;
  ctx.strokeRect(pad, pad, CARD_W, CARD_H);
  ctx.strokeRect(pad, pad, CARD_W, CARD_H);
  return canvas;
}

function selectGlow(): HTMLCanvasElement {
  const pad = 30;
  const { canvas, ctx } = makeCanvas(CARD_W + pad * 2, CARD_H + pad * 2);
  ctx.shadowColor = '#f3dc9c';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = rgba('#fff3d0', 0.95);
  ctx.lineWidth = 5;
  ctx.strokeRect(pad, pad, CARD_W, CARD_H);
  return canvas;
}

function softDot(size: number, color: string, hard = 0.15): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, rgba(color, 1));
  g.addColorStop(hard, rgba(color, 0.8));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function fireflyTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 64);
  glow(ctx, 32, 32, 32, '#dcef72', 0.85);
  ctx.fillStyle = '#fbffe0';
  ctx.beginPath();
  ctx.arc(32, 32, 4.5, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function sparkTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 64);
  glow(ctx, 32, 32, 18, '#ffffff', 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? 30 : 5;
    ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  ctx.fill();
  return canvas;
}

function ringTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

function slashTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(320, 120);
  const g = ctx.createLinearGradient(0, 0, 320, 0);
  g.addColorStop(0, rgba('#ffffff', 0));
  g.addColorStop(0.6, rgba('#ffffff', 1));
  g.addColorStop(1, rgba('#ffffff', 0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.quadraticCurveTo(160, -20, 320, 40);
  ctx.quadraticCurveTo(170, 20, 0, 100);
  ctx.fill();
  return canvas;
}

function beamTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(256, 64);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, rgba('#ffffff', 0));
  g.addColorStop(0.5, rgba('#ffffff', 1));
  g.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  return canvas;
}

function shardTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(32, 48);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(30, 30);
  ctx.lineTo(16, 48);
  ctx.lineTo(2, 30);
  ctx.fill();
  return canvas;
}

function vignette(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(480, 270);
  const g = ctx.createRadialGradient(240, 135, 60, 240, 135, 290);
  g.addColorStop(0, rgba('#000000', 0));
  g.addColorStop(0.65, rgba('#000000', 0.25));
  g.addColorStop(1, rgba('#000000', 0.8));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 270);
  return canvas;
}

function grainTile(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(256, 256);
  const img = ctx.createImageData(256, 256);
  const rnd = seeded(99);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function shadowTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(256, 64);
  const g = ctx.createRadialGradient(128, 32, 0, 128, 32, 128);
  g.addColorStop(0, rgba('#000000', 0.6));
  g.addColorStop(1, rgba('#000000', 0));
  ctx.save();
  ctx.scale(1, 0.25);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.restore();
  return canvas;
}

function hpFrame(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(8, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 8, 8);
  return canvas;
}

function paperLantern(body: string, glowColor: string, sparkle: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(200, 240);
  glow(ctx, 100, 128, 100, glowColor, 0.75);
  const shape = new Path2D();
  shape.moveTo(100, 64);
  shape.bezierCurveTo(160, 64, 168, 190, 100, 192);
  shape.bezierCurveTo(32, 190, 40, 64, 100, 64);
  const g = ctx.createRadialGradient(100, 130, 6, 100, 130, 80);
  g.addColorStop(0, '#fffbe8');
  g.addColorStop(0.5, body);
  g.addColorStop(1, mixHex(body, '#3a2010', 0.35));
  ctx.fillStyle = g;
  ctx.fill(shape);
  ctx.save();
  ctx.clip(shape);
  ctx.strokeStyle = rgba('#5a3a1a', 0.35);
  ctx.lineWidth = 2;
  for (let y = 76; y < 192; y += 14) {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.quadraticCurveTo(100, y + 8, 170, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 3;
  ctx.stroke(shape);
  ctx.fillStyle = '#2a1a10';
  ctx.fill(roundRectPath(78, 54, 44, 14, 4));
  ctx.fill(roundRectPath(82, 188, 36, 12, 4));
  ctx.strokeStyle = '#2a1a10';
  ctx.beginPath();
  ctx.moveTo(100, 54);
  ctx.lineTo(100, 30);
  ctx.stroke();
  ctx.strokeStyle = rgba(glowColor, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.lineTo(100, 226);
  ctx.stroke();
  if (sparkle) {
    ctx.fillStyle = '#ffffff';
    for (const [x, y, r] of [[44, 80, 7], [160, 100, 5], [150, 196, 6]]) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const rr = i % 2 === 0 ? r : r * 0.3;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  }
  return canvas;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

function jar(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(160, 200);
  glow(ctx, 80, 120, 80, '#dcef72', 0.6);
  const body = roundRectPath(30, 50, 100, 130, 30);
  ctx.fillStyle = rgba('#d8f0e8', 0.25);
  ctx.fill(body);
  ctx.strokeStyle = rgba('#e8fff4', 0.8);
  ctx.lineWidth = 3;
  ctx.stroke(body);
  ctx.fillStyle = '#5a3a22';
  ctx.fill(roundRectPath(40, 34, 80, 22, 6));
  const rnd = seeded(4);
  for (let i = 0; i < 9; i++) {
    const x = 50 + rnd() * 60;
    const y = 80 + rnd() * 80;
    glow(ctx, x, y, 10, '#dcef72', 0.9);
  }
  ctx.strokeStyle = rgba('#ffffff', 0.6);
  ctx.beginPath();
  ctx.moveTo(46, 70);
  ctx.lineTo(46, 150);
  ctx.stroke();
  return canvas;
}

/** Art-deco sunburst (white, tinted at runtime) for the Finale poster. */
function raysTex(): HTMLCanvasElement {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.translate(S / 2, S / 2);
  for (let i = 0; i < 48; i++) {
    const a0 = (i * Math.PI * 2) / 48;
    const w = i % 2 === 0 ? 0.05 : 0.022;
    ctx.fillStyle = rgba('#ffffff', i % 2 === 0 ? 0.55 : 0.3);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * 36, Math.sin(a0) * 36);
    ctx.lineTo(Math.cos(a0 - w) * S * 0.5, Math.sin(a0 - w) * S * 0.5);
    ctx.lineTo(Math.cos(a0 + w) * S * 0.5, Math.sin(a0 + w) * S * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = rgba('#ffffff', 0.7);
  for (const [r, lw] of [[30, 3], [38, 1.2], [76, 1.5], [80, 1]] as const) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // fade towards the rim so the burst never shows a hard edge
  ctx.globalCompositeOperation = 'destination-in';
  const f = ctx.createRadialGradient(0, 0, S * 0.2, 0, 0, S * 0.5);
  f.addColorStop(0, '#ffffff');
  f.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = f;
  ctx.fillRect(-S / 2, -S / 2, S, S);
  return canvas;
}

/** Strip of film with sprocket holes (tiles horizontally). */
function filmTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(128, 56);
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, 128, 56);
  ctx.fillStyle = '#e8dcc0';
  for (let x = 10; x < 128; x += 32) {
    ctx.fill(roundRectPath(x, 8, 18, 12, 3));
    ctx.fill(roundRectPath(x, 36, 18, 12, 3));
  }
  ctx.fillStyle = rgba('#e2be6a', 0.35);
  ctx.fillRect(0, 26, 128, 1);
  ctx.fillRect(0, 29, 128, 1);
  return canvas;
}

/** Thin vertical scratch for old-film flicker. */
function scratchTex(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(6, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, rgba('#fff8e8', 0));
  g.addColorStop(0.3, rgba('#fff8e8', 0.8));
  g.addColorStop(0.7, rgba('#fff8e8', 0.5));
  g.addColorStop(1, rgba('#fff8e8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(2, 0, 2, 512);
  return canvas;
}

export function uiTextureSpecs(): TexSpec[] {
  return [
    { key: 'ui:paper', canvas: framed(paper(640, 640, '#f2ead8', '#e2d6bd', 4), rgba('#9a8660', 0.6), 7) },
    { key: 'ui:paperPlain', canvas: paper(640, 640, '#f2ead8', '#e2d6bd', 9) },
    { key: 'ui:dark', canvas: darkPanel() },
    { key: 'ui:btnAmber', canvas: button('#d9763c', '#b4542a', rgba('#ffe2c0', 0.55)) },
    { key: 'ui:btnCream', canvas: button('#f4ecda', '#dccfb2', rgba('#7a6a4a', 0.5)) },
    { key: 'ui:btnDark', canvas: button('#2a2d33', '#1a1c20', rgba('#e2be6a', 0.45)) },
    { key: 'ui:btnGold', canvas: button('#e9c876', '#b08a3a', rgba('#fff3d0', 0.7)) },
    { key: 'ui:white', canvas: hpFrame() },
    { key: 'card:border', canvas: cardBorder(false) },
    { key: 'card:borderGold', canvas: cardBorder(true) },
    { key: 'card:back', canvas: cardBack() },
    { key: 'card:frame', canvas: cardFrameCanvas(false) },
    { key: 'card:frameGold', canvas: cardFrameCanvas(true) },
    { key: 'card:auraLit', canvas: cardAuraCanvas('#dcef72', 30) },
    { key: 'card:auraSelect', canvas: cardAuraCanvas('#f3dc9c', 22) },
    { key: 'card:auraGold', canvas: cardAuraCanvas('#ffc85a', 26) },
    { key: 'card:lit', canvas: litGlow() },
    { key: 'card:select', canvas: selectGlow() },
    { key: 'ui:emblem', canvas: emblemTex() },
    { key: 'fx:dot', canvas: softDot(64, '#ffffff') },
    { key: 'fx:rays', canvas: raysTex() },
    { key: 'fx:film', canvas: filmTex() },
    { key: 'fx:scratch', canvas: scratchTex() },
    { key: 'fx:glow', canvas: softDot(256, '#ffffff', 0.05) },
    { key: 'fx:firefly', canvas: fireflyTex() },
    { key: 'fx:spark', canvas: sparkTex() },
    { key: 'fx:ring', canvas: ringTex() },
    { key: 'fx:slash', canvas: slashTex() },
    { key: 'fx:beam', canvas: beamTex() },
    { key: 'fx:shard', canvas: shardTex() },
    { key: 'fx:vignette', canvas: vignette() },
    { key: 'fx:grain', canvas: grainTile() },
    { key: 'fx:shadow', canvas: shadowTex() },
    { key: 'rite:lantern3', canvas: paperLantern('#f1dcae', '#ffd27a', false) },
    { key: 'rite:lantern4', canvas: paperLantern('#c9a6f0', '#b48cff', false) },
    { key: 'rite:lantern5', canvas: paperLantern('#ffd25a', '#ffb030', true) },
    { key: 'rite:jar', canvas: jar() },
  ];
}
