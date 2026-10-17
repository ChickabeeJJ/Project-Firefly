import type { DollSpec } from '../data/types';
import {
  type Ctx, OUTLINE, ellipsePath, glow, light, makeCanvas, mix, part, polyPath, rgba, roundRectPath, shade,
} from './paint';

// Chibi "doll" renderer for the Luminaries. Local space is 220 × 380 with the feet at y ≈ 370.
// Light comes from the upper left, so cel shadows fall to the lower right.

export const DOLL_W = 220;
export const DOLL_H = 380;

type Pt = [number, number];

function limb(ctx: Ctx, a: Pt, b: Pt, w1: number, w2: number, fill: string): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const p = new Path2D();
  p.moveTo(a[0] + nx * w1, a[1] + ny * w1);
  p.lineTo(b[0] + nx * w2, b[1] + ny * w2);
  p.arc(b[0], b[1], w2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, false);
  p.lineTo(a[0] - nx * w1, a[1] - ny * w1);
  p.arc(a[0], a[1], w1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, false);
  p.closePath();
  part(ctx, p, { fill, shadowCircle: [b[0] + 26, b[1] + 6, 30] });
}

function hand(ctx: Ctx, x: number, y: number, skin: string, r = 9.5): void {
  part(ctx, ellipsePath(x, y, r, r * 1.05), { fill: skin, shadowCircle: [x + 9, y + 7, 9] });
}

// ---------------------------------------------------------------------------- hair

function backHair(ctx: Ctx, s: DollSpec): void {
  const f = s.hair;
  const sc: [number, number, number] = [176, 190, 70];
  const pts: Record<string, Pt[]> = {
    bob: [[44, 150], [42, 108], [60, 76], [110, 60], [160, 76], [178, 108], [176, 150], [174, 204], [150, 212], [110, 206], [70, 212], [46, 204]],
    long: [[44, 150], [42, 108], [60, 76], [110, 60], [160, 76], [178, 108], [178, 180], [186, 262], [172, 312], [142, 300], [110, 286], [78, 300], [48, 312], [34, 262], [42, 180]],
    wavy: [[42, 150], [40, 106], [60, 74], [110, 58], [160, 74], [180, 106], [178, 150], [184, 186], [172, 214], [156, 202], [140, 218], [110, 208], [80, 218], [64, 202], [48, 214], [36, 186]],
    short: [[50, 142], [48, 108], [64, 78], [110, 64], [156, 78], [172, 108], [170, 142], [160, 166], [60, 166]],
    slick: [[54, 138], [54, 104], [70, 78], [110, 68], [150, 78], [166, 104], [166, 138], [158, 156], [62, 156]],
    curly: [[42, 150], [38, 112], [52, 80], [80, 62], [110, 56], [140, 62], [168, 80], [182, 112], [178, 150], [182, 184], [160, 206], [110, 200], [60, 206], [38, 184]],
    bun: [[50, 142], [48, 108], [64, 78], [110, 64], [156, 78], [172, 108], [170, 142], [160, 166], [60, 166]],
    ponytail: [[50, 142], [48, 108], [64, 78], [110, 64], [156, 78], [172, 108], [170, 142], [160, 166], [60, 166]],
  };
  if (s.hairStyle === 'bun') part(ctx, ellipsePath(110, 62, 26, 22), { fill: f, shadowCircle: [128, 78, 22] });
  if (s.hairStyle === 'ponytail') part(ctx, polyPath([[150, 90], [190, 120], [196, 200], [176, 240], [170, 180], [156, 130]], true), { fill: f, shadowCircle: [196, 210, 40] });
  part(ctx, polyPath(pts[s.hairStyle] ?? pts.short, true), { fill: shade(f, 0.18), shadowCircle: sc });
  if (s.hairStyle === 'curly') {
    for (const [x, y] of [[44, 176], [56, 200], [176, 176], [164, 200], [40, 140], [180, 140]] as Pt[]) {
      part(ctx, ellipsePath(x, y, 14, 14), { fill: shade(f, 0.18), shadowCircle: [x + 10, y + 8, 12] });
    }
  }
}

function frontHair(ctx: Ctx, s: DollSpec): void {
  const f = s.hair;
  const p = new Path2D();
  switch (s.bangs) {
    case 'straight': {
      p.moveTo(52, 146);
      p.bezierCurveTo(40, 66, 180, 66, 168, 146);
      const tips: Pt[] = [[160, 120], [150, 128], [140, 114], [126, 126], [112, 112], [98, 126], [86, 114], [72, 128], [62, 118]];
      let prev: Pt = [168, 146];
      for (const t of tips) {
        p.quadraticCurveTo((prev[0] + t[0]) / 2, Math.min(prev[1], t[1]) - 10, t[0], t[1]);
        prev = t;
      }
      p.quadraticCurveTo(56, 126, 52, 146);
      break;
    }
    case 'side': {
      p.moveTo(52, 140);
      p.bezierCurveTo(42, 66, 180, 66, 168, 140);
      const tips: Pt[] = [[160, 132], [146, 136], [138, 120], [122, 126], [112, 108], [96, 116], [86, 100], [70, 110], [60, 102]];
      let prev: Pt = [168, 140];
      for (const t of tips) {
        p.quadraticCurveTo((prev[0] + t[0]) / 2 + 4, Math.min(prev[1], t[1]) - 8, t[0], t[1]);
        prev = t;
      }
      p.quadraticCurveTo(52, 112, 52, 140);
      break;
    }
    case 'parted':
    case 'curl': {
      p.moveTo(110, 76);
      p.bezierCurveTo(70, 74, 46, 100, 50, 150);
      p.quadraticCurveTo(62, 126, 74, 122);
      p.quadraticCurveTo(84, 104, 98, 108);
      p.quadraticCurveTo(106, 94, 110, 84);
      p.quadraticCurveTo(114, 94, 122, 108);
      p.quadraticCurveTo(136, 104, 146, 122);
      p.quadraticCurveTo(158, 126, 170, 150);
      p.bezierCurveTo(174, 100, 150, 74, 110, 76);
      break;
    }
    case 'none': {
      p.moveTo(54, 132);
      p.bezierCurveTo(46, 66, 174, 66, 166, 132);
      p.quadraticCurveTo(160, 104, 110, 100);
      p.quadraticCurveTo(60, 104, 54, 132);
      break;
    }
  }
  part(ctx, p, { fill: f, shadowCircle: [170, 150, 52], highlight: [86, 74, 26, light(f, 0.28)] });
  // Angel ring sheen.
  ctx.save();
  ctx.clip(p);
  ctx.strokeStyle = rgba('#fff6e6', 0.35);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(110, 132, 48, Math.PI * 1.12, Math.PI * 1.62);
  ctx.stroke();
  ctx.restore();
  if (s.bangs === 'curl') {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    part(ctx, ellipsePath(70, 124, 10, 12), { fill: f, shadowCircle: [78, 132, 9] });
  }
  if (s.hairStyle === 'bob' || s.hairStyle === 'long' || s.hairStyle === 'wavy') {
    for (const side of [-1, 1]) {
      const x = 110 + side * 58;
      const lock = polyPath([[x, 120], [x + side * 6, 150], [x + side * 2, 196], [x - side * 6, 206], [x - side * 10, 160], [x - side * 8, 126]], true);
      part(ctx, lock, { fill: f, shadowCircle: [x + 12, 200, 20] });
    }
  }
}

// ---------------------------------------------------------------------------- face

/** `outer` is −1 for the eye on the viewer's left (outer corner points left), +1 otherwise. */
function eye(ctx: Ctx, cx: number, cy: number, iris: string, outer: number, style: DollSpec['eyeStyle']): void {
  ctx.strokeStyle = OUTLINE;
  if (style === 'happy') {
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 12, cx + 11, cy + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 11 * outer, cy + 1);
    ctx.lineTo(cx + 15 * outer, cy - 3);
    ctx.stroke();
    return;
  }
  const lidDrop = style === 'soft' ? 5 : 0;
  const irisPath = ellipsePath(cx, cy, 10.5, 13);
  const g = ctx.createLinearGradient(cx, cy - 13, cx, cy + 13);
  g.addColorStop(0, shade(iris, 0.55));
  g.addColorStop(0.55, iris);
  g.addColorStop(1, light(iris, 0.35));
  ctx.save();
  // Soft eyes: the upper lid covers the top of the iris.
  const clip = new Path2D();
  clip.rect(cx - 16, cy - 14 + lidDrop, 32, 30);
  ctx.clip(clip);
  ctx.fillStyle = g;
  ctx.fill(irisPath);
  ctx.fillStyle = shade(iris, 0.75);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4 + lidDrop * 0.6, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3.5, cy + 6, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(cx - 12 * outer, cy - 9 + lidDrop);
  ctx.quadraticCurveTo(cx + 1 * outer, cy - 17 + lidDrop, cx + 13 * outer, cy - 7 + lidDrop * 0.6);
  ctx.lineTo(cx + 17 * outer, cy - 10 + lidDrop * 0.6);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 5 * outer, cy + 13.5);
  ctx.lineTo(cx + 6 * outer, cy + 14);
  ctx.stroke();
}

function mouth(ctx: Ctx, s: DollSpec): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  switch (s.mouth ?? 'smile') {
    case 'grin': {
      const m = new Path2D();
      m.moveTo(102, 180);
      m.quadraticCurveTo(110, 181, 118, 179);
      m.quadraticCurveTo(116, 191, 110, 191);
      m.quadraticCurveTo(103, 191, 102, 180);
      part(ctx, m, { fill: '#8a3a3e', shadow: false, highlight: [110, 192, 5, '#e2787a'], outline: 2.2 });
      break;
    }
    case 'smirk':
      ctx.beginPath();
      ctx.moveTo(103, 183);
      ctx.quadraticCurveTo(112, 186, 119, 179);
      ctx.stroke();
      break;
    case 'flat':
      ctx.beginPath();
      ctx.moveTo(104, 183);
      ctx.quadraticCurveTo(110, 185, 116, 183);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.moveTo(103, 181);
      ctx.quadraticCurveTo(110, 187, 117, 181);
      ctx.stroke();
  }
}

function face(ctx: Ctx, s: DollSpec): void {
  // Neck
  part(ctx, roundRectPath(99, 192, 22, 22, 6), { fill: shade(s.skin, 0.14), shadow: false });
  // Head
  const head = new Path2D();
  head.moveTo(52, 138);
  head.bezierCurveTo(52, 70, 168, 70, 168, 138);
  head.bezierCurveTo(168, 178, 140, 202, 110, 204);
  head.bezierCurveTo(80, 202, 52, 178, 52, 138);
  part(ctx, head, { fill: s.skin, shadowCircle: [196, 180, 62], shadow: mix(s.skin, '#b36a62', 0.32) });
  // Cheeks
  ctx.fillStyle = rgba('#e86f6a', 0.28);
  ctx.beginPath();
  ctx.ellipse(80, 172, 10, 5.5, 0, 0, Math.PI * 2);
  ctx.ellipse(140, 172, 10, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (s.freckles) {
    ctx.fillStyle = rgba('#8a4a30', 0.55);
    for (const [x, y] of [[74, 166], [80, 170], [86, 166], [134, 166], [140, 170], [146, 166]] as Pt[]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  eye(ctx, 88, 152, s.eyes, -1, s.eyeStyle);
  eye(ctx, 132, 152, s.eyes, 1, s.eyeStyle);
  ctx.strokeStyle = mix(s.skin, '#6b3a34', 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 168);
  ctx.lineTo(108, 172);
  ctx.stroke();
  mouth(ctx, s);
  if (s.mustache) {
    const m = new Path2D();
    m.moveTo(110, 176);
    m.quadraticCurveTo(96, 170, 88, 180);
    m.quadraticCurveTo(98, 182, 110, 179);
    m.quadraticCurveTo(122, 182, 132, 180);
    m.quadraticCurveTo(124, 170, 110, 176);
    part(ctx, m, { fill: s.hair, shadow: false, outline: 2 });
  }
}

function brows(ctx: Ctx, s: DollSpec): void {
  // Soft arcs, inner ends slightly higher: calm and kind rather than cross.
  ctx.strokeStyle = rgba(shade(s.hair, 0.45), 0.8);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(77, 129);
  ctx.quadraticCurveTo(86, 121, 97, 125);
  ctx.moveTo(143, 129);
  ctx.quadraticCurveTo(134, 121, 123, 125);
  ctx.stroke();
}

function eyewear(ctx: Ctx, s: DollSpec): void {
  if (s.glasses) {
    ctx.strokeStyle = '#b8913e';
    ctx.lineWidth = 2.6;
    for (const x of [88, 132]) {
      ctx.fillStyle = rgba('#dfefff', 0.18);
      ctx.beginPath();
      ctx.arc(x, 152, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, 152, 11, Math.PI * 1.15, Math.PI * 1.4);
      ctx.stroke();
      ctx.strokeStyle = '#b8913e';
      ctx.lineWidth = 2.6;
    }
    ctx.beginPath();
    ctx.moveTo(104, 150);
    ctx.quadraticCurveTo(110, 146, 116, 150);
    ctx.stroke();
  }
  if (s.monocle) {
    ctx.strokeStyle = '#d6b45a';
    ctx.lineWidth = 3;
    ctx.fillStyle = rgba('#dfefff', 0.2);
    ctx.beginPath();
    ctx.arc(132, 152, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(148, 158);
    ctx.quadraticCurveTo(162, 200, 146, 236);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------- hats

function hat(ctx: Ctx, s: DollSpec): void {
  const c = s.hatColor ?? '#333';
  const a = s.hatAccent ?? shade(c, 0.3);
  switch (s.hat) {
    case 'newsboy':
    case 'flatcap': {
      const flat = s.hat === 'flatcap';
      const crown = polyPath(flat
        ? [[48, 116], [52, 90], [84, 72], [140, 70], [172, 86], [176, 112]]
        : [[46, 116], [50, 80], [82, 58], [134, 56], [168, 70], [180, 100], [174, 118]], true);
      part(ctx, crown, { fill: c, shadowCircle: [190, 130, 60], highlight: [84, 66, 22] });
      ctx.strokeStyle = rgba(shade(c, 0.5), 0.8);
      ctx.lineWidth = 1.8;
      for (const [x, y] of [[70, 108], [100, 112], [134, 110], [162, 104]] as Pt[]) {
        ctx.beginPath();
        ctx.moveTo(112, flat ? 76 : 62);
        ctx.quadraticCurveTo((112 + x) / 2 - 4, (y + 60) / 2, x, y);
        ctx.stroke();
      }
      const brim = new Path2D();
      brim.moveTo(56, 112);
      brim.quadraticCurveTo(116, 136, 182, 114);
      brim.quadraticCurveTo(170, 106, 112, 108);
      brim.quadraticCurveTo(76, 106, 56, 112);
      part(ctx, brim, { fill: a, shadow: false });
      if (!flat) part(ctx, ellipsePath(112, 60, 6, 5), { fill: a, shadow: false, outline: 2 });
      break;
    }
    case 'tophat': {
      part(ctx, ellipsePath(112, 92, 76, 15), { fill: shade(c, 0.1), shadow: false });
      const crown = polyPath([[68, 92], [62, 8], [162, 8], [156, 92]]);
      part(ctx, crown, { fill: c, shadowCircle: [196, 60, 54], highlight: [74, 30, 16, light(c, 0.2)] });
      part(ctx, roundRectPath(66, 64, 92, 18, 3), { fill: a, shadow: false, outline: 2 });
      part(ctx, ellipsePath(112, 8, 50, 9), { fill: light(c, 0.12), shadow: false });
      const front = new Path2D();
      front.ellipse(112, 92, 76, 15, 0, 0, Math.PI);
      front.lineTo(36, 92);
      part(ctx, front, { fill: c, shadow: false });
      break;
    }
    case 'bowler': {
      const dome = new Path2D();
      dome.ellipse(112, 100, 58, 50, 0, Math.PI, Math.PI * 2);
      dome.closePath();
      part(ctx, dome, { fill: c, shadowCircle: [176, 110, 50], highlight: [86, 64, 16, light(c, 0.22)] });
      part(ctx, roundRectPath(56, 86, 112, 12, 4), { fill: a, shadow: false, outline: 2 });
      part(ctx, ellipsePath(112, 100, 72, 11), { fill: shade(c, 0.05), shadow: false });
      break;
    }
    case 'headband': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(110, 140, 56, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 8;
      ctx.stroke();
      const feather = new Path2D();
      feather.moveTo(74, 104);
      feather.bezierCurveTo(40, 70, 44, 20, 66, 4);
      feather.bezierCurveTo(80, 30, 88, 70, 74, 104);
      part(ctx, feather, { fill: a, shadowCircle: [96, 40, 26] });
      ctx.strokeStyle = rgba(shade(a, 0.5), 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(74, 102);
      ctx.quadraticCurveTo(58, 56, 66, 8);
      ctx.stroke();
      part(ctx, ellipsePath(78, 100, 9, 9), { fill: '#e2be6a', shadow: false, highlight: [75, 97, 3, '#fff6e6'] });
      break;
    }
    case 'coif': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(110, 146, 60, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 16;
      ctx.stroke();
      break;
    }
    case 'aviator': {
      const cap = polyPath([[46, 156], [44, 104], [62, 72], [110, 60], [158, 72], [176, 104], [174, 156], [164, 182], [154, 154], [152, 116], [68, 116], [66, 154], [56, 182]], true);
      part(ctx, cap, { fill: c, shadowCircle: [190, 150, 60], highlight: [80, 74, 18] });
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(52, 108);
      ctx.quadraticCurveTo(110, 92, 168, 108);
      ctx.stroke();
      for (const x of [90, 130]) {
        part(ctx, ellipsePath(x, 100, 16, 14), { fill: '#6b5032', shadow: false });
        part(ctx, ellipsePath(x, 100, 11, 9.5), { fill: a, shadow: false, highlight: [x - 4, 96, 4, '#ffffff'], outline: 2 });
      }
      break;
    }
    case 'veil': {
      const pill = roundRectPath(112, 64, 52, 26, 8);
      ctx.save();
      ctx.translate(138, 77);
      ctx.rotate(0.18);
      ctx.translate(-138, -77);
      part(ctx, pill, { fill: c, shadowCircle: [170, 92, 24] });
      part(ctx, ellipsePath(150, 70, 6, 6), { fill: a, shadow: false, outline: 2 });
      ctx.restore();
      ctx.fillStyle = rgba(shade(c, 0.4), 0.22);
      const mesh = new Path2D();
      mesh.moveTo(54, 122);
      mesh.quadraticCurveTo(110, 96, 168, 118);
      mesh.lineTo(168, 166);
      mesh.quadraticCurveTo(110, 178, 54, 166);
      mesh.closePath();
      ctx.fill(mesh);
      ctx.save();
      ctx.clip(mesh);
      ctx.strokeStyle = rgba('#120a18', 0.28);
      ctx.lineWidth = 0.9;
      for (let d = -120; d < 140; d += 7) {
        ctx.beginPath();
        ctx.moveTo(40 + d, 96);
        ctx.lineTo(120 + d, 180);
        ctx.moveTo(180 - d, 96);
        ctx.lineTo(100 - d, 180);
        ctx.stroke();
      }
      ctx.restore();
      for (const x of [62, 82, 102, 122, 142, 160]) {
        part(ctx, ellipsePath(x, 170 - Math.abs(x - 110) * 0.08, 3.2, 3.2), { fill: a, shadow: false, outline: 1.4 });
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------- body

interface BodyLayout {
  hem: number;
  sleeves: string;
  legsVisibleFrom: number;
}

function layoutFor(s: DollSpec): BodyLayout {
  switch (s.outfit) {
    case 'coat': return { hem: 318, sleeves: s.coat, legsVisibleFrom: 312 };
    case 'labcoat': return { hem: 336, sleeves: s.coat, legsVisibleFrom: 320 };
    case 'dress': return { hem: 318, sleeves: s.accent, legsVisibleFrom: 312 };
    case 'suit': return { hem: 296, sleeves: s.coat, legsVisibleFrom: 286 };
    case 'robe': return { hem: 352, sleeves: s.coat, legsVisibleFrom: 346 };
    case 'vest': return { hem: 286, sleeves: s.shirt, legsVisibleFrom: 280 };
    case 'jacket': return { hem: 290, sleeves: s.coat, legsVisibleFrom: 284 };
    case 'tailcoat': return { hem: 280, sleeves: s.coat, legsVisibleFrom: 276 };
  }
}

function legs(ctx: Ctx, s: DollSpec, L: BodyLayout): void {
  const legColor = s.skirt ? (s.outfit === 'dress' ? s.legs : s.legs) : s.legs;
  for (const x of [94, 126]) {
    const top = Math.min(L.legsVisibleFrom, 300);
    part(ctx, roundRectPath(x - 10, top - 10, 20, 362 - top, 8), { fill: legColor, shadowCircle: [x + 14, 340, 14] });
  }
  for (const [x, dir] of [[92, -1], [128, 1]] as Pt[]) {
    const shoe = new Path2D();
    shoe.ellipse(x + dir * 4, 364, 15, 8, 0, 0, Math.PI * 2);
    part(ctx, shoe, { fill: s.shoes, shadow: false, highlight: [x + dir * 4 - 5, 360, 4, light(s.shoes, 0.25)] });
  }
}

function torso(ctx: Ctx, s: DollSpec, L: BodyLayout): void {
  const sc: [number, number, number] = [200, 330, 110];
  const hem = L.hem;
  if (s.outfit === 'tailcoat') {
    const tails = polyPath([[78, 250], [142, 250], [158, 330], [132, 340], [110, 300], [88, 340], [62, 330]], true);
    part(ctx, tails, { fill: shade(s.coat, 0.15), shadow: false });
  }
  if (s.outfit === 'dress') {
    const bodice = polyPath([[90, 208], [130, 208], [146, 222], [140, 266], [80, 266], [74, 222]], true);
    part(ctx, bodice, { fill: s.coat, shadowCircle: sc, highlight: [84, 220, 10] });
    const skirt = polyPath([[80, 262], [140, 262], [168, hem], [52, hem]]);
    part(ctx, skirt, { fill: s.coat, shadowCircle: [190, 330, 70] });
    ctx.strokeStyle = rgba(s.accent, 0.85);
    ctx.lineWidth = 2.4;
    for (let y = 276; y < hem; y += 12) {
      const t = (y - 262) / (hem - 262);
      const xl = 80 - 28 * t;
      const xr = 140 + 28 * t;
      ctx.beginPath();
      for (let x = xl + 3; x < xr - 3; x += 5) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y + 8);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#f4eee2';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.2 + (i / 6) * 0.6);
      ctx.beginPath();
      ctx.arc(110 + Math.cos(a) * 20, 206 + Math.sin(a) * 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const shoulderW = s.outfit === 'robe' ? 52 : 46;
  const flare = s.outfit === 'labcoat' || s.outfit === 'coat' || s.outfit === 'robe' ? 52 : 40;
  const body = polyPath([
    [96, 204], [124, 204], [110 + shoulderW - 6, 212], [110 + shoulderW, 232], [110 + shoulderW - 6, 262],
    [110 + flare, hem], [110 - flare, hem], [110 - shoulderW + 6, 262], [110 - shoulderW, 232], [110 - shoulderW + 6, 212],
  ], true);
  part(ctx, body, { fill: s.coat, shadowCircle: sc, highlight: [80, 222, 14, light(s.coat, 0.18)] });

  // Shirt front / openings
  const shirtV = (bottom: number, half = 13) => polyPath([[110 - half, 206], [110 + half, 206], [110, bottom]]);
  switch (s.outfit) {
    case 'coat':
      part(ctx, shirtV(248), { fill: s.shirt, shadow: false });
      for (const y of [262, 286]) part(ctx, ellipsePath(122, y, 3.6, 3.6), { fill: shade(s.coat, 0.4), shadow: false, outline: 1.4 });
      break;
    case 'labcoat': {
      part(ctx, polyPath([[100, 206], [120, 206], [118, hem], [102, hem]]), { fill: s.shirt, shadow: false });
      ctx.strokeStyle = rgba(shade(s.coat, 0.4), 0.8);
      ctx.lineWidth = 2;
      ctx.strokeRect(126, 282, 20, 16);
      break;
    }
    case 'suit':
      part(ctx, shirtV(256), { fill: s.shirt, shadow: false });
      part(ctx, polyPath([[106, 210], [114, 210], [117, 254], [110, 264], [103, 254]]), { fill: s.accent, shadow: false, outline: 2 });
      break;
    case 'robe':
      part(ctx, ellipsePath(110, 218, 36, 20), { fill: s.shirt, shadowCircle: [140, 236, 20] });
      part(ctx, ellipsePath(110, 250, 9, 9), { fill: s.accent, shadow: false, highlight: [107, 247, 3, '#fff6e6'] });
      break;
    case 'vest': {
      part(ctx, shirtV(240, 11), { fill: s.shirt, shadow: false });
      for (const y of [246, 262, 278]) part(ctx, ellipsePath(110, y, 3, 3), { fill: s.accent, shadow: false, outline: 1.2 });
      break;
    }
    case 'jacket': {
      part(ctx, polyPath([[78, 210], [96, 202], [110, 222], [124, 202], [142, 210], [130, 232], [110, 236], [90, 232]], true), { fill: s.shirt, shadowCircle: [150, 240, 20] });
      part(ctx, roundRectPath(64, hem - 12, 92, 12, 4), { fill: shade(s.coat, 0.2), shadow: false, outline: 2 });
      break;
    }
    case 'tailcoat': {
      part(ctx, shirtV(262, 15), { fill: s.shirt, shadow: false });
      const bow = new Path2D();
      bow.moveTo(110, 212);
      bow.lineTo(96, 204);
      bow.lineTo(96, 220);
      bow.closePath();
      bow.moveTo(110, 212);
      bow.lineTo(124, 204);
      bow.lineTo(124, 220);
      bow.closePath();
      part(ctx, bow, { fill: s.accent, shadow: false, outline: 2 });
      break;
    }
  }
  if (s.scarf) {
    part(ctx, ellipsePath(110, 210, 28, 10), { fill: s.accent, shadowCircle: [134, 220, 14] });
    part(ctx, polyPath([[92, 212], [104, 214], [100, 256], [86, 252]], true), { fill: s.accent, shadowCircle: [110, 256, 14] });
  }
}

function arms(ctx: Ctx, s: DollSpec, L: BodyLayout): void {
  const sleeve = L.sleeves;
  const skin = s.skin;
  const left: Pt = [62, 296];
  switch (s.prop) {
    case 'gloves': {
      limb(ctx, [70, 222], [66, 256], 11, 9, sleeve);
      limb(ctx, [66, 256], [86, 246], 9, 8, skin);
      limb(ctx, [150, 222], [158, 250], 11, 9, sleeve);
      limb(ctx, [158, 250], [138, 236], 9, 8, skin);
      for (const [x, y] of [[90, 244], [136, 232]] as Pt[]) {
        part(ctx, ellipsePath(x, y, 18, 16), { fill: '#c23b2f', shadowCircle: [x + 14, y + 10, 16], highlight: [x - 6, y - 6, 5, '#f08a78'] });
      }
      return;
    }
    default:
      limb(ctx, [70, 222], left, 11, 9, sleeve);
      hand(ctx, left[0], left[1] + 4, skin);
  }
  const raised = s.prop === 'match' || s.prop === 'baton' || s.prop === 'crystal' || s.prop === 'cards' || s.prop === 'feather';
  if (raised) {
    limb(ctx, [150, 222], [164, 262], 11, 9, sleeve);
    limb(ctx, [164, 262], [172, 236], 9, 8, sleeve);
    prop(ctx, s, [172, 232]);
    hand(ctx, 172, 232, skin);
  } else {
    limb(ctx, [150, 222], [158, 292], 11, 9, sleeve);
    prop(ctx, s, [158, 298]);
    hand(ctx, 158, 298, skin);
  }
}

function prop(ctx: Ctx, s: DollSpec, h: Pt): void {
  const [x, y] = h;
  switch (s.prop) {
    case 'match': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 6);
      ctx.lineTo(x + 10, y - 50);
      ctx.stroke();
      ctx.strokeStyle = '#e8d2a4';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      glow(ctx, x + 11, y - 64, 40, '#ffb347', 0.8);
      const fl = new Path2D();
      fl.moveTo(x + 11, y - 86);
      fl.quadraticCurveTo(x + 24, y - 64, x + 12, y - 52);
      fl.quadraticCurveTo(x - 2, y - 62, x + 11, y - 86);
      part(ctx, fl, { fill: '#ffcf5a', shadow: false, highlight: [x + 10, y - 60, 5, '#fff6d0'], outline: 2 });
      break;
    }
    case 'baton': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 4);
      ctx.lineTo(x + 34, y - 60);
      ctx.stroke();
      ctx.strokeStyle = '#f4efe4';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
    case 'crystal': {
      glow(ctx, x + 2, y - 26, 44, '#b78cff', 0.6);
      part(ctx, ellipsePath(x + 2, y - 24, 19, 19), { fill: '#7f63c8', shadowCircle: [x + 18, y - 10, 18], highlight: [x - 4, y - 32, 6, '#efe6ff'] });
      break;
    }
    case 'cards': {
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.translate(x + 4, y - 14);
        ctx.rotate(i * 0.32);
        part(ctx, roundRectPath(-11, -30, 22, 32, 3), { fill: i === 0 ? '#f6efe2' : '#ece2cc', shadow: false, outline: 2 });
        ctx.fillStyle = i === 0 ? '#b23a48' : '#2a2430';
        ctx.beginPath();
        ctx.arc(0, -15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'feather': {
      const boa = new Path2D();
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const bx = 64 + t * 112;
        const by = 214 + Math.sin(t * Math.PI) * -8 + t * 6;
        boa.moveTo(bx + 10, by);
        boa.arc(bx, by, 10, 0, Math.PI * 2);
      }
      part(ctx, boa, { fill: s.hatAccent ?? '#d0392e', shadow: false, outline: 2 });
      break;
    }
    case 'lantern': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y + 14, 12, Math.PI, Math.PI * 2);
      ctx.stroke();
      glow(ctx, x, y + 42, 46, '#ffd27a', 0.7);
      part(ctx, roundRectPath(x - 15, y + 22, 30, 38, 6), { fill: '#ffe3a0', shadow: false, highlight: [x - 5, y + 34, 6, '#fff8e0'] });
      part(ctx, roundRectPath(x - 18, y + 16, 36, 8, 3), { fill: '#3a3030', shadow: false, outline: 2 });
      part(ctx, roundRectPath(x - 18, y + 58, 36, 8, 3), { fill: '#3a3030', shadow: false, outline: 2 });
      break;
    }
    case 'umbrella': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 10);
      ctx.lineTo(x + 8, y + 70);
      ctx.stroke();
      ctx.strokeStyle = '#3a2a22';
      ctx.lineWidth = 3;
      ctx.stroke();
      const canopy = polyPath([[x + 4, y - 4], [x + 18, y + 10], [x + 12, y + 56], [x + 6, y + 64], [x - 2, y + 54], [x - 8, y + 10]], true);
      part(ctx, canopy, { fill: '#2b2a33', shadowCircle: [x + 24, y + 40, 18], highlight: [x - 2, y + 14, 6, '#4a4a58'] });
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x - 6, y - 10, 9, 0, Math.PI, true);
      ctx.stroke();
      ctx.strokeStyle = '#7a4a2a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      break;
    }
    case 'book': {
      ctx.save();
      ctx.translate(x - 2, y - 4);
      ctx.rotate(-0.15);
      part(ctx, roundRectPath(-14, -22, 28, 36, 3), { fill: '#3f5a74', shadow: false, outline: 2.4 });
      part(ctx, roundRectPath(-10, -18, 4, 28, 1), { fill: '#d8c79a', shadow: false, outline: 0 });
      ctx.restore();
      break;
    }
    case 'goggles':
    default:
      break;
  }
}

// ---------------------------------------------------------------------------- public

export function drawDoll(ctx: Ctx, s: DollSpec): void {
  const L = layoutFor(s);
  if (s.hat === 'coif') {
    const veil = polyPath([[34, 140], [38, 88], [68, 58], [110, 48], [152, 58], [182, 88], [186, 140], [190, 236], [160, 256], [60, 256], [30, 236]], true);
    part(ctx, veil, { fill: s.hatAccent ?? '#20222e', shadowCircle: [210, 220, 80] });
  }
  backHair(ctx, s);
  legs(ctx, s, L);
  torso(ctx, s, L);
  arms(ctx, s, L);
  face(ctx, s);
  frontHair(ctx, s);
  brows(ctx, s);
  eyewear(ctx, s);
  if (s.hat) hat(ctx, s);
}

/** Renders a doll to its own canvas at the given scale. */
export function dollCanvas(s: DollSpec, scale: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(DOLL_W * scale, DOLL_H * scale);
  ctx.scale(scale, scale);
  drawDoll(ctx, s);
  return canvas;
}
