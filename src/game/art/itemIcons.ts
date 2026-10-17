import { type Ctx, glow, makeCanvas, rgba } from './paint';

// Growth material icons (128 px): painted curios on a soft disc, in the spirit of R1999's
// Dust prism and Sharpodonty coin.

const S = 128;

function disc(ctx: Ctx, color: string): void {
  const g = ctx.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S / 2);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}

function metal(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, hi: string, mid: string, lo: string): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, hi);
  g.addColorStop(0.45, mid);
  g.addColorStop(0.6, hi);
  g.addColorStop(1, lo);
  return g;
}

const DRAW: Record<string, (ctx: Ctx) => void> = {
  dust(ctx) {
    // A faceted prism of glowing ash.
    disc(ctx, '#f2c86a');
    glow(ctx, 64, 70, 40, '#ffd27a', 0.55);
    const pts: [number, number][] = [[64, 18], [104, 92], [24, 92]];
    ctx.fillStyle = metal(ctx, 24, 18, 104, 92, '#f6ecd0', '#9a8466', '#4a3c2c');
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.lineTo(...pts[1]);
    ctx.lineTo(...pts[2]);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#fff6dc', 0.55);
    ctx.beginPath();
    ctx.moveTo(64, 18);
    ctx.lineTo(64, 92);
    ctx.lineTo(24, 92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.lineTo(...pts[1]);
    ctx.lineTo(...pts[2]);
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = rgba('#ffe6a8', 0.4 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.arc(20 + Math.random() * 88, 94 + Math.random() * 18, 1 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  sovereign(ctx) {
    disc(ctx, '#d8a24a');
    ctx.fillStyle = metal(ctx, 24, 24, 104, 104, '#ffe6a6', '#b07a2a', '#5a3a12');
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2408';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = rgba('#fff0c8', 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(64, 64, 34, 0, Math.PI * 2);
    ctx.stroke();
    // thirteen-hour dial
    ctx.strokeStyle = '#4a2e0c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const a = (i * Math.PI * 2) / 13 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(a) * 26, 64 + Math.sin(a) * 26);
      ctx.lineTo(64 + Math.cos(a) * 32, 64 + Math.sin(a) * 32);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64, 44);
    ctx.moveTo(64, 64);
    ctx.lineTo(78, 70);
    ctx.stroke();
  },
  moth(ctx) {
    disc(ctx, '#b8a0d8');
    const wing = (sx: number) => {
      ctx.save();
      ctx.translate(64, 64);
      ctx.scale(sx, 1);
      ctx.fillStyle = metal(ctx, 0, -40, 44, 40, '#efe2f6', '#9a84b8', '#4a3a62');
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.bezierCurveTo(20, -50, 52, -40, 46, -8);
      ctx.bezierCurveTo(44, 10, 24, 18, 2, 6);
      ctx.bezierCurveTo(22, 20, 36, 40, 22, 46);
      ctx.bezierCurveTo(8, 48, 2, 30, 2, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a1e36';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#2a1e36';
      ctx.beginPath();
      ctx.arc(28, -16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    wing(1);
    wing(-1);
    ctx.fillStyle = '#2a1e36';
    ctx.fillRect(61, 46, 6, 40);
  },
  velvet(ctx) {
    disc(ctx, '#c0383a');
    ctx.fillStyle = metal(ctx, 34, 26, 94, 34, '#f2d29a', '#a8783a', '#5a3a14');
    ctx.fillRect(34, 24, 60, 12);
    ctx.fillRect(34, 92, 60, 12);
    const g = ctx.createLinearGradient(40, 0, 88, 0);
    g.addColorStop(0, '#5a0e14');
    g.addColorStop(0.5, '#c8323a');
    g.addColorStop(1, '#5a0e14');
    ctx.fillStyle = g;
    ctx.fillRect(40, 36, 48, 56);
    ctx.strokeStyle = rgba('#ff9a9a', 0.35);
    ctx.lineWidth = 1.5;
    for (let y = 40; y < 92; y += 5) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(88, y + 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c8323a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(88, 70);
    ctx.bezierCurveTo(108, 76, 104, 104, 116, 112);
    ctx.stroke();
  },
  tide(ctx) {
    disc(ctx, '#6ab0d8');
    ctx.fillStyle = metal(ctx, 28, 28, 100, 100, '#e8f6ff', '#6aa8cc', '#1e4a66');
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(92, 36);
    ctx.lineTo(102, 82);
    ctx.lineTo(66, 104);
    ctx.lineTo(28, 80);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#123044';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 70);
    ctx.quadraticCurveTo(52, 62, 64, 70);
    ctx.quadraticCurveTo(76, 78, 88, 70);
    ctx.stroke();
    glow(ctx, 50, 46, 14, '#ffffff', 0.6);
  },
  spring(ctx) {
    disc(ctx, '#d8b05a');
    ctx.strokeStyle = metal(ctx, 20, 20, 108, 108, '#fff0c0', '#b0843a', '#5a3a12');
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 7; t += 0.08) {
      const r = 6 + t * 1.85;
      const x = 64 + Math.cos(t) * r;
      const y = 64 + Math.sin(t) * r;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#3a2408';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },
};

export const ITEM_ICON_IDS = Object.keys(DRAW);

export function itemIconCanvas(id: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(S, S);
  DRAW[id]?.(ctx);
  return canvas;
}
