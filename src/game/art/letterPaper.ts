import { grain, makeCanvas, rgba, seeded } from './paint';

// Aged letter paper for story letters: laid paper, foxing, a tri-fold crease, tea-stained and
// singed edges, a ring stain, and a pressed wax seal with a thirteen-hour clock.

export const LETTER_W = 1040;
export const LETTER_H = 620;

export function letterPaperCanvas(seed = 1929): HTMLCanvasElement {
  const pad = 30;
  const { canvas, ctx } = makeCanvas(LETTER_W + pad * 2, LETTER_H + pad * 2);
  const rnd = seeded(seed);
  const W = LETTER_W;
  const H = LETTER_H;
  ctx.translate(pad, pad);

  // Deckled outline: an irregular edge, as if torn from a writing block.
  const edge = new Path2D();
  const jag = (n: number) => (rnd() - 0.5) * n;
  edge.moveTo(jag(6), jag(6));
  for (let x = 0; x <= W; x += 14) edge.lineTo(x, jag(5));
  for (let y = 0; y <= H; y += 14) edge.lineTo(W + jag(5), y);
  for (let x = W; x >= 0; x -= 14) edge.lineTo(x, H + jag(5));
  for (let y = H; y >= 0; y -= 14) edge.lineTo(jag(5), y);
  edge.closePath();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#d9c39a';
  ctx.fill(edge);
  ctx.restore();

  ctx.save();
  ctx.clip(edge);
  const base = ctx.createRadialGradient(W * 0.45, H * 0.45, 40, W / 2, H / 2, W * 0.75);
  base.addColorStop(0, '#efe0bd');
  base.addColorStop(0.6, '#e2cc9f');
  base.addColorStop(1, '#b8945e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Laid lines and chain lines of handmade paper.
  ctx.strokeStyle = rgba('#7a5a30', 0.05);
  ctx.lineWidth = 1;
  for (let y = 3; y < H; y += 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + jag(1));
    ctx.stroke();
  }
  ctx.strokeStyle = rgba('#7a5a30', 0.06);
  for (let x = 40; x < W; x += 92) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + jag(2), H);
    ctx.stroke();
  }

  // Foxing: small rust-brown spots, denser toward the edges.
  for (let i = 0; i < 160; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const e = Math.min(x, y, W - x, H - y) / Math.min(W, H);
    if (rnd() < e * 2.2) continue;
    const r = 1 + rnd() * (rnd() < 0.1 ? 14 : 4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba('#8a5a2a', 0.22 + rnd() * 0.2));
    g.addColorStop(1, rgba('#8a5a2a', 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Faint tea stains: clusters of soft blobs, darker at a ragged tide-line.
  for (let i = 0; i < 3; i++) {
    const cx = rnd() * W;
    const cy = rnd() * H;
    for (let k = 0; k < 5; k++) {
      const x = cx + (rnd() - 0.5) * 120;
      const y = cy + (rnd() - 0.5) * 80;
      const r = 40 + rnd() * 90;
      const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r);
      g.addColorStop(0, rgba('#a07040', 0.025));
      g.addColorStop(0.9, rgba('#8a5a2a', 0.05));
      g.addColorStop(1, rgba('#8a5a2a', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // A cup ring near a corner.
  ctx.strokeStyle = rgba('#7a4a20', 0.16);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.78, 58, 0.3, Math.PI * 1.8);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba('#7a4a20', 0.1);
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.78, 64, 0.1, Math.PI * 1.4);
  ctx.stroke();

  // Tri-fold creases: a shadowed valley with a lit ridge.
  for (const fy of [H / 3, (H * 2) / 3]) {
    const g = ctx.createLinearGradient(0, fy - 10, 0, fy + 10);
    g.addColorStop(0, rgba('#5a3a1a', 0));
    g.addColorStop(0.48, rgba('#5a3a1a', 0.18));
    g.addColorStop(0.52, rgba('#fff6e0', 0.35));
    g.addColorStop(1, rgba('#fff6e0', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, fy - 10, W, 20);
  }
  const vg = ctx.createLinearGradient(W / 2 - 8, 0, W / 2 + 8, 0);
  vg.addColorStop(0, rgba('#5a3a1a', 0));
  vg.addColorStop(0.5, rgba('#5a3a1a', 0.08));
  vg.addColorStop(1, rgba('#5a3a1a', 0));
  ctx.fillStyle = vg;
  ctx.fillRect(W / 2 - 8, 0, 16, H);

  // Burnt, darkened rim.
  const rim = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, W * 0.62);
  rim.addColorStop(0, rgba('#3a2410', 0));
  rim.addColorStop(1, rgba('#3a2410', 0.45));
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.strokeStyle = rgba('#5a3a18', 0.55);
  ctx.lineWidth = 2;
  ctx.stroke(edge);

  // Ruled margin, faded.
  ctx.strokeStyle = rgba('#9a3a3a', 0.16);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 18);
  ctx.lineTo(80, H - 18);
  ctx.stroke();

  grain(ctx, W, H, 0.05, seed);

  // Wax seal: a blot of red wax pressed with a thirteen-hour clock.
  const sx = W / 2;
  const sy = 6;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  const blob = new Path2D();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = 44 + jag(8);
    if (i === 0) blob.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else blob.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  blob.closePath();
  const wax = ctx.createRadialGradient(-10, -12, 4, 0, 0, 50);
  wax.addColorStop(0, '#c8323a');
  wax.addColorStop(0.6, '#8a1820');
  wax.addColorStop(1, '#4a0a10');
  ctx.fillStyle = wax;
  ctx.fill(blob);
  ctx.restore();
  ctx.save();
  ctx.translate(sx, sy);
  ctx.strokeStyle = rgba('#3a060a', 0.75);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba('#ff9a9a', 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-1, -1.5, 28, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
  ctx.strokeStyle = rgba('#3a060a', 0.8);
  ctx.lineWidth = 2;
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -16);
  ctx.moveTo(0, 0);
  ctx.lineTo(11, 5);
  ctx.stroke();
  ctx.restore();
  return canvas;
}
