import type { EnemyKind } from '../data/types';
import { type Ctx, ellipsePath, glow, light, makeCanvas, part, polyPath, rgba, roundRectPath, shade } from './paint';

// The Dimfolk: ink silhouettes with a violet aura and glowing eyes, so they read instantly
// against the warm, friendly Luminaries.

type Pt = [number, number];
const AURA = '#9a7cff';
const EYE = '#f2e88a';

interface EnemyArt {
  w: number;
  h: number;
  draw: (ctx: Ctx) => void;
}

function aura(ctx: Ctx, fn: () => void, color = AURA, blur = 18): void {
  ctx.save();
  ctx.shadowColor = rgba(color, 0.7);
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

function eyes(ctx: Ctx, pts: Pt[], r: number, color = EYE): void {
  for (const [x, y] of pts) {
    glow(ctx, x, y, r * 3.2, color, 0.55);
    ctx.fillStyle = light(color, 0.5);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function wing(ctx: Ctx, base: Pt, tip: Pt, width: number, fill: string, spot?: string): void {
  const [bx, by] = base;
  const [tx, ty] = tip;
  const mx = (bx + tx) / 2;
  const my = (by + ty) / 2;
  const dx = tx - bx;
  const dy = ty - by;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * width;
  const ny = (dx / len) * width;
  const p = new Path2D();
  p.moveTo(bx, by);
  p.quadraticCurveTo(mx + nx, my + ny, tx, ty);
  p.quadraticCurveTo(mx - nx * 0.6, my - ny * 0.6, bx, by);
  part(ctx, p, { fill, shadowCircle: [mx - nx * 0.4, my - ny * 0.4 + 30, len * 0.45], outline: 2.5 });
  ctx.save();
  ctx.clip(p);
  ctx.strokeStyle = rgba(shade(fill, 0.6), 0.6);
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(mx + nx * (i / 5 - 0.3), my + ny * (i / 5 - 0.3), tx - nx * (0.6 - i / 6), ty - ny * (0.6 - i / 6));
    ctx.stroke();
  }
  ctx.restore();
  if (spot) {
    const sx = mx + nx * 0.25;
    const sy = my + ny * 0.25;
    part(ctx, ellipsePath(sx, sy, width * 0.22, width * 0.22), { fill: spot, shadow: false, outline: 2 });
    part(ctx, ellipsePath(sx, sy, width * 0.1, width * 0.1), { fill: '#1a1220', shadow: false, outline: 0 });
  }
}

const ART: Record<EnemyKind, EnemyArt> = {
  mothling: {
    w: 280, h: 280,
    draw(ctx) {
      const cx = 140;
      aura(ctx, () => {
        wing(ctx, [cx - 8, 128], [30, 60], 58, '#7a6d86', '#d9a756');
        wing(ctx, [cx + 8, 128], [250, 60], 58, '#7a6d86', '#d9a756');
      });
      wing(ctx, [cx - 6, 146], [56, 210], 34, '#5d5168');
      wing(ctx, [cx + 6, 146], [224, 210], 34, '#5d5168');
      const body = polyPath([[cx, 96], [cx + 22, 120], [cx + 20, 180], [cx, 214], [cx - 20, 180], [cx - 22, 120]], true);
      part(ctx, body, { fill: '#3b3145', shadowCircle: [cx + 30, 190, 40], highlight: [cx - 8, 126, 8, '#5a4c66'] });
      ctx.strokeStyle = rgba('#b8a8c8', 0.5);
      ctx.lineWidth = 2;
      for (let y = 150; y < 205; y += 11) {
        ctx.beginPath();
        ctx.moveTo(cx - 16, y);
        ctx.quadraticCurveTo(cx, y + 5, cx + 16, y);
        ctx.stroke();
      }
      part(ctx, ellipsePath(cx, 100, 24, 20), { fill: '#4a3d56', shadowCircle: [cx + 22, 116, 18] });
      for (const s of [-1, 1]) {
        ctx.strokeStyle = '#2a2230';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + s * 8, 84);
        ctx.quadraticCurveTo(cx + s * 30, 40, cx + s * 52, 36);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          const x = cx + s * (8 + 44 * t);
          const y = 84 - 46 * t;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + s * 4, y - 10);
          ctx.stroke();
        }
      }
      eyes(ctx, [[cx - 10, 100], [cx + 10, 100]], 6);
    },
  },
  usher: {
    w: 220, h: 420,
    draw(ctx) {
      const cx = 110;
      for (const x of [96, 124]) part(ctx, roundRectPath(x - 8, 330, 16, 80, 6), { fill: '#1c1820', shadow: false });
      for (const x of [92, 128]) part(ctx, ellipsePath(x, 410, 14, 7), { fill: '#0e0c10', shadow: false, outline: 2 });
      aura(ctx, () => {
        const coat = polyPath([[cx - 20, 160], [cx + 20, 160], [cx + 46, 176], [cx + 50, 220], [cx + 54, 344], [cx - 54, 344], [cx - 50, 220], [cx - 46, 176]], true);
        part(ctx, coat, { fill: '#5c1e2a', shadowCircle: [cx + 80, 300, 80], highlight: [cx - 30, 190, 12, '#7a3040'] });
      });
      ctx.strokeStyle = '#2a0c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 168);
      ctx.lineTo(cx, 344);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        for (const s of [-1, 1]) part(ctx, ellipsePath(cx + s * 14, 190 + i * 26, 4, 4), { fill: '#d8b45a', shadow: false, outline: 1.5 });
      }
      part(ctx, roundRectPath(cx - 56, 170, 18, 120, 8), { fill: '#4e1823', shadow: false });
      part(ctx, ellipsePath(cx - 47, 296, 11, 11), { fill: '#e8e2d6', shadow: false });
      part(ctx, roundRectPath(cx + 38, 170, 18, 100, 8), { fill: '#4e1823', shadow: false });
      part(ctx, ellipsePath(cx + 47, 276, 11, 11), { fill: '#e8e2d6', shadow: false });
      ctx.strokeStyle = '#1c1418';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 47, 284);
      ctx.lineTo(cx + 47, 300);
      ctx.stroke();
      glow(ctx, cx + 47, 326, 56, '#b48cff', 0.7);
      part(ctx, roundRectPath(cx + 32, 300, 30, 44, 8), { fill: '#d9c8ff', shadow: false, highlight: [cx + 42, 314, 6, '#ffffff'] });
      part(ctx, roundRectPath(cx + 29, 296, 36, 8, 3), { fill: '#2a2026', shadow: false, outline: 2 });
      part(ctx, roundRectPath(cx + 29, 340, 36, 8, 3), { fill: '#2a2026', shadow: false, outline: 2 });
      part(ctx, ellipsePath(cx, 114, 40, 50), { fill: '#e9e4da', shadowCircle: [cx + 46, 136, 44], shadow: '#b9b0c4', highlight: [cx - 14, 92, 10, '#ffffff'] });
      ctx.strokeStyle = rgba('#3a2a3a', 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 6, 70);
      ctx.lineTo(cx + 2, 96);
      ctx.lineTo(cx + 10, 112);
      ctx.lineTo(cx + 4, 140);
      ctx.stroke();
      ctx.fillStyle = rgba('#2a1a2a', 0.35);
      ctx.beginPath();
      ctx.ellipse(cx - 14, 114, 8, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 14, 114, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      part(ctx, roundRectPath(cx - 30, 54, 60, 26, 6), { fill: '#5c1e2a', shadowCircle: [cx + 34, 80, 24] });
      part(ctx, roundRectPath(cx - 31, 72, 62, 7, 2), { fill: '#d8b45a', shadow: false, outline: 2 });
    },
  },
  mannequin: {
    w: 240, h: 420,
    draw(ctx) {
      const cx = 120;
      const wood = '#c9ad84';
      const joint = (x: number, y: number, r = 10) => part(ctx, ellipsePath(x, y, r, r), { fill: shade(wood, 0.12), shadowCircle: [x + 8, y + 6, r], outline: 2.5 });
      const seg = (a: Pt, b: Pt, w: number) => {
        const p = new Path2D();
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const nx = Math.cos(ang + Math.PI / 2) * w;
        const ny = Math.sin(ang + Math.PI / 2) * w;
        p.moveTo(a[0] + nx, a[1] + ny);
        p.lineTo(b[0] + nx * 0.8, b[1] + ny * 0.8);
        p.lineTo(b[0] - nx * 0.8, b[1] - ny * 0.8);
        p.lineTo(a[0] - nx, a[1] - ny);
        p.closePath();
        part(ctx, p, { fill: wood, shadowCircle: [b[0] + 20, b[1], 22], outline: 2.5 });
      };
      part(ctx, roundRectPath(cx + 46, 186, 30, 10, 4), { fill: '#d8b45a', shadow: false });
      part(ctx, ellipsePath(cx + 84, 178, 12, 18), { fill: '#e2be6a', shadowCircle: [cx + 92, 190, 10] });
      part(ctx, ellipsePath(cx + 84, 206, 12, 18), { fill: '#e2be6a', shadowCircle: [cx + 92, 218, 10] });
      seg([cx - 18, 300], [cx - 24, 404], 10);
      seg([cx + 18, 300], [cx + 24, 404], 10);
      joint(cx - 21, 352);
      joint(cx + 21, 352);
      aura(ctx, () => {
        const torso = polyPath([[cx - 30, 150], [cx + 30, 150], [cx + 44, 176], [cx + 30, 236], [cx + 36, 300], [cx - 36, 300], [cx - 30, 236], [cx - 44, 176]], true);
        part(ctx, torso, { fill: '#e8dcc6', shadowCircle: [cx + 70, 260, 70], highlight: [cx - 20, 176, 14, '#fff8ea'] });
      }, '#c9a0ff', 14);
      ctx.strokeStyle = '#c23b2f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 40, 190);
      ctx.quadraticCurveTo(cx, 214, cx + 40, 186);
      ctx.stroke();
      ctx.fillStyle = '#1c1418';
      for (let i = 0; i < 8; i++) ctx.fillRect(cx - 34 + i * 9, 196 + Math.sin(i / 2) * 3, 2, 6);
      seg([cx - 42, 172], [cx - 56, 250], 9);
      seg([cx + 42, 172], [cx + 60, 246], 9);
      joint(cx - 44, 172, 12);
      joint(cx + 44, 172, 12);
      joint(cx - 56, 252, 9);
      joint(cx + 60, 248, 9);
      part(ctx, ellipsePath(cx - 58, 268, 10, 14), { fill: wood, shadow: false });
      part(ctx, ellipsePath(cx + 62, 264, 10, 14), { fill: wood, shadow: false });
      part(ctx, roundRectPath(cx - 7, 126, 14, 30, 4), { fill: shade(wood, 0.1), shadow: false });
      part(ctx, ellipsePath(cx, 92, 36, 46), { fill: wood, shadowCircle: [cx + 44, 120, 44], highlight: [cx - 14, 70, 9, '#f0e0c0'] });
      ctx.strokeStyle = rgba('#5a4028', 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 34, 98);
      ctx.quadraticCurveTo(cx, 106, cx + 34, 96);
      ctx.stroke();
      eyes(ctx, [[cx + 10, 86]], 5, '#ff9a5a');
    },
  },
  hound: {
    w: 340, h: 280,
    draw(ctx) {
      const ink = '#16111c';
      aura(ctx, () => {
        const body = polyPath([
          [60, 120], [92, 92], [150, 104], [214, 96], [262, 70], [300, 82], [312, 112], [296, 136], [276, 140],
          [262, 176], [270, 262], [250, 262], [238, 196], [196, 186], [160, 194], [140, 262], [120, 262], [118, 190], [86, 178], [70, 200], [44, 182], [34, 150],
        ], true);
        part(ctx, body, { fill: ink, shadow: false, highlight: [150, 112, 30, '#2c2238'], outline: 2 });
      });
      ctx.fillStyle = ink;
      for (const [x, y, l] of [[100, 186, 30], [170, 194, 40], [214, 190, 26], [256, 168, 22], [62, 184, 34]] as [number, number, number][]) {
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.quadraticCurveTo(x - 4, y + l, x, y + l + 6);
        ctx.quadraticCurveTo(x + 4, y + l, x + 6, y);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + l + 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(266, 74);
      ctx.lineTo(262, 34);
      ctx.lineTo(286, 70);
      ctx.moveTo(286, 76);
      ctx.lineTo(296, 40);
      ctx.lineTo(304, 84);
      ctx.fill();
      ctx.fillStyle = '#e9e2f0';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(282 + i * 6, 126);
        ctx.lineTo(285 + i * 6, 136);
        ctx.lineTo(288 + i * 6, 126);
        ctx.fill();
      }
      eyes(ctx, [[282, 96], [298, 98]], 5, '#e8f0ff');
    },
  },
  widow: {
    w: 300, h: 440,
    draw(ctx) {
      const cx = 150;
      aura(ctx, () => {
        const skirt = polyPath([[cx - 34, 236], [cx + 34, 236], [cx + 108, 420], [cx - 108, 420]], false);
        part(ctx, skirt, { fill: '#2c1530', shadowCircle: [cx + 150, 400, 130], highlight: [cx - 50, 330, 40, '#47244e'] });
      }, '#c08cff', 20);
      ctx.strokeStyle = rgba('#8a5aa0', 0.5);
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 8, 240);
        ctx.quadraticCurveTo(cx + i * 22, 340, cx + i * 30, 418);
        ctx.stroke();
      }
      ctx.fillStyle = '#120a14';
      for (let x = cx - 104; x < cx + 104; x += 14) {
        ctx.beginPath();
        ctx.arc(x + 7, 420, 7, 0, Math.PI);
        ctx.fill();
      }
      const bodice = polyPath([[cx - 22, 160], [cx + 22, 160], [cx + 40, 180], [cx + 34, 240], [cx - 34, 240], [cx - 40, 180]], true);
      part(ctx, bodice, { fill: '#3a1c40', shadowCircle: [cx + 60, 240, 50] });
      part(ctx, roundRectPath(cx - 60, 176, 18, 96, 8), { fill: '#120a14', shadow: false });
      part(ctx, roundRectPath(cx + 42, 176, 18, 70, 8), { fill: '#120a14', shadow: false });
      ctx.save();
      ctx.translate(cx + 52, 246);
      for (let i = -3; i <= 3; i++) {
        ctx.save();
        ctx.rotate(-Math.PI / 2 + i * 0.22);
        part(ctx, polyPath([[0, 0], [-7, -60], [7, -60]]), { fill: i % 2 ? '#2a1830' : '#3c2444', shadow: false, outline: 1.6 });
        ctx.restore();
      }
      ctx.restore();
      part(ctx, polyPath([[cx - 26, 150], [cx + 26, 150], [cx + 18, 176], [cx - 18, 176]]), { fill: '#1c0e20', shadow: false });
      part(ctx, ellipsePath(cx, 116, 34, 40), { fill: '#d9cfe0', shadowCircle: [cx + 40, 140, 36], shadow: '#a596b4' });
      ctx.fillStyle = rgba('#120a16', 0.82);
      ctx.beginPath();
      ctx.moveTo(cx - 50, 92);
      ctx.quadraticCurveTo(cx, 60, cx + 50, 92);
      ctx.lineTo(cx + 44, 132);
      ctx.quadraticCurveTo(cx, 150, cx - 44, 132);
      ctx.closePath();
      ctx.fill();
      part(ctx, ellipsePath(cx, 80, 62, 14), { fill: '#120a14', shadow: false, outline: 2 });
      part(ctx, ellipsePath(cx, 66, 30, 18), { fill: '#1e1022', shadow: false, outline: 2 });
      eyes(ctx, [[cx - 14, 112], [cx + 14, 112]], 4.5, '#d6a8ff');
      ctx.fillStyle = '#9e2a3c';
      ctx.beginPath();
      ctx.ellipse(cx, 138, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  lampeater: {
    w: 360, h: 340,
    draw(ctx) {
      const cx = 180;
      aura(ctx, () => {
        wing(ctx, [cx - 10, 130], [20, 40], 70, '#4d4237');
        wing(ctx, [cx + 10, 130], [340, 40], 70, '#4d4237');
      }, '#ffbf6a', 16);
      ctx.fillStyle = '#16111c';
      for (const [x, y] of [[40, 52], [70, 30], [300, 34], [326, 58]] as Pt[]) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      wing(ctx, [cx - 8, 160], [60, 260], 44, '#3a3029');
      wing(ctx, [cx + 8, 160], [300, 260], 44, '#3a3029');
      const abdomen = polyPath([[cx, 110], [cx + 34, 140], [cx + 36, 230], [cx, 300], [cx - 36, 230], [cx - 34, 140]], true);
      part(ctx, abdomen, { fill: '#2e2630', shadowCircle: [cx + 50, 280, 60] });
      glow(ctx, cx, 200, 80, '#ffc56a', 0.85);
      part(ctx, ellipsePath(cx, 200, 22, 30), { fill: '#ffe2a0', shadow: false, highlight: [cx - 6, 190, 8, '#fffbe8'] });
      ctx.strokeStyle = '#1c1418';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 10, 168);
        ctx.quadraticCurveTo(cx + i * 14, 200, cx + i * 10, 232);
        ctx.stroke();
      }
      part(ctx, ellipsePath(cx, 104, 30, 26), { fill: '#3a3040', shadowCircle: [cx + 26, 124, 22] });
      ctx.fillStyle = '#1a141e';
      ctx.beginPath();
      ctx.moveTo(cx - 12, 124);
      ctx.quadraticCurveTo(cx - 22, 146, cx - 6, 150);
      ctx.moveTo(cx + 12, 124);
      ctx.quadraticCurveTo(cx + 22, 146, cx + 6, 150);
      ctx.fill();
      eyes(ctx, [[cx - 14, 98], [cx + 14, 98], [cx - 6, 88], [cx + 6, 88]], 4, '#ffcf6a');
    },
  },
  curtaincaller: {
    w: 460, h: 580,
    draw(ctx) {
      const cx = 230;
      aura(ctx, () => {
        const cape = polyPath([[cx - 40, 150], [cx + 40, 150], [cx + 200, 560], [cx - 200, 560]]);
        part(ctx, cape, { fill: '#7a1a24', shadowCircle: [cx + 260, 520, 230] });
      }, '#ff8a6a', 24);
      for (let i = -6; i <= 6; i++) {
        const x0 = cx + i * 6;
        const x1 = cx + i * 32;
        const g = ctx.createLinearGradient(x1 - 16, 0, x1 + 16, 0);
        g.addColorStop(0, rgba('#3a060e', 0.0));
        g.addColorStop(0.5, rgba('#3a060e', 0.55));
        g.addColorStop(1, rgba('#3a060e', 0.0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0 - 3, 160);
        ctx.lineTo(x1 - 16, 556);
        ctx.lineTo(x1 + 16, 556);
        ctx.lineTo(x0 + 3, 160);
        ctx.fill();
      }
      ctx.fillStyle = '#e2be6a';
      for (let x = cx - 196; x <= cx + 196; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x - 5, 552);
        ctx.lineTo(x + 5, 552);
        ctx.lineTo(x + 2, 576);
        ctx.lineTo(x - 2, 576);
        ctx.fill();
      }
      ctx.strokeStyle = '#e2be6a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 60, 200);
      ctx.quadraticCurveTo(cx, 260, cx + 60, 200);
      ctx.stroke();
      // Arms + crook
      part(ctx, polyPath([[cx - 52, 176], [cx - 30, 196], [cx - 118, 392], [cx - 150, 384]], true), { fill: '#5a1018', shadowCircle: [cx - 60, 420, 60] });
      part(ctx, ellipsePath(cx - 136, 398, 16, 16), { fill: '#efe8dc', shadow: false });
      ctx.strokeStyle = '#1a1016';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx + 150, 560);
      ctx.lineTo(cx + 150, 150);
      ctx.arc(cx + 120, 150, 30, 0, Math.PI, true);
      ctx.stroke();
      ctx.strokeStyle = '#c9a24a';
      ctx.lineWidth = 5;
      ctx.stroke();
      part(ctx, polyPath([[cx + 52, 176], [cx + 30, 196], [cx + 136, 240], [cx + 156, 216]], true), { fill: '#5a1018', shadowCircle: [cx + 150, 260, 40] });
      part(ctx, ellipsePath(cx + 150, 226, 16, 16), { fill: '#efe8dc', shadow: false });
      // Mask
      glow(ctx, cx, 100, 96, '#ffe2a0', 0.25);
      const mask = new Path2D();
      mask.moveTo(cx - 60, 60);
      mask.quadraticCurveTo(cx, 30, cx + 60, 60);
      mask.quadraticCurveTo(cx + 66, 130, cx, 170);
      mask.quadraticCurveTo(cx - 66, 130, cx - 60, 60);
      part(ctx, mask, { fill: '#f1ebe0', shadowCircle: [cx + 70, 140, 70], shadow: '#c8bcae', highlight: [cx - 24, 62, 14, '#ffffff'] });
      ctx.fillStyle = '#16101a';
      ctx.beginPath();
      ctx.moveTo(cx - 40, 92);
      ctx.quadraticCurveTo(cx - 24, 76, cx - 10, 94);
      ctx.quadraticCurveTo(cx - 24, 100, cx - 40, 92);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 40, 88);
      ctx.quadraticCurveTo(cx + 24, 104, cx + 10, 90);
      ctx.quadraticCurveTo(cx + 24, 82, cx + 40, 88);
      ctx.fill();
      ctx.strokeStyle = '#16101a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 30, 134);
      ctx.quadraticCurveTo(cx - 10, 150, cx, 136);
      ctx.quadraticCurveTo(cx + 12, 124, cx + 30, 140);
      ctx.stroke();
      eyes(ctx, [[cx - 24, 92]], 5, '#ffcf6a');
      ctx.strokeStyle = '#e2be6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, 36, 70, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  gloam: {
    w: 460, h: 600,
    draw(ctx) {
      const cx = 230;
      glow(ctx, cx, 112, 110, '#c8d8ff', 0.35);
      ctx.fillStyle = '#05060c';
      ctx.beginPath();
      ctx.arc(cx, 110, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba('#e8eeff', 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
      aura(ctx, () => {
        const gown = new Path2D();
        gown.moveTo(cx - 34, 200);
        gown.lineTo(cx + 34, 200);
        gown.bezierCurveTo(cx + 70, 330, cx + 150, 470, cx + 190, 580);
        for (let x = cx + 190; x >= cx - 190; x -= 38) {
          gown.quadraticCurveTo(x - 19, 540 + ((x / 38) % 2) * 30, x - 38, 590);
        }
        gown.bezierCurveTo(cx - 150, 470, cx - 70, 330, cx - 34, 200);
        part(ctx, gown, { fill: '#1d1a3c', shadowCircle: [cx + 220, 520, 200], highlight: [cx - 60, 360, 50, '#2e2a5a'] });
      }, '#8fa7ff', 26);
      ctx.fillStyle = rgba('#a8b8ff', 0.25);
      const r = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1;
      for (let i = 0; i < 40; i++) {
        const x = cx + (Math.abs(r(i)) - 0.5) * 300;
        const y = 300 + Math.abs(r(i + 99)) * 280;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const s of [-1, 1]) {
        const sleeve = polyPath([[cx + s * 34, 206], [cx + s * 50, 214], [cx + s * 118, 420], [cx + s * 92, 440], [cx + s * 70, 420]], true);
        part(ctx, sleeve, { fill: '#232050', shadowCircle: [cx + s * 40 + 80, 460, 70] });
        part(ctx, ellipsePath(cx + s * 96, 432, 12, 14), { fill: '#d6d8ea', shadow: false });
      }
      glow(ctx, cx, 250, 50, '#dcef72', 0.9);
      part(ctx, ellipsePath(cx, 250, 14, 18), { fill: '#eef7b0', shadow: false, highlight: [cx - 4, 244, 5, '#ffffff'] });
      part(ctx, ellipsePath(cx, 142, 40, 48), { fill: '#e2e4f2', shadowCircle: [cx + 46, 170, 44], shadow: '#a8acc8' });
      ctx.fillStyle = '#0b0a18';
      ctx.beginPath();
      ctx.moveTo(cx - 50, 130);
      ctx.bezierCurveTo(cx - 60, 60, cx + 60, 60, cx + 50, 130);
      ctx.quadraticCurveTo(cx + 40, 100, cx, 98);
      ctx.quadraticCurveTo(cx - 40, 100, cx - 50, 130);
      ctx.fill();
      for (const x of [cx - 15, cx + 15]) {
        ctx.save();
        ctx.translate(x, 146);
        glow(ctx, 0, 0, 16, '#c8d8ff', 0.8);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const rr = i % 2 === 0 ? 7 : 2.5;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#5a2a4a';
      ctx.beginPath();
      ctx.ellipse(cx, 172, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
};

export function enemySize(kind: EnemyKind): { w: number; h: number } {
  return { w: ART[kind].w, h: ART[kind].h };
}

export function enemyCanvas(kind: EnemyKind, scale: number): HTMLCanvasElement {
  const a = ART[kind];
  const { canvas, ctx } = makeCanvas(a.w * scale, a.h * scale);
  ctx.scale(scale, scale);
  a.draw(ctx);
  return canvas;
}
