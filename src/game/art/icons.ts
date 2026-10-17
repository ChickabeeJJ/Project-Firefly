import { type Ctx, OUTLINE, burstPath, ellipsePath, glow, makeCanvas, part, polyPath, rgba, roundRectPath, star4 } from './paint';

// One icon family: 96 px, rounded cream strokes with a dark outline, optional colour fill.

export const ICON_SIZE = 96;
const CREAM = '#f3ead6';

type IconFn = (ctx: Ctx, color: string) => void;

function stroke(ctx: Ctx, path: Path2D, color = CREAM, w = 7): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 5;
  ctx.stroke(path);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke(path);
}

function fillOutlined(ctx: Ctx, path: Path2D, color: string, w = 4): void {
  part(ctx, path, { fill: color, shadow: false, outline: w });
}

function sunGlyph(ctx: Ctx, color: string): void {
  fillOutlined(ctx, burstPath(48, 48, 34, 20, 8), color, 3.5);
  fillOutlined(ctx, ellipsePath(48, 48, 15, 15), '#fff3cf', 3);
}

function moonGlyph(ctx: Ctx, color: string): void {
  const p = new Path2D();
  p.arc(48, 48, 30, Math.PI * 0.3, Math.PI * 1.7);
  p.bezierCurveTo(30, 30, 30, 66, 48 + 30 * Math.cos(Math.PI * 0.3), 48 + 30 * Math.sin(Math.PI * 0.3));
  p.closePath();
  fillOutlined(ctx, p, color, 3.5);
}

function starGlyph(ctx: Ctx, color: string): void {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 34 : 15;
    if (i === 0) p.moveTo(48 + Math.cos(a) * r, 50 + Math.sin(a) * r);
    else p.lineTo(48 + Math.cos(a) * r, 50 + Math.sin(a) * r);
  }
  p.closePath();
  fillOutlined(ctx, p, color, 3.5);
}

/** Mood emblem: an engraved medallion (dark disc, gilt ring with ticks) holding the glyph. */
function emblem(glyph: IconFn): IconFn {
  return (ctx, color) => {
    ctx.save();
    ctx.fillStyle = 'rgba(16,13,20,0.94)';
    ctx.beginPath();
    ctx.arc(48, 48, 44, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(8, 8, 88, 88);
    g.addColorStop(0, '#f2dba0');
    g.addColorStop(0.5, '#a07a3a');
    g.addColorStop(1, '#f0d690');
    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(48, 48, 43, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const r0 = i % 3 === 0 ? 33 : 36;
      ctx.beginPath();
      ctx.moveTo(48 + Math.cos(a) * r0, 48 + Math.sin(a) * r0);
      ctx.lineTo(48 + Math.cos(a) * 39, 48 + Math.sin(a) * 39);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(color, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(48, 48, 31, 0, Math.PI * 2);
    ctx.stroke();
    ctx.translate(48, 48);
    ctx.scale(0.66, 0.66);
    ctx.translate(-48, -48);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    glyph(ctx, color);
    ctx.restore();
  };
}

/** Fine line-art strokes (lobby and menu icons), cream with a soft shadow. */
function line(ctx: Ctx, path: Path2D, color = CREAM, w = 4.5): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 5;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke(path);
  ctx.restore();
}

function dot(ctx: Ctx, x: number, y: number, r: number, color = CREAM): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

const ICONS: Record<string, IconFn> = {
  sun: emblem(sunGlyph),
  moon: emblem(moonGlyph),
  star: emblem(starGlyph),
  // ---- line-art (lobby / menu) ----
  gear(ctx, c) {
    const p = new Path2D();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const r = i % 2 === 0 ? 34 : 27;
      const a2 = a + Math.PI / 8;
      if (i === 0) p.moveTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r);
      p.lineTo(48 + Math.cos(a2 - 0.12) * r, 48 + Math.sin(a2 - 0.12) * r);
      const rn = i % 2 === 0 ? 27 : 34;
      p.lineTo(48 + Math.cos(a2) * rn, 48 + Math.sin(a2) * rn);
    }
    p.closePath();
    line(ctx, p, c, 4);
    line(ctx, ellipsePath(48, 48, 11, 11), c, 4);
  },
  roster(ctx, c) {
    // theatre mask
    const mask = new Path2D();
    mask.moveTo(16, 26);
    mask.quadraticCurveTo(48, 14, 80, 26);
    mask.quadraticCurveTo(82, 66, 48, 82);
    mask.quadraticCurveTo(14, 66, 16, 26);
    mask.closePath();
    line(ctx, mask, c);
    const eyes = new Path2D();
    eyes.moveTo(28, 42);
    eyes.quadraticCurveTo(35, 36, 42, 42);
    eyes.moveTo(54, 42);
    eyes.quadraticCurveTo(61, 36, 68, 42);
    eyes.moveTo(36, 62);
    eyes.quadraticCurveTo(48, 70, 60, 62);
    line(ctx, eyes, c, 3.5);
  },
  atlas(ctx, c) {
    // field guide with a moth
    line(ctx, roundRectPath(20, 14, 56, 68, 5), c);
    const sp = new Path2D();
    sp.moveTo(28, 14);
    sp.lineTo(28, 82);
    line(ctx, sp, c, 3);
    const m = new Path2D();
    m.moveTo(52, 36);
    m.quadraticCurveTo(38, 28, 38, 44);
    m.quadraticCurveTo(40, 52, 52, 48);
    m.quadraticCurveTo(64, 52, 66, 44);
    m.quadraticCurveTo(66, 28, 52, 36);
    m.moveTo(52, 36);
    m.lineTo(52, 60);
    line(ctx, m, c, 3);
  },
  trophy(ctx, c) {
    const cup = new Path2D();
    cup.moveTo(28, 18);
    cup.lineTo(68, 18);
    cup.quadraticCurveTo(68, 54, 48, 58);
    cup.quadraticCurveTo(28, 54, 28, 18);
    cup.moveTo(28, 26);
    cup.quadraticCurveTo(14, 26, 18, 38);
    cup.quadraticCurveTo(22, 46, 32, 46);
    cup.moveTo(68, 26);
    cup.quadraticCurveTo(82, 26, 78, 38);
    cup.quadraticCurveTo(74, 46, 64, 46);
    cup.moveTo(48, 58);
    cup.lineTo(48, 70);
    cup.moveTo(34, 78);
    cup.lineTo(62, 78);
    cup.lineTo(58, 70);
    cup.lineTo(38, 70);
    cup.closePath();
    line(ctx, cup, c);
    dot(ctx, 48, 34, 4, c);
  },
  notice(ctx, c) {
    // envelope with a wax seal
    line(ctx, roundRectPath(14, 24, 68, 48, 4), c);
    const f = new Path2D();
    f.moveTo(16, 27);
    f.lineTo(48, 52);
    f.lineTo(80, 27);
    line(ctx, f, c, 3.5);
    ctx.fillStyle = '#c0473a';
    ctx.beginPath();
    ctx.arc(48, 52, 7, 0, Math.PI * 2);
    ctx.fill();
  },
  menu(ctx, c) {
    const p = new Path2D();
    p.moveTo(22, 28);
    p.lineTo(74, 28);
    p.moveTo(22, 48);
    p.lineTo(74, 48);
    p.moveTo(22, 68);
    p.lineTo(58, 68);
    line(ctx, p, c, 5);
    dot(ctx, 72, 68, 4, c);
  },
  eye(ctx, c) {
    const p = new Path2D();
    p.moveTo(12, 48);
    p.quadraticCurveTo(48, 12, 84, 48);
    p.quadraticCurveTo(48, 84, 12, 48);
    p.closePath();
    line(ctx, p, c);
    line(ctx, ellipsePath(48, 48, 12, 12), c, 4);
    dot(ctx, 48, 48, 4, c);
    const lash = new Path2D();
    for (const a of [-2.2, -1.57, -0.94]) {
      lash.moveTo(48 + Math.cos(a) * 30, 46 + Math.sin(a) * 30);
      lash.lineTo(48 + Math.cos(a) * 38, 46 + Math.sin(a) * 38);
    }
    line(ctx, lash, c, 3);
  },
  shop(ctx, c) {
    // pawnbroker's three balls over a counter
    for (const [x, y] of [[30, 30], [66, 30], [48, 56]] as const) line(ctx, ellipsePath(x, y, 12, 12), c, 4);
    const p = new Path2D();
    p.moveTo(16, 80);
    p.lineTo(80, 80);
    p.moveTo(30, 18);
    p.lineTo(48, 8);
    p.lineTo(66, 18);
    line(ctx, p, c, 4);
  },
  profile(ctx, c) {
    line(ctx, ellipsePath(48, 34, 14, 14), c);
    const b = new Path2D();
    b.moveTo(20, 82);
    b.quadraticCurveTo(22, 56, 48, 56);
    b.quadraticCurveTo(74, 56, 76, 82);
    line(ctx, b, c);
  },
  gramophone(ctx, c) {
    const h = new Path2D();
    h.moveTo(44, 54);
    h.quadraticCurveTo(52, 34, 80, 14);
    h.moveTo(52, 60);
    h.quadraticCurveTo(70, 52, 86, 46);
    h.moveTo(80, 14);
    h.quadraticCurveTo(92, 30, 86, 46);
    line(ctx, h, c, 4);
    line(ctx, roundRectPath(14, 64, 62, 18, 3), c, 4);
    line(ctx, ellipsePath(45, 62, 26, 5), c, 3);
  },
  // statuses
  might(ctx, c) {
    stroke(ctx, polyPath([[48, 14], [74, 46], [58, 46], [58, 82], [38, 82], [38, 46], [22, 46]]), c, 6);
  },
  weak(ctx, c) {
    stroke(ctx, polyPath([[48, 82], [74, 50], [58, 50], [58, 14], [38, 14], [38, 50], [22, 50]]), c, 6);
  },
  frail(ctx, c) {
    const s = new Path2D();
    s.moveTo(48, 12);
    s.quadraticCurveTo(66, 20, 78, 20);
    s.quadraticCurveTo(80, 64, 48, 86);
    s.quadraticCurveTo(16, 64, 18, 20);
    s.quadraticCurveTo(30, 20, 48, 12);
    stroke(ctx, s, c, 6);
    const crack = new Path2D();
    crack.moveTo(50, 14);
    crack.lineTo(42, 40);
    crack.lineTo(56, 52);
    crack.lineTo(46, 82);
    stroke(ctx, crack, c, 4);
  },
  burn(ctx, c) {
    const f = new Path2D();
    f.moveTo(48, 10);
    f.bezierCurveTo(70, 36, 80, 56, 68, 74);
    f.bezierCurveTo(58, 90, 38, 90, 28, 74);
    f.bezierCurveTo(18, 56, 34, 44, 40, 28);
    f.bezierCurveTo(46, 40, 52, 40, 48, 10);
    fillOutlined(ctx, f, c);
  },
  daze(ctx, c) {
    const p = new Path2D();
    for (let t = 0; t < 1; t += 0.02) {
      const a = t * Math.PI * 4;
      const r = 4 + t * 32;
      const x = 48 + Math.cos(a) * r;
      const y = 48 + Math.sin(a) * r * 0.8;
      if (t === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    stroke(ctx, p, c, 5);
  },
  regen(ctx, c) {
    fillOutlined(ctx, polyPath([[40, 14], [56, 14], [56, 40], [82, 40], [82, 56], [56, 56], [56, 82], [40, 82], [40, 56], [14, 56], [14, 40], [40, 40]]), c);
  },
  // intents
  attack(ctx, c) {
    const blade = polyPath([[78, 12], [84, 18], [40, 64], [32, 56]]);
    fillOutlined(ctx, blade, '#e9e4dc');
    stroke(ctx, (() => { const p = new Path2D(); p.moveTo(24, 50); p.lineTo(46, 72); return p; })(), c, 7);
    stroke(ctx, (() => { const p = new Path2D(); p.moveTo(34, 62); p.lineTo(16, 80); return p; })(), c, 7);
  },
  mass(ctx, c) {
    for (const dx of [-16, 0, 16]) {
      const p = new Path2D();
      p.moveTo(30 + dx, 82);
      p.quadraticCurveTo(60 + dx, 50, 62 + dx, 14);
      stroke(ctx, p, c, 6);
    }
  },
  buff(ctx, c) {
    ICONS.might(ctx, c);
  },
  debuff(ctx, c) {
    ICONS.weak(ctx, c);
  },
  shield(ctx, c) {
    const s = new Path2D();
    s.moveTo(48, 10);
    s.quadraticCurveTo(66, 18, 80, 18);
    s.quadraticCurveTo(82, 64, 48, 88);
    s.quadraticCurveTo(14, 64, 16, 18);
    s.quadraticCurveTo(30, 18, 48, 10);
    fillOutlined(ctx, s, c);
  },
  heal(ctx, c) {
    ICONS.regen(ctx, c);
  },
  snuff(ctx, c) {
    for (const s of [-1, 1]) fillOutlined(ctx, ellipsePath(48 + s * 20, 46, 20, 15, s * 0.5), c, 3.5);
    fillOutlined(ctx, ellipsePath(48, 50, 7, 24), '#2a2230', 3);
    ctx.strokeStyle = '#e0584c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(18, 84);
    ctx.lineTo(80, 14);
    ctx.stroke();
  },
  // ui
  pause(ctx, c) {
    fillOutlined(ctx, roundRectPath(26, 20, 14, 56, 4), c);
    fillOutlined(ctx, roundRectPath(56, 20, 14, 56, 4), c);
  },
  speed(ctx, c) {
    fillOutlined(ctx, polyPath([[18, 20], [48, 48], [18, 76]]), c);
    fillOutlined(ctx, polyPath([[48, 20], [78, 48], [48, 76]]), c);
  },
  auto(ctx, c) {
    const p = new Path2D();
    p.arc(48, 48, 28, Math.PI * 0.15, Math.PI * 1.75);
    stroke(ctx, p, c, 7);
    fillOutlined(ctx, polyPath([[66, 10], [82, 32], [58, 34]]), c, 3);
  },
  intel(ctx, c) {
    stroke(ctx, ellipsePath(42, 42, 22, 22), c, 7);
    const h = new Path2D();
    h.moveTo(58, 58);
    h.lineTo(80, 80);
    stroke(ctx, h, c, 9);
  },
  back(ctx, c) {
    const p = new Path2D();
    p.moveTo(56, 18);
    p.lineTo(26, 48);
    p.lineTo(56, 78);
    stroke(ctx, p, c, 8);
  },
  close(ctx, c) {
    const p = new Path2D();
    p.moveTo(24, 24);
    p.lineTo(72, 72);
    p.moveTo(72, 24);
    p.lineTo(24, 72);
    stroke(ctx, p, c, 7);
  },
  story(ctx, c) {
    const l = new Path2D();
    l.moveTo(48, 26);
    l.quadraticCurveTo(30, 16, 12, 22);
    l.lineTo(12, 74);
    l.quadraticCurveTo(30, 68, 48, 78);
    l.quadraticCurveTo(66, 68, 84, 74);
    l.lineTo(84, 22);
    l.quadraticCurveTo(66, 16, 48, 26);
    l.closePath();
    fillOutlined(ctx, l, c);
    const sp = new Path2D();
    sp.moveTo(48, 26);
    sp.lineTo(48, 76);
    stroke(ctx, sp, '#2a2420', 3);
  },
  summon(ctx, c) {
    glow(ctx, 48, 54, 40, '#dcef72', 0.6);
    const h = new Path2D();
    h.arc(48, 22, 10, Math.PI, 0);
    stroke(ctx, h, c, 5);
    fillOutlined(ctx, roundRectPath(28, 28, 40, 54, 10), rgba('#fff2c0', 0.95));
    fillOutlined(ctx, roundRectPath(24, 24, 48, 10, 3), c, 3);
    fillOutlined(ctx, roundRectPath(24, 78, 48, 10, 3), c, 3);
    ctx.fillStyle = '#c9e05a';
    ctx.beginPath();
    ctx.arc(48, 55, 7, 0, Math.PI * 2);
    ctx.fill();
  },
  undo(ctx, c) {
    const p = new Path2D();
    p.arc(52, 54, 24, Math.PI * 1.1, Math.PI * 0.5, false);
    stroke(ctx, p, c, 7);
    fillOutlined(ctx, polyPath([[12, 40], [36, 26], [38, 52]]), c, 3);
  },
  sound(ctx, c) {
    fillOutlined(ctx, polyPath([[14, 38], [32, 38], [54, 18], [54, 78], [32, 58], [14, 58]]), c);
    const w = new Path2D();
    w.arc(56, 48, 18, -0.7, 0.7);
    w.moveTo(56 + 30 * Math.cos(-0.7), 48 + 30 * Math.sin(-0.7));
    w.arc(56, 48, 30, -0.7, 0.7);
    stroke(ctx, w, c, 5);
  },
  music(ctx, c) {
    fillOutlined(ctx, ellipsePath(30, 70, 14, 10, -0.4), c);
    fillOutlined(ctx, ellipsePath(70, 62, 14, 10, -0.4), c);
    fillOutlined(ctx, polyPath([[40, 68], [44, 68], [44, 22], [84, 14], [84, 60], [80, 60], [80, 26], [44, 34], [44, 68]]), c, 3);
  },
  check(ctx, c) {
    const p = new Path2D();
    p.moveTo(18, 50);
    p.lineTo(40, 72);
    p.lineTo(80, 24);
    stroke(ctx, p, c, 9);
  },
  lock(ctx, c) {
    const s = new Path2D();
    s.arc(48, 40, 16, Math.PI, 0);
    stroke(ctx, s, c, 7);
    fillOutlined(ctx, roundRectPath(24, 40, 48, 40, 8), c);
  },
  star4(ctx, c) {
    fillOutlined(ctx, star4(ctx, 48, 48, 40, 0.3), c, 3.5);
  },
  glimmer(ctx, c) {
    glow(ctx, 48, 48, 46, '#dcef72', 0.55);
    const gem = polyPath([[48, 10], [80, 40], [48, 86], [16, 40]]);
    fillOutlined(ctx, gem, c, 4);
    const facet = new Path2D();
    facet.moveTo(16, 40);
    facet.lineTo(80, 40);
    facet.moveTo(48, 10);
    facet.lineTo(36, 40);
    facet.lineTo(48, 86);
    facet.moveTo(48, 10);
    facet.lineTo(60, 40);
    facet.lineTo(48, 86);
    ctx.strokeStyle = rgba('#1b1518', 0.5);
    ctx.lineWidth = 2;
    ctx.stroke(facet);
  },
  firefly(ctx) {
    glow(ctx, 48, 52, 46, '#dcef72', 0.9);
    ctx.fillStyle = '#f7ffd0';
    ctx.beginPath();
    ctx.arc(48, 56, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.beginPath();
    ctx.ellipse(38, 40, 10, 6, -0.6, 0, Math.PI * 2);
    ctx.ellipse(58, 40, 10, 6, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2430';
    ctx.beginPath();
    ctx.ellipse(48, 44, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  move(ctx, c) {
    const p = new Path2D();
    p.moveTo(14, 48);
    p.lineTo(82, 48);
    stroke(ctx, p, c, 6);
    fillOutlined(ctx, polyPath([[10, 48], [30, 32], [30, 64]]), c, 3);
    fillOutlined(ctx, polyPath([[86, 48], [66, 32], [66, 64]]), c, 3);
  },
  plus(ctx, c) {
    const p = new Path2D();
    p.moveTo(48, 20);
    p.lineTo(48, 76);
    p.moveTo(20, 48);
    p.lineTo(76, 48);
    stroke(ctx, p, c, 10);
  },
  calendar(ctx, c) {
    fillOutlined(ctx, roundRectPath(14, 20, 68, 62, 8), c);
    fillOutlined(ctx, roundRectPath(14, 20, 68, 18, 6), '#c0473a', 3);
    const r = new Path2D();
    r.moveTo(32, 12);
    r.lineTo(32, 28);
    r.moveTo(64, 12);
    r.lineTo(64, 28);
    stroke(ctx, r, c, 5);
    ctx.fillStyle = '#2a2420';
    for (let i = 0; i < 6; i++) ctx.fillRect(24 + (i % 3) * 18, 48 + Math.floor(i / 3) * 16, 10, 8);
  },
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconCanvas(name: string, color = CREAM): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(ICON_SIZE, ICON_SIZE);
  (ICONS[name] ?? ICONS.star4)(ctx, color);
  return canvas;
}
