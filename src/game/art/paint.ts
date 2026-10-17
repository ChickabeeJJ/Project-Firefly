// Canvas painting helpers shared by every procedural art generator.

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { canvas, ctx };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colours (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Cel shadow: darken toward a cool violet ink instead of pure black (keeps colour alive). */
export function shade(c: string, t = 0.28): string {
  return mix(c, '#241a2e', t);
}

export function light(c: string, t = 0.25): string {
  return mix(c, '#fff6e6', t);
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function toInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export const OUTLINE = '#1b1518';

export interface PartStyle {
  fill: string;
  /** Cel shadow colour; defaults to shade(fill). Set false to skip. */
  shadow?: string | false;
  /** Shadow terminator circle in local coordinates. */
  shadowCircle?: [number, number, number];
  highlight?: [number, number, number, string?];
  outline?: number;
  outlineColor?: string;
}

/**
 * Fills a path, adds a curved cel shadow (clip + offset circle) and an optional highlight,
 * then strokes the outline. This is the core of the illustrated look.
 */
export function part(ctx: Ctx, path: Path2D, s: PartStyle): void {
  ctx.fillStyle = s.fill;
  ctx.fill(path);
  if (s.shadow !== false || s.highlight) {
    ctx.save();
    ctx.clip(path);
    if (s.shadow !== false && s.shadowCircle) {
      ctx.fillStyle = s.shadow ?? shade(s.fill);
      ctx.beginPath();
      ctx.arc(s.shadowCircle[0], s.shadowCircle[1], s.shadowCircle[2], 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.highlight) {
      const [hx, hy, hr, hc] = s.highlight;
      ctx.fillStyle = hc ?? light(s.fill, 0.35);
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (s.outline !== 0) {
    ctx.strokeStyle = s.outlineColor ?? OUTLINE;
    ctx.lineWidth = s.outline ?? 3;
    ctx.stroke(path);
  }
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  return p;
}

export function roundRectPath(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  const rr = Math.min(r, w / 2, h / 2);
  p.moveTo(x + rr, y);
  p.arcTo(x + w, y, x + w, y + h, rr);
  p.arcTo(x + w, y + h, x, y + h, rr);
  p.arcTo(x, y + h, x, y, rr);
  p.arcTo(x, y, x + w, y, rr);
  p.closePath();
  return p;
}

/** Path from an SVG-like list of points with optional quadratic smoothing. */
export function polyPath(pts: [number, number][], smooth = false): Path2D {
  const p = new Path2D();
  if (!smooth) {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  p.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const c = pts[i];
    const m = mid(c, pts[(i + 1) % n]);
    p.quadraticCurveTo(c[0], c[1], m[0], m[1]);
  }
  p.closePath();
  return p;
}

export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Deterministic hash-based noise for repeatable textures. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** Halftone dots whose radius follows a function of position (comic shading). */
export function halftone(
  ctx: Ctx, x: number, y: number, w: number, h: number, step: number, color: string,
  radiusAt: (px: number, py: number) => number, angle = Math.PI / 4,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const span = Math.hypot(w, h);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let gy = -span / 2; gy <= span / 2; gy += step) {
    for (let gx = -span / 2; gx <= span / 2; gx += step) {
      const px = cx + gx * cos - gy * sin;
      const py = cy + gx * sin + gy * cos;
      if (px < x - step || px > x + w + step || py < y - step || py > y + h + step) continue;
      const r = radiusAt(px, py) * step * 0.5;
      if (r <= 0.3) continue;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

let noiseTile: HTMLCanvasElement | null = null;

function noise(): HTMLCanvasElement {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const img = x.createImageData(128, 128);
  const rnd = seeded(1234);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() < 0.5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.round(rnd() * 255);
  }
  x.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

/** Grain overlay for a painterly finish: a shared noise tile composited only onto painted pixels. */
export function grain(ctx: Ctx, w: number, h: number, amount = 0.06, seed = 7): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = Math.min(1, amount * 2.2);
  const pat = ctx.createPattern(noise(), 'repeat')!;
  ctx.translate((seed * 37) % 128, (seed * 61) % 128);
  ctx.fillStyle = pat;
  ctx.fillRect(-128, -128, w + 256, h + 256);
  ctx.restore();
}

export function star4(ctx: Ctx, x: number, y: number, r: number, inner = 0.28): Path2D {
  const p = new Path2D();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
  void ctx;
  return p;
}

export function burstPath(x: number, y: number, rOuter: number, rInner: number, spikes: number, rnd?: () => number): Path2D {
  const p = new Path2D();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i * Math.PI) / spikes;
    const jitter = rnd ? 0.75 + rnd() * 0.5 : 1;
    const r = i % 2 === 0 ? rOuter * jitter : rInner;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
  return p;
}
