import { type Ctx, glow, grain, makeCanvas, mix, rgba, seeded, shade } from './paint';

// Painted-style backgrounds, authored in 1920×1080 game space and rendered at BG_SCALE.
export const BG_SCALE = 1600 / 1920;
export type BgId = 'street' | 'theatre' | 'parlour' | 'lake' | 'map' | 'docks' | 'clocktower' | 'loading';

const W = 1920;
const H = 1080;

function vgrad(ctx: Ctx, y0: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [t, c] of stops) g.addColorStop(t, c);
  return g;
}

function fogBand(ctx: Ctx, y: number, h: number, color: string, alpha: number): void {
  ctx.fillStyle = vgrad(ctx, y - h, y + h, [[0, rgba(color, 0)], [0.5, rgba(color, alpha)], [1, rgba(color, 0)]]);
  ctx.fillRect(0, y - h, W, h * 2);
}

function lightShaft(ctx: Ctx, x0: number, w0: number, x1: number, w1: number, y1: number, color: string, alpha: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, y1);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, 0);
  ctx.lineTo(x0 + w0, 0);
  ctx.lineTo(x1 + w1, y1);
  ctx.lineTo(x1, y1);
  ctx.fill();
}

// ---------------------------------------------------------------------------- street

function street(ctx: Ctx): void {
  const rnd = seeded(11);
  const VY = 560;
  ctx.fillStyle = vgrad(ctx, 0, VY + 40, [[0, '#0b151c'], [0.55, '#1b2c31'], [1, '#3d4d47']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1500, 140, 260, '#cfe0dc', 0.18);
  ctx.fillStyle = '#e8efe8';
  ctx.beginPath();
  ctx.arc(1500, 140, 34, 0, Math.PI * 2);
  ctx.fill();
  // Far skyline + clock tower
  ctx.fillStyle = '#1b282c';
  ctx.beginPath();
  ctx.moveTo(0, VY);
  let x = 0;
  while (x < W) {
    const bw = 60 + rnd() * 110;
    const bh = 90 + rnd() * 150;
    ctx.lineTo(x, VY - bh);
    if (rnd() > 0.6) {
      ctx.lineTo(x + bw * 0.3, VY - bh);
      ctx.lineTo(x + bw * 0.3, VY - bh - 30);
      ctx.lineTo(x + bw * 0.42, VY - bh - 30);
      ctx.lineTo(x + bw * 0.42, VY - bh);
    }
    ctx.lineTo(x + bw, VY - bh);
    x += bw;
  }
  ctx.lineTo(W, VY);
  ctx.fill();
  ctx.fillStyle = '#16232a';
  ctx.fillRect(820, 180, 110, VY - 180);
  ctx.beginPath();
  ctx.moveTo(810, 186);
  ctx.lineTo(875, 90);
  ctx.lineTo(940, 186);
  ctx.fill();
  glow(ctx, 875, 250, 70, '#f5d79a', 0.35);
  ctx.fillStyle = '#e9d6a4';
  ctx.beginPath();
  ctx.arc(875, 250, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a3226';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(875, 250);
  ctx.lineTo(875, 228);
  ctx.moveTo(875, 250);
  ctx.lineTo(892, 258);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const wx = rnd() * W;
    const wy = VY - 40 - rnd() * 160;
    if (rnd() > 0.55) {
      ctx.fillStyle = rgba('#f2c46e', 0.55 + rnd() * 0.3);
      ctx.fillRect(wx, wy, 6, 9);
    }
  }
  fogBand(ctx, VY - 10, 90, '#9fb7b0', 0.35);

  // Near facades in perspective (left and right)
  const facade = (side: number) => {
    const xEdge = side < 0 ? 0 : W;
    const xIn = side < 0 ? 470 : W - 470;
    ctx.fillStyle = vgrad(ctx, 0, 760, [[0, '#121c20'], [1, '#26353a']]);
    ctx.beginPath();
    ctx.moveTo(xEdge, 0);
    ctx.lineTo(xIn, 120);
    ctx.lineTo(xIn, 640);
    ctx.lineTo(xEdge, 780);
    ctx.fill();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const t0 = col / 3 + 0.06;
        const t1 = t0 + 0.2;
        const px = (t: number) => xEdge + (xIn - xEdge) * t;
        const topAt = (t: number) => 120 * t + row * (150 - 30 * t) + 70;
        const hh = (t: number) => 90 - 34 * t;
        const lit = rnd() > 0.62;
        ctx.fillStyle = lit ? rgba('#e8a858', 0.6) : '#0d1518';
        ctx.beginPath();
        ctx.moveTo(px(t0), topAt(t0));
        ctx.lineTo(px(t1), topAt(t1));
        ctx.lineTo(px(t1), topAt(t1) + hh(t1));
        ctx.lineTo(px(t0), topAt(t0) + hh(t0));
        ctx.fill();
        ctx.strokeStyle = '#0a1012';
        ctx.lineWidth = 4;
        ctx.stroke();
        if (lit) glow(ctx, (px(t0) + px(t1)) / 2, topAt(t0) + 40, 90, '#f2b860', 0.14);
      }
    }
  };
  facade(-1);
  facade(1);

  // Cobbles
  ctx.fillStyle = vgrad(ctx, VY, H, [[0, '#2b3634'], [1, '#141a1b']]);
  ctx.beginPath();
  ctx.moveTo(0, 780);
  ctx.lineTo(470, 640);
  ctx.lineTo(W - 470, 640);
  ctx.lineTo(W, 780);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.fillStyle = '#323f3d';
  ctx.fillRect(470, VY, W - 940, 80);
  let y = 600;
  let rowH = 6;
  while (y < H) {
    const t = (y - 600) / (H - 600);
    const half = 490 + t * 1100;
    const stoneW = 24 + t * 80;
    let sx = 960 - half + ((y * 7) % stoneW);
    ctx.fillStyle = '#161d1e';
    ctx.fillRect(960 - half, y, half * 2, rowH);
    while (sx < 960 + half) {
      const sw = stoneW * (0.7 + rnd() * 0.5);
      ctx.fillStyle = mix('#232d2d', '#2f3a39', rnd());
      ctx.beginPath();
      ctx.roundRect(sx + 1.5, y + 1, sw - 3, rowH - 2, Math.min(6, rowH / 3));
      ctx.fill();
      ctx.fillStyle = rgba('#8fa8a2', 0.05);
      ctx.fillRect(sx + 3, y + 2, sw - 8, Math.max(1, rowH * 0.18));
      sx += sw;
    }
    y += rowH;
    rowH = 6 + t * 30;
  }
  // Lamps
  const lamp = (lx: number, base: number, hgt: number) => {
    ctx.fillStyle = '#0c1214';
    ctx.fillRect(lx - 7, base - hgt, 14, hgt);
    ctx.fillRect(lx - 18, base - 14, 36, 14);
    glow(ctx, lx, base - hgt - 22, 260, '#ffcf7a', 0.35);
    glow(ctx, lx, base - hgt - 22, 70, '#fff0c0', 0.9);
    ctx.fillStyle = '#0c1214';
    ctx.beginPath();
    ctx.moveTo(lx - 26, base - hgt - 46);
    ctx.lineTo(lx + 26, base - hgt - 46);
    ctx.lineTo(lx + 16, base - hgt - 60);
    ctx.lineTo(lx - 16, base - hgt - 60);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(lx, base + 30);
    ctx.scale(1, 0.28);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    pool.addColorStop(0, rgba('#ffcf7a', 0.26));
    pool.addColorStop(1, rgba('#ffcf7a', 0));
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(0, 0, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  lamp(250, 800, 420);
  lamp(1700, 800, 420);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  lightShaft(ctx, 1240, 160, 1040, 420, 900, '#b8d8d0', 0.08);
  ctx.restore();
  fogBand(ctx, 700, 120, '#8fa8a2', 0.12);
  ctx.fillStyle = vgrad(ctx, 860, H, [[0, rgba('#05080a', 0)], [1, rgba('#05080a', 0.55)]]);
  ctx.fillRect(0, 860, W, H - 860);
}

// ---------------------------------------------------------------------------- theatre

function theatre(ctx: Ctx): void {
  const rnd = seeded(5);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#0d0a10'], [0.6, '#1a1218'], [1, '#0d0a0c']]);
  ctx.fillRect(0, 0, W, H);
  // Painted night backdrop
  ctx.fillStyle = vgrad(ctx, 120, 640, [[0, '#141a2c'], [1, '#2a2436']]);
  ctx.fillRect(300, 120, 1320, 520);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rgba('#e8e0ff', 0.2 + rnd() * 0.5);
    ctx.beginPath();
    ctx.arc(300 + rnd() * 1320, 120 + rnd() * 380, 1 + rnd() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#18141e';
  ctx.beginPath();
  ctx.moveTo(300, 640);
  for (let x = 300; x <= 1620; x += 40) ctx.lineTo(x, 560 - Math.sin(x / 140) * 40 - rnd() * 20);
  ctx.lineTo(1620, 640);
  ctx.fill();
  glow(ctx, 1240, 260, 60, '#f3e6c0', 0.5);
  // Stage floor boards
  ctx.fillStyle = vgrad(ctx, 640, H, [[0, '#3c2a1e'], [1, '#1c120c']]);
  ctx.fillRect(0, 640, W, H - 640);
  ctx.strokeStyle = rgba('#120a06', 0.7);
  ctx.lineWidth = 2;
  for (let i = -24; i <= 24; i++) {
    ctx.beginPath();
    ctx.moveTo(960 + i * 40, 640);
    ctx.lineTo(960 + i * 150, H);
    ctx.stroke();
  }
  for (let y = 660, step = 14; y < H; y += step, step *= 1.18) {
    ctx.strokeStyle = rgba('#120a06', 0.35);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Curtains
  const drape = (x0: number, x1: number, sway: number) => {
    const folds = 9;
    for (let i = 0; i < folds; i++) {
      const a = x0 + ((x1 - x0) * i) / folds;
      const b = x0 + ((x1 - x0) * (i + 1)) / folds;
      const g = ctx.createLinearGradient(a, 0, b, 0);
      g.addColorStop(0, '#3e0910');
      g.addColorStop(0.45, '#8c1b26');
      g.addColorStop(1, '#4a0b13');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(a, 0);
      ctx.lineTo(b, 0);
      ctx.lineTo(b + sway * (i + 1), 760);
      ctx.lineTo(a + sway * i, 760);
      ctx.fill();
    }
  };
  drape(0, 330, -6);
  drape(1590, 1920, 6);
  // Valance with scallops
  ctx.fillStyle = vgrad(ctx, 0, 150, [[0, '#4a0b13'], [1, '#86202a']]);
  ctx.fillRect(0, 0, W, 110);
  for (let x = 0; x < W; x += 120) {
    ctx.beginPath();
    ctx.arc(x + 60, 110, 60, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#d8b45a';
  for (let x = 0; x < W; x += 120) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 11) * Math.PI;
      ctx.fillRect(x + 60 + Math.cos(a) * 60 - 2, 110 + Math.sin(a) * 60, 4, 16);
    }
  }
  // Footlights
  for (let x = 120; x < W; x += 110) {
    glow(ctx, x, 1060, 120, '#ffcf7a', 0.32);
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.ellipse(x, 1068, 26, 12, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  lightShaft(ctx, 1380, 80, 1060, 520, 940, '#ffe8b8', 0.09);
  lightShaft(ctx, 460, 80, 360, 520, 940, '#d8c8ff', 0.06);
  ctx.restore();
  fogBand(ctx, 650, 80, '#c8a888', 0.1);
}

// ---------------------------------------------------------------------------- parlour

function parlour(ctx: Ctx): void {
  const rnd = seeded(23);
  ctx.fillStyle = vgrad(ctx, 0, 820, [[0, '#121a19'], [1, '#22302c']]);
  ctx.fillRect(0, 0, W, H);
  // Damask hint
  ctx.fillStyle = rgba('#3a4a42', 0.35);
  for (let y = 40; y < 760; y += 90) {
    for (let x = (y / 90) % 2 ? 0 : 60; x < W; x += 120) {
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 14, y + 10, 6, 10, -0.6, 0, Math.PI * 2);
      ctx.ellipse(x + 14, y + 10, 6, 10, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Windows
  const windowAt = (wx: number) => {
    const ww = 300;
    const top = 110;
    const bot = 700;
    const sky = vgrad(ctx, top, bot, [[0, '#2a2a46'], [0.45, '#7a4a62'], [0.75, '#e08a62'], [1, '#f2c27a']]);
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.moveTo(wx, bot);
    ctx.lineTo(wx, top + ww / 2);
    ctx.arc(wx + ww / 2, top + ww / 2, ww / 2, Math.PI, 0);
    ctx.lineTo(wx + ww, bot);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#2a1e2a';
    let x = wx - 10;
    while (x < wx + ww + 10) {
      const bw = 20 + rnd() * 40;
      const bh = 60 + rnd() * 140;
      ctx.fillRect(x, bot - bh, bw, bh);
      for (let k = 0; k < 4; k++) if (rnd() > 0.5) {
        ctx.fillStyle = rgba('#ffd27a', 0.8);
        ctx.fillRect(x + 4 + rnd() * (bw - 10), bot - bh + 10 + rnd() * (bh - 20), 4, 6);
        ctx.fillStyle = '#2a1e2a';
      }
      x += bw;
    }
    glow(ctx, wx + ww * 0.7, 560, 140, '#ffd8a0', 0.5);
    ctx.restore();
    ctx.strokeStyle = '#1a120e';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(wx, bot);
    ctx.lineTo(wx, top + ww / 2);
    ctx.arc(wx + ww / 2, top + ww / 2, ww / 2, Math.PI, 0);
    ctx.lineTo(wx + ww, bot);
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, top);
    ctx.lineTo(wx + ww / 2, bot);
    for (const yy of [300, 450, 590]) {
      ctx.moveTo(wx, yy);
      ctx.lineTo(wx + ww, yy);
    }
    ctx.stroke();
    // Drapes
    for (const [dx, dir] of [[wx - 70, 1], [wx + ww - 10, -1]] as [number, number][]) {
      const g = ctx.createLinearGradient(dx, 0, dx + 80, 0);
      g.addColorStop(0, '#3a1218');
      g.addColorStop(0.5, '#6a2228');
      g.addColorStop(1, '#3a1218');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(dx, 70);
      ctx.lineTo(dx + 80, 70);
      ctx.quadraticCurveTo(dx + 40 + dir * 30, 450, dx + 80 + dir * 10, 800);
      ctx.lineTo(dx + dir * 10, 800);
      ctx.quadraticCurveTo(dx + 40 - dir * 20, 450, dx, 70);
      ctx.fill();
    }
  };
  windowAt(1020);
  windowAt(1450);
  // Wainscot
  ctx.fillStyle = vgrad(ctx, 700, 820, [[0, '#2a1d16'], [1, '#1a110c']]);
  ctx.fillRect(0, 700, W, 120);
  ctx.strokeStyle = rgba('#5a4030', 0.6);
  ctx.lineWidth = 3;
  for (let x = 20; x < W; x += 180) ctx.strokeRect(x, 716, 150, 86);
  // Floor + rug
  ctx.fillStyle = vgrad(ctx, 820, H, [[0, '#2a1a12'], [1, '#120a06']]);
  ctx.fillRect(0, 820, W, H - 820);
  ctx.fillStyle = '#4a1820';
  ctx.beginPath();
  ctx.moveTo(380, 860);
  ctx.lineTo(1540, 860);
  ctx.lineTo(1800, H);
  ctx.lineTo(120, H);
  ctx.fill();
  ctx.strokeStyle = '#b08a3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(420, 880);
  ctx.lineTo(1500, 880);
  ctx.lineTo(1730, H);
  ctx.moveTo(420, 880);
  ctx.lineTo(190, H);
  ctx.stroke();
  // Sunset shafts on the floor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const sx of [1020, 1450]) {
    ctx.fillStyle = rgba('#ffb878', 0.07);
    ctx.beginPath();
    ctx.moveTo(sx, 300);
    ctx.lineTo(sx + 300, 300);
    ctx.lineTo(sx - 120, H);
    ctx.lineTo(sx - 560, H);
    ctx.fill();
  }
  ctx.restore();
  // Desk + gramophone (left) and fern (right)
  ctx.fillStyle = '#140d09';
  ctx.fillRect(80, 640, 420, 26);
  ctx.fillRect(100, 666, 20, 200);
  ctx.fillRect(460, 666, 20, 200);
  ctx.fillRect(120, 666, 340, 90);
  ctx.fillStyle = '#1c130e';
  ctx.fillRect(200, 584, 120, 56);
  ctx.beginPath();
  ctx.moveTo(260, 590);
  ctx.quadraticCurveTo(300, 520, 300, 430);
  ctx.lineTo(420, 400);
  ctx.quadraticCurveTo(360, 480, 280, 590);
  ctx.fill();
  ctx.fillStyle = '#2a1d12';
  ctx.beginPath();
  ctx.ellipse(360, 414, 64, 26, -0.3, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, 470, 560, 180, '#ffcf80', 0.35);
  ctx.fillStyle = '#e8b86a';
  ctx.beginPath();
  ctx.moveTo(430, 520);
  ctx.lineTo(510, 520);
  ctx.lineTo(490, 470);
  ctx.lineTo(450, 470);
  ctx.fill();
  ctx.fillStyle = '#140d09';
  ctx.fillRect(466, 520, 8, 120);
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * 0.95 + (i / 15) * Math.PI * 0.9;
    ctx.strokeStyle = shade('#2f4a2a', rnd() * 0.3);
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(1830, 760);
    ctx.quadraticCurveTo(1830 + Math.cos(a) * 80, 760 + Math.sin(a) * 160, 1830 + Math.cos(a) * 170, 760 + Math.sin(a) * 120);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(1780, 760, 100, 90);
}

// ---------------------------------------------------------------------------- lake

function lake(ctx: Ctx): void {
  const rnd = seeded(31);
  const HZ = 560;
  ctx.fillStyle = vgrad(ctx, 0, HZ, [[0, '#060a16'], [0.6, '#152034'], [1, '#2c3a48']]);
  ctx.fillRect(0, 0, W, HZ);
  for (let i = 0; i < 260; i++) {
    const y = rnd() * HZ * 0.85;
    ctx.fillStyle = rgba('#f0f0ff', 0.15 + rnd() * 0.7 * (1 - y / HZ));
    ctx.beginPath();
    ctx.arc(rnd() * W, y, 0.6 + rnd() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  glow(ctx, 1480, 150, 260, '#dce8ff', 0.22);
  ctx.fillStyle = '#eef2ff';
  ctx.beginPath();
  ctx.arc(1480, 150, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#152034';
  ctx.beginPath();
  ctx.arc(1504, 136, 50, 0, Math.PI * 2);
  ctx.fill();
  // Far shore + lighthouse
  ctx.fillStyle = '#0e1622';
  ctx.beginPath();
  ctx.moveTo(0, HZ);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, HZ - 40 - Math.sin(x / 260) * 30 - rnd() * 8);
  ctx.lineTo(W, HZ);
  ctx.fill();
  ctx.fillStyle = '#0c121c';
  ctx.beginPath();
  ctx.moveTo(400, HZ - 60);
  ctx.lineTo(418, HZ - 210);
  ctx.lineTo(438, HZ - 210);
  ctx.lineTo(456, HZ - 60);
  ctx.fill();
  glow(ctx, 428, HZ - 222, 60, '#ffe2a0', 0.6);
  // Water
  ctx.fillStyle = vgrad(ctx, HZ, H, [[0, '#1d2c3a'], [0.4, '#0f1a26'], [1, '#060a10']]);
  ctx.fillRect(0, HZ, W, H - HZ);
  for (let i = 0; i < 220; i++) {
    const y = HZ + Math.pow(rnd(), 1.6) * (H - HZ);
    const len = 20 + rnd() * 120 * (y / H);
    ctx.fillStyle = rgba('#9fb6d0', 0.04 + rnd() * 0.08);
    ctx.fillRect(rnd() * W, y, len, 2);
  }
  for (let y = HZ + 6; y < H; y += 8 + (y - HZ) * 0.04) {
    const wob = (rnd() - 0.5) * 60;
    const wdt = 40 + (y - HZ) * 0.25;
    ctx.fillStyle = rgba('#e6eeff', 0.35 * (1 - (y - HZ) / (H - HZ)));
    ctx.fillRect(1480 - wdt / 2 + wob, y, wdt * (0.4 + rnd() * 0.6), 3);
  }
  fogBand(ctx, HZ, 70, '#9fb0c0', 0.3);
  // Pier
  ctx.fillStyle = '#1a140f';
  ctx.beginPath();
  ctx.moveTo(-40, H);
  ctx.lineTo(820, 720);
  ctx.lineTo(1000, 720);
  ctx.lineTo(560, H);
  ctx.fill();
  ctx.strokeStyle = rgba('#3a2c20', 0.9);
  ctx.lineWidth = 3;
  for (let t = 0; t < 1; t += 0.06) {
    const y = 720 + (H - 720) * t * t;
    const xl = 820 + (-40 - 820) * t * t;
    const xr = 1000 + (560 - 1000) * t * t;
    ctx.beginPath();
    ctx.moveTo(xl, y);
    ctx.lineTo(xr, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#120d09';
  for (const [px, py, ph] of [[830, 720, 70], [990, 720, 70], [460, 860, 160], [740, 860, 160]] as [number, number, number][]) {
    ctx.fillRect(px - 6, py - ph * 0.4, 12, ph);
  }
  // Reeds
  for (let i = 0; i < 70; i++) {
    const rx = rnd() < 0.5 ? rnd() * 380 : W - rnd() * 420;
    const rh = 80 + rnd() * 180;
    ctx.strokeStyle = '#0a0f0c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx, H);
    ctx.quadraticCurveTo(rx + (rnd() - 0.5) * 40, H - rh / 2, rx + (rnd() - 0.5) * 60, H - rh);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------- map

function map(ctx: Ctx): void {
  const rnd = seeded(41);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#1d1814'], [1, '#100d0b']]);
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = rgba('#5a4a36', 0.35);
  ctx.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    let x = rnd() * W;
    let y = rnd() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rnd() - 0.5) * 300;
      y += (rnd() - 0.5) * 200;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = rgba('#3a5250', 0.5);
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(-50, 300);
  ctx.bezierCurveTo(500, 200, 900, 700, 1400, 520);
  ctx.bezierCurveTo(1650, 430, 1800, 520, 1980, 460);
  ctx.stroke();
  ctx.strokeStyle = rgba('#b08a3a', 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1700, 180, 90, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(1700, 180);
    ctx.lineTo(1700 + Math.cos(a) * (i % 2 ? 60 : 120), 180 + Math.sin(a) * (i % 2 ? 60 : 120));
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------- docks

function docks(ctx: Ctx): void {
  const rnd = seeded(51);
  const HZ = 600;
  ctx.fillStyle = vgrad(ctx, 0, HZ, [[0, '#0a1418'], [0.6, '#1c2e32'], [1, '#3a4c48']]);
  ctx.fillRect(0, 0, W, HZ);
  // Distant lighthouse with a dark beam
  ctx.fillStyle = '#121c20';
  ctx.beginPath();
  ctx.moveTo(1460, HZ - 20);
  ctx.lineTo(1488, HZ - 330);
  ctx.lineTo(1532, HZ - 330);
  ctx.lineTo(1560, HZ - 20);
  ctx.fill();
  ctx.fillRect(1476, HZ - 360, 68, 36);
  glow(ctx, 1510, HZ - 342, 60, '#9fd8f0', 0.35);
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#05080a';
  ctx.beginPath();
  ctx.moveTo(1510, HZ - 342);
  ctx.lineTo(600, HZ - 520);
  ctx.lineTo(600, HZ - 300);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Cranes
  ctx.strokeStyle = '#141e22';
  ctx.lineWidth = 14;
  for (const [x, h] of [[300, 420], [760, 360], [1180, 300]] as [number, number][]) {
    ctx.beginPath();
    ctx.moveTo(x, HZ);
    ctx.lineTo(x, HZ - h);
    ctx.lineTo(x + 260, HZ - h + 20);
    ctx.moveTo(x, HZ - h);
    ctx.lineTo(x - 80, HZ - h + 40);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 230, HZ - h + 18);
    ctx.lineTo(x + 230, HZ - h + 160);
    ctx.stroke();
    ctx.lineWidth = 14;
  }
  fogBand(ctx, HZ - 20, 110, '#9fb8b4', 0.38);
  // Water
  ctx.fillStyle = vgrad(ctx, HZ, 760, [[0, '#24363a'], [1, '#101a1e']]);
  ctx.fillRect(0, HZ, W, 160);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = rgba('#9fc0c4', 0.05 + rnd() * 0.08);
    ctx.fillRect(rnd() * W, HZ + rnd() * 150, 30 + rnd() * 90, 2);
  }
  // Pier planks
  ctx.fillStyle = vgrad(ctx, 700, H, [[0, '#3a2e24'], [1, '#18120e']]);
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.lineTo(W, 720);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  for (let y = 730, step = 14; y < H; y += step, step *= 1.16) {
    ctx.strokeStyle = rgba('#0c0806', 0.7);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let i = -20; i <= 20; i++) {
    ctx.strokeStyle = rgba('#0c0806', 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(960 + i * 60, 720);
    ctx.lineTo(960 + i * 160, H);
    ctx.stroke();
  }
  // Bollards, crates, rope
  for (const x of [160, 1780]) {
    ctx.fillStyle = '#121012';
    ctx.fillRect(x - 24, 700, 48, 70);
    ctx.beginPath();
    ctx.ellipse(x, 700, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(1600, 620, 150, 110);
  ctx.fillRect(1640, 540, 110, 82);
  ctx.strokeStyle = '#160f0a';
  ctx.lineWidth = 4;
  ctx.strokeRect(1600, 620, 150, 110);
  ctx.strokeRect(1640, 540, 110, 82);
  // Hanging harbour lamp
  glow(ctx, 520, 470, 200, '#ffcf7a', 0.3);
  glow(ctx, 520, 470, 40, '#fff0c0', 0.9);
  ctx.fillStyle = '#0c1012';
  ctx.fillRect(514, 300, 12, 150);
  fogBand(ctx, 760, 120, '#8fa8a8', 0.14);
  ctx.fillStyle = vgrad(ctx, 880, H, [[0, rgba('#05080a', 0)], [1, rgba('#05080a', 0.55)]]);
  ctx.fillRect(0, 880, W, H - 880);
}

// ---------------------------------------------------------------------------- clock tower

function gear(ctx: Ctx, x: number, y: number, r: number, teeth: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth;
    const rr = i % 2 === 0 ? r : r * 0.86;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillRect(-r * 0.05, 0, r * 0.1, r * 0.6);
    ctx.restore();
  }
}

function clocktower(ctx: Ctx): void {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#120e18'], [0.6, '#221a26'], [1, '#0e0a10']]);
  ctx.fillRect(0, 0, W, H);
  // Giant clock face window (backlit)
  glow(ctx, 960, 330, 520, '#f0d890', 0.18);
  ctx.fillStyle = rgba('#e8dcb8', 0.16);
  ctx.beginPath();
  ctx.arc(960, 330, 360, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#d8c08a', 0.5);
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(960 + Math.cos(a) * 300, 330 + Math.sin(a) * 300);
    ctx.lineTo(960 + Math.cos(a) * 350, 330 + Math.sin(a) * 350);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba('#d8c08a', 0.18);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(960, 330);
    ctx.lineTo(960 + Math.cos(a) * 360, 330 + Math.sin(a) * 360);
    ctx.stroke();
  }
  // Gears silhouettes
  gear(ctx, 200, 220, 230, 18, '#1c1620');
  gear(ctx, 1760, 300, 260, 20, '#1c1620');
  gear(ctx, 1500, 70, 120, 12, '#2a2030');
  gear(ctx, 420, 520, 110, 12, '#2a2030');
  gear(ctx, 1420, 560, 90, 10, '#2a2030');
  ctx.strokeStyle = '#120e14';
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(0, 640);
  ctx.lineTo(W, 640);
  ctx.stroke();
  // Floor: wooden platform with brass edge
  ctx.fillStyle = vgrad(ctx, 650, H, [[0, '#3a2a20'], [1, '#160e0a']]);
  ctx.fillRect(0, 650, W, H - 650);
  for (let i = -20; i <= 20; i++) {
    ctx.strokeStyle = rgba('#0c0806', 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(960 + i * 50, 650);
    ctx.lineTo(960 + i * 150, H);
    ctx.stroke();
  }
  ctx.fillStyle = '#b08a3a';
  ctx.fillRect(0, 646, W, 8);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  lightShaft(ctx, 900, 140, 760, 480, 980, '#f0d890', 0.07);
  ctx.restore();
  ctx.fillStyle = vgrad(ctx, 860, H, [[0, rgba('#05030a', 0)], [1, rgba('#05030a', 0.55)]]);
  ctx.fillRect(0, 860, W, H - 860);
}

const PAINTERS: Record<BgId, (ctx: Ctx) => void> = { street, theatre, parlour, lake, map, docks, clocktower, loading: lake };

export function backgroundCanvas(id: BgId): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(W * BG_SCALE, H * BG_SCALE);
  ctx.save();
  ctx.scale(BG_SCALE, BG_SCALE);
  PAINTERS[id](ctx);
  ctx.restore();
  grain(ctx, canvas.width, canvas.height, 0.045, id.length * 97);
  return canvas;
}
