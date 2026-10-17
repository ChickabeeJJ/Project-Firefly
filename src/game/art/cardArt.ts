import type { ArtLayout, CharacterDef, MotifId, VerseDef } from '../data/types';
import { DOLL_W, drawDoll } from './doll';
import {
  type Ctx, OUTLINE, burstPath, ellipsePath, glow, grain, halftone, light, makeCanvas, mix, part, polyPath,
  rgba, roundRectPath, seeded, shade, star4,
} from './paint';

// Pop-art verse illustrations: flat colour, halftone dots, bursts and speed lines.

export const CARD_W = 264;
export const CARD_H = 404;

interface Pal {
  primary: string;
  secondary: string;
  ink: string;
}

const INK_W = 5;

function ink(ctx: Ctx, p: Path2D, fill: string, w = INK_W): void {
  part(ctx, p, { fill, shadow: false, outline: w });
}

type Motif = (ctx: Ctx, pal: Pal) => void;

// Motifs are drawn around (0,0) at roughly 160 px wide.
const MOTIFS: Record<MotifId, Motif> = {
  match(ctx, pal) {
    ctx.save();
    ctx.rotate(-0.5);
    ink(ctx, roundRectPath(-8, -20, 16, 130, 6), '#f0dcae');
    ink(ctx, ellipsePath(0, -26, 14, 18), '#c23b2f');
    ctx.restore();
    ctx.save();
    ctx.translate(12, -50);
    MOTIFS.flame(ctx, pal);
    ctx.restore();
  },
  flame(ctx, pal) {
    const outer = new Path2D();
    outer.moveTo(0, -95);
    outer.bezierCurveTo(40, -50, 62, -10, 44, 30);
    outer.bezierCurveTo(30, 62, -30, 62, -44, 30);
    outer.bezierCurveTo(-60, -6, -24, -30, -12, -60);
    outer.bezierCurveTo(-2, -40, 8, -40, 0, -95);
    ink(ctx, outer, '#ffb33a');
    const inner = new Path2D();
    inner.moveTo(0, -36);
    inner.bezierCurveTo(26, -6, 30, 22, 16, 38);
    inner.bezierCurveTo(4, 50, -18, 46, -22, 30);
    inner.bezierCurveTo(-28, 10, -8, -6, 0, -36);
    ink(ctx, inner, '#fff1b0', 3);
    void pal;
  },
  bonfire(ctx, pal) {
    for (const r of [-0.35, 0.35]) {
      ctx.save();
      ctx.translate(0, 64);
      ctx.rotate(r);
      ink(ctx, roundRectPath(-78, -12, 156, 24, 10), '#7a4a2a');
      ctx.restore();
    }
    ctx.save();
    ctx.scale(1.3, 1.3);
    ctx.translate(0, -8);
    MOTIFS.flame(ctx, pal);
    ctx.restore();
  },
  vial(ctx, pal) {
    const flask = new Path2D();
    flask.moveTo(-16, -80);
    flask.lineTo(16, -80);
    flask.lineTo(16, -30);
    flask.bezierCurveTo(70, -10, 70, 80, 0, 82);
    flask.bezierCurveTo(-70, 80, -70, -10, -16, -30);
    flask.closePath();
    ink(ctx, flask, rgba('#ffffff', 0.85));
    ctx.save();
    ctx.clip(flask);
    ctx.fillStyle = pal.secondary;
    ctx.fillRect(-80, 10, 160, 90);
    ctx.fillStyle = light(pal.secondary, 0.4);
    for (const [x, y, r] of [[-14, 30, 7], [12, 50, 5], [20, 22, 4], [-4, 60, 4]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = INK_W;
    ctx.stroke(flask);
    ink(ctx, roundRectPath(-20, -100, 40, 24, 6), '#9a6a3a');
  },
  crescent(ctx, pal) {
    const c = new Path2D();
    c.arc(0, 0, 80, Math.PI * 0.35, Math.PI * 1.65, false);
    c.bezierCurveTo(-20, -40, -20, 40, 80 * Math.cos(Math.PI * 0.35), 80 * Math.sin(Math.PI * 0.35));
    c.closePath();
    part(ctx, c, { fill: '#f6edc8', shadowCircle: [-60, 40, 40], shadow: light(pal.secondary, 0.1), outline: INK_W });
    for (const [x, y, r] of [[54, -60, 16], [70, 30, 10], [30, 76, 8]]) ink(ctx, star4(ctx, x, y, r), '#ffffff', 3);
  },
  umbrella(ctx, pal) {
    const canopy = new Path2D();
    canopy.moveTo(-96, 0);
    canopy.bezierCurveTo(-90, -90, 90, -90, 96, 0);
    let sx = 96;
    for (let i = 0; i < 6; i++) {
      canopy.quadraticCurveTo(sx - 16, -18, sx - 32, 0);
      sx -= 32;
    }
    canopy.closePath();
    ink(ctx, canopy, shade(pal.primary, 0.45));
    ctx.save();
    ctx.clip(canopy);
    ctx.strokeStyle = rgba('#ffffff', 0.25);
    ctx.lineWidth = 6;
    for (const x of [-48, 0, 48]) {
      ctx.beginPath();
      ctx.moveTo(0, -66);
      ctx.lineTo(x, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 86);
    ctx.arc(-16, 86, 16, 0, Math.PI, false);
    ctx.stroke();
    ctx.strokeStyle = '#9a6a3a';
    ctx.lineWidth = 5;
    ctx.stroke();
  },
  rain(ctx, pal) {
    MOTIFS.umbrella(ctx, pal);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    for (const [x, y] of [[-110, -110], [-60, -130], [20, -140], [90, -120], [120, -70], [-120, -40]]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 26);
      ctx.stroke();
    }
  },
  note(ctx, pal) {
    ctx.save();
    ctx.rotate(-0.12);
    ink(ctx, ellipsePath(-46, 56, 26, 19, -0.4), pal.ink);
    ink(ctx, ellipsePath(46, 40, 26, 19, -0.4), pal.ink);
    ink(ctx, polyPath([[-26, 52], [-18, 52], [-18, -70], [-26, -70]]), pal.ink, 3);
    ink(ctx, polyPath([[66, 36], [74, 36], [74, -86], [66, -86]]), pal.ink, 3);
    ink(ctx, polyPath([[-26, -70], [74, -86], [74, -60], [-26, -44]]), pal.ink, 3);
    ctx.restore();
    ink(ctx, star4(ctx, -70, -60, 18), '#ffffff', 3);
  },
  sunburst(ctx, pal) {
    ink(ctx, burstPath(0, 0, 96, 40, 8), '#fff1b0');
    ink(ctx, ellipsePath(0, 0, 36, 36), pal.primary);
  },
  cards(ctx, pal) {
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.rotate(i * 0.34);
      ctx.translate(0, -10);
      ink(ctx, roundRectPath(-44, -70, 88, 124, 10), i === 0 ? '#fbf6ec' : '#efe6d2');
      ctx.fillStyle = i === 0 ? '#c23b2f' : pal.ink;
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(0, -24);
        ctx.bezierCurveTo(-30, -50, -36, 0, 0, 22);
        ctx.bezierCurveTo(36, 0, 30, -50, 0, -24);
      } else {
        ctx.moveTo(0, -30);
        ctx.lineTo(22, -4);
        ctx.lineTo(0, 22);
        ctx.lineTo(-22, -4);
      }
      ctx.fill();
      ctx.restore();
    }
  },
  tophat(ctx, pal) {
    ink(ctx, ellipsePath(0, 60, 96, 20), '#1d1a22');
    ink(ctx, polyPath([[-58, 60], [-52, -70], [52, -70], [58, 60]]), '#1d1a22');
    ink(ctx, roundRectPath(-56, 22, 112, 22, 4), pal.primary, 3);
    ink(ctx, ellipsePath(0, -70, 52, 12), '#2c2834', 3);
    for (const [x, y, r] of [[-90, -60, 20], [86, -90, 14], [100, 0, 12]]) ink(ctx, star4(ctx, x, y, r), '#ffffff', 3);
  },
  candle(ctx, pal) {
    ink(ctx, roundRectPath(-28, -20, 56, 110, 8), '#f4ead2');
    ink(ctx, polyPath([[-28, -16], [-18, 10], [-10, -12], [4, 22], [12, -14], [28, -16]], true), '#fffaf0', 3);
    ctx.save();
    ctx.translate(0, -70);
    ctx.scale(0.55, 0.55);
    MOTIFS.flame(ctx, pal);
    ctx.restore();
  },
  shield(ctx, pal) {
    const s = new Path2D();
    s.moveTo(0, -90);
    s.quadraticCurveTo(50, -70, 80, -74);
    s.quadraticCurveTo(84, 30, 0, 92);
    s.quadraticCurveTo(-84, 30, -80, -74);
    s.quadraticCurveTo(-50, -70, 0, -90);
    ink(ctx, s, '#f2ead6');
    ctx.save();
    ctx.clip(s);
    ctx.fillStyle = pal.primary;
    ctx.fillRect(0, -100, 100, 200);
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = INK_W;
    ctx.stroke(s);
    ink(ctx, star4(ctx, 0, -4, 40), '#ffffff', 3);
  },
  fist(ctx, pal) {
    ink(ctx, roundRectPath(-70, -50, 140, 100, 34), '#f2c9a8');
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    for (const x of [-34, 0, 34]) {
      ctx.beginPath();
      ctx.moveTo(x, -50);
      ctx.lineTo(x, -10);
      ctx.stroke();
    }
    ink(ctx, roundRectPath(-40, 40, 80, 60, 10), pal.ink);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    for (const [x1, y1, x2, y2] of [[-110, -40, -86, -30], [-114, 0, -88, 0], [-110, 40, -86, 30]]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  },
  glove(ctx) {
    const g = new Path2D();
    g.moveTo(-60, 40);
    g.bezierCurveTo(-90, -40, -40, -96, 20, -90);
    g.bezierCurveTo(90, -84, 96, 0, 60, 40);
    g.closePath();
    part(ctx, g, { fill: '#d23b2f', shadowCircle: [70, 30, 60], highlight: [-20, -60, 20, '#f27a68'], outline: INK_W });
    ink(ctx, ellipsePath(-62, -10, 24, 32, 0.4), '#c0342a');
    ink(ctx, roundRectPath(-56, 36, 112, 46, 8), '#f4ead6');
  },
  wings(ctx, pal) {
    for (const s of [-1, 1]) {
      const w = new Path2D();
      w.moveTo(s * 10, 20);
      w.bezierCurveTo(s * 40, -80, s * 110, -100, s * 130, -60);
      w.bezierCurveTo(s * 110, -50, s * 120, -30, s * 100, -20);
      w.bezierCurveTo(s * 90, -10, s * 96, 10, s * 70, 14);
      w.bezierCurveTo(s * 60, 30, s * 40, 30, s * 10, 20);
      ink(ctx, w, '#f6f1e6');
      ctx.save();
      ctx.clip(w);
      ctx.strokeStyle = rgba(pal.ink, 0.35);
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s * 14, 18);
        ctx.quadraticCurveTo(s * (50 + i * 16), -40 - i * 6, s * (90 + i * 10), -60 + i * 22);
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  swirl(ctx, pal) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineCap = 'round';
    for (const [w, c] of [[16, OUTLINE], [8, '#ffffff']] as [number, string][]) {
      ctx.lineWidth = w;
      ctx.strokeStyle = c;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let t = 0; t < 1; t += 0.02) {
          const a = t * Math.PI * 2.2 + k * 2.1;
          const r = 20 + t * 80;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r * 0.7;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    void pal;
  },
  eye(ctx, pal) {
    const e = new Path2D();
    e.moveTo(-110, 0);
    e.quadraticCurveTo(0, -90, 110, 0);
    e.quadraticCurveTo(0, 90, -110, 0);
    ink(ctx, e, '#fbf6ec');
    ink(ctx, ellipsePath(0, 0, 42, 42), pal.secondary);
    ink(ctx, ellipsePath(0, 0, 18, 18), pal.ink, 3);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-14, -14, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 26, -54 + Math.abs(i) * 6);
      ctx.lineTo(i * 34, -78 + Math.abs(i) * 8);
      ctx.stroke();
    }
  },
  tarot(ctx, pal) {
    ink(ctx, roundRectPath(-62, -96, 124, 192, 10), '#f4ead2');
    ink(ctx, roundRectPath(-50, -84, 100, 168, 6), pal.primary, 3);
    ink(ctx, burstPath(0, -6, 42, 22, 10), '#fff1b0', 3);
    ink(ctx, ellipsePath(0, -6, 18, 18), pal.secondary, 3);
    ink(ctx, roundRectPath(-36, 56, 72, 14, 3), '#f4ead2', 2);
  },
  crystal(ctx, pal) {
    ink(ctx, polyPath([[-50, 80], [50, 80], [34, 52], [-34, 52]]), '#9a6a3a');
    glow(ctx, 0, -10, 110, pal.secondary, 0.5);
    part(ctx, ellipsePath(0, -10, 66, 66), { fill: mix(pal.primary, '#ffffff', 0.2), shadowCircle: [60, 40, 60], highlight: [-24, -36, 18, '#ffffff'], outline: INK_W });
    ink(ctx, star4(ctx, 8, -6, 22), '#ffffff', 2);
  },
  baton(ctx) {
    ctx.save();
    ctx.rotate(-0.7);
    ink(ctx, roundRectPath(-6, -110, 12, 190, 6), '#fbf6ec');
    ink(ctx, roundRectPath(-14, 50, 28, 46, 10), '#3a2a22');
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-100, 40);
    ctx.bezierCurveTo(-40, -40, 20, 60, 100, -40);
    ctx.stroke();
  },
  metronome(ctx, pal) {
    ink(ctx, polyPath([[-60, 90], [60, 90], [26, -90], [-26, -90]]), '#7a4a2a');
    ink(ctx, polyPath([[-36, 60], [36, 60], [16, -60], [-16, -60]]), '#f4ead2', 3);
    ctx.save();
    ctx.rotate(0.35);
    ink(ctx, roundRectPath(-4, -110, 8, 160, 4), pal.ink, 3);
    ink(ctx, roundRectPath(-14, -70, 28, 18, 4), pal.secondary, 3);
    ctx.restore();
  },
  moth(ctx) {
    for (const s of [-1, 1]) ink(ctx, ellipsePath(s * 50, -10, 54, 40, s * 0.5), '#6d6278');
    ink(ctx, ellipsePath(0, 0, 16, 50), '#3b3145');
  },
  lantern(ctx, pal) {
    glow(ctx, 0, 10, 120, '#ffd27a', 0.7);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -70, 26, Math.PI, 0);
    ctx.stroke();
    ink(ctx, roundRectPath(-46, -60, 92, 130, 16), '#ffe3a0');
    ink(ctx, roundRectPath(-56, -72, 112, 20, 6), pal.ink, 3);
    ink(ctx, roundRectPath(-56, 64, 112, 20, 6), pal.ink, 3);
    ctx.save();
    ctx.translate(0, 8);
    ctx.scale(0.4, 0.4);
    MOTIFS.flame(ctx, pal);
    ctx.restore();
  },
};

function background(ctx: Ctx, layout: ArtLayout, pal: Pal, rnd: () => number): void {
  const w = CARD_W;
  const h = CARD_H;
  const cx = w * 0.55;
  const cy = h * 0.42;
  switch (layout) {
    case 'burst': {
      ctx.fillStyle = pal.primary;
      ctx.fillRect(0, 0, w, h);
      halftone(ctx, 0, 0, w, h, 11, rgba(pal.ink, 0.28), (x, y) => Math.min(1, Math.hypot(x - cx, y - cy) / 240));
      ctx.strokeStyle = rgba('#ffffff', 0.5);
      ctx.lineWidth = 3;
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2;
        const r0 = 110 + rnd() * 40;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * 400, cy + Math.sin(a) * 400);
        ctx.stroke();
      }
      ink(ctx, burstPath(cx, cy, 150, 92, 13, rnd), pal.secondary, 4);
      ink(ctx, burstPath(cx, cy, 104, 70, 11, rnd), light(pal.secondary, 0.45), 3);
      break;
    }
    case 'rays': {
      ctx.fillStyle = pal.secondary;
      ctx.fillRect(0, 0, w, h);
      const ox = -20;
      const oy = h + 20;
      for (let i = 0; i < 14; i += 2) {
        const a0 = -Math.PI / 2 + (i * Math.PI) / 2 / 14;
        const a1 = -Math.PI / 2 + ((i + 1) * Math.PI) / 2 / 14;
        ctx.fillStyle = pal.primary;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(a0) * 900, oy + Math.sin(a0) * 900);
        ctx.lineTo(ox + Math.cos(a1) * 900, oy + Math.sin(a1) * 900);
        ctx.fill();
      }
      halftone(ctx, 0, 0, w, h, 10, rgba(pal.ink, 0.3), (_x, y) => Math.max(0, 1 - y / (h * 0.7)));
      break;
    }
    case 'split': {
      ctx.fillStyle = pal.primary;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = pal.ink;
      ctx.beginPath();
      ctx.moveTo(w, h * 0.18);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.lineTo(0, h * 0.78);
      ctx.fill();
      halftone(ctx, 0, 0, w, h, 10, rgba(pal.secondary, 0.55), (x, y) => {
        const d = Math.abs((y - h * 0.78) - (x * (h * 0.18 - h * 0.78)) / w);
        return Math.max(0, 1 - d / 110);
      });
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-10, h * 0.78 + 4);
      ctx.lineTo(w + 10, h * 0.18 + 4);
      ctx.stroke();
      break;
    }
    case 'rings': {
      ctx.fillStyle = pal.ink;
      ctx.fillRect(0, 0, w, h);
      for (let r = 420, i = 0; r > 20; r -= 34, i++) {
        ctx.fillStyle = i % 2 === 0 ? pal.primary : mix(pal.primary, pal.secondary, 0.45);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      halftone(ctx, 0, 0, w, h, 10, rgba(pal.ink, 0.35), (x, y) => Math.min(1, Math.hypot(x - cx, y - cy) / 300));
      break;
    }
    case 'spiral': {
      ctx.fillStyle = pal.primary;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = shade(pal.primary, 0.25);
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let t = 0; t <= 1.001; t += 0.02) {
          const a = k * (Math.PI / 3) + t * 3.2;
          ctx.lineTo(cx + Math.cos(a) * t * 520, cy + Math.sin(a) * t * 520);
        }
        for (let t = 1; t >= 0; t -= 0.02) {
          const a = k * (Math.PI / 3) + t * 3.2 + 0.32;
          ctx.lineTo(cx + Math.cos(a) * t * 520, cy + Math.sin(a) * t * 520);
        }
        ctx.fill();
      }
      halftone(ctx, 0, 0, w, h, 11, rgba(pal.secondary, 0.4), (x, y) => Math.min(1, Math.hypot(x - cx, y - cy) / 260));
      break;
    }
  }
}

function portrait(ctx: Ctx, char: CharacterDef): void {
  // Comic close-up of the caster in the lower left, partially cropped by the card edge.
  ctx.save();
  ctx.translate(-70, 84);
  ctx.scale(1.6, 1.6);
  ctx.translate(-(DOLL_W / 2 - 110), -30);
  drawDoll(ctx, char.look);
  ctx.restore();
}

export function drawVerseArt(ctx: Ctx, char: CharacterDef, verse: VerseDef): void {
  const pal: Pal = char.palette;
  const rnd = seeded(verse.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, CARD_W, CARD_H);
  ctx.clip();
  background(ctx, verse.art.layout, pal, rnd);
  if (verse.art.portrait) {
    portrait(ctx, char);
    ctx.save();
    ctx.translate(CARD_W * 0.68, CARD_H * 0.28);
    ctx.scale(0.62, 0.62);
    MOTIFS[verse.art.motif](ctx, pal);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(CARD_W * 0.52, CARD_H * 0.44);
    ctx.scale(0.95, 0.95);
    MOTIFS[verse.art.motif](ctx, pal);
    ctx.restore();
  }
  if (verse.finale) {
    for (let i = 0; i < 14; i++) {
      const x = rnd() * CARD_W;
      const y = rnd() * CARD_H * 0.8;
      part(ctx, star4(ctx, x, y, 5 + rnd() * 10), { fill: '#fff6d0', shadow: false, outline: 0 });
    }
  }
  ctx.restore();
  grain(ctx, CARD_W, CARD_H, 0.07, verse.id.length * 13);
}

export function verseArtCanvas(char: CharacterDef, verse: VerseDef): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CARD_W, CARD_H);
  drawVerseArt(ctx, char, verse);
  return canvas;
}

export const PCARD_W = 300;
export const PCARD_H = 500;

/** Tall character card (formation, roster, rite results): palette backdrop + upper-body crop. */
export function portraitCardCanvas(char: CharacterDef): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(PCARD_W, PCARD_H);
  const pal = char.palette;
  const g = ctx.createLinearGradient(0, 0, 0, PCARD_H);
  g.addColorStop(0, mix(pal.primary, '#ffffff', 0.12));
  g.addColorStop(0.55, pal.primary);
  g.addColorStop(1, mix(pal.primary, pal.ink, 0.75));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PCARD_W, PCARD_H);
  halftone(ctx, 0, 0, PCARD_W, PCARD_H, 12, rgba(pal.ink, 0.25), (_x, y) => Math.max(0, (y - PCARD_H * 0.3) / (PCARD_H * 0.7)));
  ctx.strokeStyle = rgba('#ffffff', 0.18);
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(-40 + i * 40, PCARD_H);
    ctx.lineTo(160 + i * 40, 0);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(PCARD_W / 2 - 110 * 2.0, -36);
  ctx.scale(2.0, 2.0);
  drawDoll(ctx, char.look);
  ctx.restore();
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
  grain(ctx, PCARD_W, PCARD_H, 0.05, char.id.length * 31);
  return canvas;
}
