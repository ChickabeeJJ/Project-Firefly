import { makeCanvas, rgba } from './paint';

// Brass carriage-clock dial for the lobby: enamel face, Roman hours, minute track, and a
// thirteenth mark in red between XII and I — the hour that should not exist.

export const CLOCK_R = 150;

export function clockFaceCanvas(): HTMLCanvasElement {
  const S = CLOCK_R * 2 + 24;
  const { canvas, ctx } = makeCanvas(S, S);
  const c = S / 2;
  const R = CLOCK_R;
  // Drop shadow + outer brass bezel.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  const bez = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
  bez.addColorStop(0, '#f6dc9a');
  bez.addColorStop(0.35, '#a8742c');
  bez.addColorStop(0.55, '#f2cf86');
  bez.addColorStop(1, '#4a2e10');
  ctx.fillStyle = bez;
  ctx.beginPath();
  ctx.arc(c, c, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Knurled edge.
  ctx.strokeStyle = rgba('#3a2208', 0.6);
  ctx.lineWidth = 2;
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * (R - 2), c + Math.sin(a) * (R - 2));
    ctx.lineTo(c + Math.cos(a) * (R - 9), c + Math.sin(a) * (R - 9));
    ctx.stroke();
  }
  // Inner bevel.
  const inner = ctx.createLinearGradient(c, c - R, c, c + R);
  inner.addColorStop(0, '#5a3a14');
  inner.addColorStop(1, '#e8c47a');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(c, c, R - 13, 0, Math.PI * 2);
  ctx.fill();
  // Enamel face with aged warmth.
  const face = ctx.createRadialGradient(c - 30, c - 40, 10, c, c, R - 18);
  face.addColorStop(0, '#fbf3e0');
  face.addColorStop(0.75, '#efe0bf');
  face.addColorStop(1, '#cdb58a');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(c, c, R - 18, 0, Math.PI * 2);
  ctx.fill();
  // Guilloché rings.
  ctx.strokeStyle = rgba('#8a6a3a', 0.18);
  ctx.lineWidth = 1;
  for (let r = 18; r < R - 60; r += 5) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Minute track.
  ctx.strokeStyle = '#2a1a0c';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    ctx.lineWidth = major ? 2.6 : 1.1;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * (R - 24), c + Math.sin(a) * (R - 24));
    ctx.lineTo(c + Math.cos(a) * (R - (major ? 36 : 30)), c + Math.sin(a) * (R - (major ? 36 : 30)));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(c, c, R - 24, 0, Math.PI * 2);
  ctx.stroke();
  // Roman hours.
  const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.fillStyle = '#24160a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ROMAN.forEach((n, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * (R - 56), c + Math.sin(a) * (R - 56));
    ctx.rotate(a + Math.PI / 2);
    ctx.font = `600 ${n.length > 2 ? 22 : 26}px Cinzel, Georgia, serif`;
    ctx.fillText(n, 0, 0);
    ctx.restore();
  });
  // The thirteenth mark: a small red lozenge between XII and I.
  const a13 = (0.5 / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.translate(c + Math.cos(a13) * (R - 30), c + Math.sin(a13) * (R - 30));
  ctx.rotate(a13);
  ctx.fillStyle = '#9a1e22';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(0, -4);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Maker's cartouche.
  ctx.font = 'italic 15px "IM Fell English", Georgia, serif';
  ctx.fillStyle = rgba('#3a2412', 0.85);
  ctx.fillText('A. Vire · Vellmoor', c, c + 52);
  // Glass glare.
  const glare = ctx.createLinearGradient(c - R, c - R, c, c);
  glare.addColorStop(0, 'rgba(255,255,255,0.28)');
  glare.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glare;
  ctx.beginPath();
  ctx.ellipse(c - 34, c - 44, R * 0.62, R * 0.36, -0.7, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

/** A blued-steel clock hand, pointing up, pivot at (w/2, len). */
export function clockHandCanvas(len: number, w: number, color = '#1c2436', counter = 0): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(w, len + counter);
  const cx = w / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx + w * 0.22, len * 0.18);
  ctx.lineTo(cx + w * 0.12, len * 0.3);
  ctx.lineTo(cx + w * 0.5, len * 0.55);
  ctx.lineTo(cx + w * 0.16, len * 0.62);
  ctx.lineTo(cx + w * 0.14, len + counter);
  ctx.lineTo(cx - w * 0.14, len + counter);
  ctx.lineTo(cx - w * 0.16, len * 0.62);
  ctx.lineTo(cx - w * 0.5, len * 0.55);
  ctx.lineTo(cx - w * 0.12, len * 0.3);
  ctx.lineTo(cx - w * 0.22, len * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,190,255,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  return canvas;
}
