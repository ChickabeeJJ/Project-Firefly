import Phaser from 'phaser';
import { audio } from '../audio/AudioController';
import { CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { dayReward, MILESTONES, type Reward, rewardIcon, rewardName, sheetFor, signIn } from '../systems/signin';
import { text, toast } from './kit';

/** A line for each day of the month, read off the sign-in sheet like a calendar's saying. */
const SAYINGS = [
  'A lamp kept is a promise kept. Another night, another wick.',
  'The fireflies counted you in tonight. They are very particular about it.',
  'Somewhere in Vellmoor a window has lit itself, just because you came back.',
  'Even the Dimming keeps a calendar. Ours is prettier.',
  'Wick Dust, brass and a little patience: the oldest recipe for light.',
  'The parlour clock says it is late. The parlour clock always says that.',
  'Every name you remember is one the dark has to give back.',
  'A small light, carried far, is still the whole of the light where it stands.',
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * The monthly sign-in sheet (after the reference's calendar): a parchment page with today's date
 * set large, today's reward and the days-signed bonuses on a dark card, and the month laid out
 * Monday-first. Opening it signs in for today, stamping the tile.
 */
export function openSignIn(scene: Phaser.Scene, onClose?: () => void): void {
  const save = saves.get();
  const now = new Date();
  const today = now.getDate();
  const sheet = sheetFor(save, now);
  const fresh = !sheet.days.includes(today);
  const root = scene.add.container(0, 0).setDepth(4000);
  // Reward slips wait until the sheet is put away, so nothing lands on top of it.
  const pending: [string, string][] = [];
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    audio.sfx('back');
    scene.tweens.add({ targets: root, alpha: 0, y: 12, duration: 240, ease: 'Sine.easeIn', onComplete: () => root.destroy() });
    for (const [msg, icon] of pending) toast(scene, msg, icon);
    onClose?.();
  };

  // Blurred-room dim, then the parchment page.
  root.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x07080a, 0.72).setInteractive().on('pointerup', close));
  const px = W / 2 + 60;
  const py = H / 2 - 10;
  const pw = 1560;
  const ph = 800;
  const page = scene.add.graphics();
  page.fillStyle(0x000000, 0.35).fillRect(px - pw / 2 + 10, py - ph / 2 + 14, pw, ph);
  page.fillGradientStyle(0xf6f1e8, 0xece4d6, 0xf3ece0, 0xe4d9c7, 1).fillRect(px - pw / 2, py - ph / 2, pw, ph);
  page.lineStyle(1, 0xb9a888, 0.8).strokeRect(px - pw / 2, py - ph / 2, pw, ph);
  page.lineStyle(1, 0xb9a888, 0.35).strokeRect(px - pw / 2 + 12, py - ph / 2 + 12, pw - 24, ph - 24);
  root.add(page);
  root.add(scene.add.rectangle(px - pw / 2, py - ph / 2, pw, ph, 0, 0).setOrigin(0).setInteractive()); // swallow taps on the page
  // Watermark, as the reference sets its title down the page.
  root.add(text(scene, px - 240, py + 40, 'FIREFLY', { size: 150, font: 'display', color: '#2a241c' }).setOrigin(0.5).setAngle(-90).setAlpha(0.05));

  // Date header.
  const hx = px - pw / 2 + 80;
  const hy = py - ph / 2 + 70;
  root.add(text(scene, hx + 210, hy + 40, `${now.getMonth() + 1}/`, { size: 52, font: 'display', color: '#2a241c' }).setOrigin(1, 0.5));
  root.add(text(scene, hx + 214, hy + 70, String(today).padStart(2, '0'), { size: 140, font: 'display', color: '#1e1a14' }).setOrigin(0, 0.5));
  root.add(text(scene, hx, hy + 120, 'Reward', { size: 58, font: 'letter', italic: true, color: '#2a241c', spacing: 4 }).setOrigin(0, 0.5));
  root.add(text(scene, hx + 430, hy + 70, `${MONTHS[now.getMonth()]}. ${now.getFullYear()}`, { size: 16, font: 'display', color: '#6b5f4c', spacing: 4 }).setOrigin(0.5).setAngle(-90));
  root.add(text(scene, hx, hy + 196, SAYINGS[(today - 1) % SAYINGS.length], { size: 23, italic: true, color: '#4a4032', wrap: 440, lineSpacing: 4 }).setOrigin(0, 0));

  // Dark card: today's reward and the days-signed bonuses.
  const cx = px - pw / 2 - 40;
  const cy = py + 40;
  const cw = 560;
  const chh = 380;
  const card = scene.add.graphics();
  card.fillStyle(0x000000, 0.4).fillRect(cx + 8, cy + 10, cw, chh);
  card.fillGradientStyle(0x2c2a28, 0x262422, 0x22201f, 0x1c1a19, 1).fillRect(cx, cy, cw, chh);
  card.lineStyle(1, 0xe8dcc0, 0.15).strokeRect(cx + 12, cy + 12, cw - 24, chh - 24);
  root.add(card);
  root.add(scene.add.rectangle(cx + 30, cy + 40, cw - 60, 120, 0x000000, 0.18).setOrigin(0).setStrokeStyle(1, 0xe8dcc0, 0.25));
  root.add(text(scene, cx + 54, cy + 76, 'Today’s Reward', { size: 26, color: CSS.cream }).setOrigin(0, 0.5));
  const tr = dayReward(today);
  root.add(text(scene, cx + 56, cy + 116, rewardName(tr), { size: 20, italic: true, color: CSS.creamDim }).setOrigin(0, 0.5));
  root.add(scene.add.image(cx + 410, cy + 98, rewardIcon(tr)).setDisplaySize(86, 86));
  root.add(text(scene, cx + 470, cy + 136, `x${tr.n.toLocaleString('en-US')}`, { size: 20, color: CSS.cream }).setOrigin(1, 0.5));
  const tick = text(scene, cx + 410, cy + 98, '✓', { size: 64, bold: true, color: '#ffffff', shadow: true }).setOrigin(0.5).setAlpha(fresh ? 0 : 0.95);
  root.add(tick);
  const signedText = text(scene, cx + 40, cy + 188, '', { size: 24, color: CSS.cream }).setOrigin(0, 0.5);
  root.add(signedText);
  const setSigned = () => signedText.setText(`Days signed in:  ${sheet.days.length}`);
  setSigned();
  // A thread linking the bonuses, filled as far as the days signed reach.
  const mxAt = (i: number) => cx + 100 + i * 170;
  const track = scene.add.graphics();
  root.add(track);
  const drawTrack = () => {
    const n = sheet.days.length;
    let fx = mxAt(0) - 60;
    MILESTONES.forEach((m, i) => {
      const prev = i ? MILESTONES[i - 1].days : 0;
      const x0 = i ? mxAt(i - 1) : mxAt(0) - 60;
      if (n >= m.days) fx = mxAt(i);
      else if (n > prev) fx = Math.max(fx, x0 + ((n - prev) / (m.days - prev)) * (mxAt(i) - x0));
    });
    track.clear();
    track.fillStyle(0xe8dcc0, 0.14).fillRect(mxAt(0) - 60, cy + 306, mxAt(2) - mxAt(0) + 60, 4);
    track.fillStyle(0xe2be6a, 0.9).fillRect(mxAt(0) - 60, cy + 306, fx - (mxAt(0) - 60), 4);
  };
  drawTrack();
  const medals: Phaser.GameObjects.Container[] = [];
  MILESTONES.forEach((m, i) => {
    const mx = mxAt(i);
    const my = cy + 308;
    const mc = scene.add.container(mx, my);
    mc.add(text(scene, -38, -62, String(m.days), { size: 32, font: 'display', color: CSS.cream }).setOrigin(0.5));
    mc.add(text(scene, -10, -70, 'DAYS', { size: 11, color: CSS.creamDim, spacing: 2 }).setOrigin(0, 0.5));
    mc.add(scene.add.circle(0, 0, 44, 0x000000, 0.35).setStrokeStyle(1.5, 0xe2be6a, 0.5));
    mc.add(scene.add.image(0, -2, rewardIcon(m.reward)).setDisplaySize(62, 62));
    mc.add(text(scene, 40, 30, `x${m.reward.n}`, { size: 20, color: CSS.cream }).setOrigin(0.5));
    mc.setData('days', m.days);
    root.add(mc);
    medals.push(mc);
  });
  const markMedals = () => {
    for (const mc of medals) {
      if (!sheet.milestones.includes(mc.getData('days')) || mc.getData('done')) continue;
      mc.setData('done', true);
      mc.add(scene.add.circle(0, 0, 44, 0x000000, 0.45));
      mc.add(text(scene, 0, -2, '✓', { size: 44, bold: true, color: CSS.accentStar }).setOrigin(0.5));
    }
  };
  markMedals();

  // Calendar, Monday first.
  const gx = px - 96;
  const gy = py - ph / 2 + 64;
  const tw = 104;
  const th = 112;
  const gap = 10;
  const head = scene.add.graphics();
  head.lineStyle(1.5, 0x8a7a60, 0.6).strokeRoundedRect(gx - 10, gy - 22, 7 * tw + 6 * gap + 20, 44, 22);
  root.add(head);
  ['MON', 'TUES', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'].forEach((d, i) => {
    root.add(text(scene, gx + i * (tw + gap) + tw / 2, gy, d, { size: 20, font: 'display', color: '#6b5f4c', spacing: 1 }).setOrigin(0.5));
    if (i) root.add(scene.add.rectangle(gx + i * (tw + gap) - gap / 2, gy, 1, 22, 0x8a7a60, 0.5));
  });
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let todayTile: Phaser.GameObjects.Container | undefined;
  for (let day = 1; day <= daysIn; day++) {
    const k = offset + day - 1;
    const x = gx + (k % 7) * (tw + gap) + tw / 2;
    const y = gy + 46 + Math.floor(k / 7) * (th + gap) + th / 2;
    const r = dayReward(day);
    const past = day < today;
    const claimed = sheet.days.includes(day);
    const special = r.kind === 'glimmer';
    const t = scene.add.container(x, y);
    t.add(scene.add.rectangle(3, 4, tw, th, 0x000000, 0.12));
    const fill = past || claimed ? 0x8e94ac : special ? 0xf2d2bc : 0xfbf8f2;
    t.add(scene.add.rectangle(0, 0, tw, th, fill, past || claimed ? 0.8 : 1).setStrokeStyle(1, 0x8a7a60, past || claimed ? 0.2 : 0.35));
    t.add(text(scene, -tw / 2 + 8, -th / 2 + 18, String(day).padStart(2, '0'), { size: 30, font: 'display', color: past || claimed ? '#5a6078' : '#b0a690' }).setOrigin(0, 0.5));
    t.add(scene.add.image(0, 4, rewardIcon(r)).setDisplaySize(58, 58).setAlpha(past && !claimed ? 0.55 : 1));
    t.add(text(scene, tw / 2 - 6, th / 2 - 14, `x${r.n}`, { size: 16, color: past || claimed ? '#f0f0f4' : '#4a4032' }).setOrigin(1, 0.5));
    if (special) t.add(scene.add.image(tw / 2 - 12, -th / 2 + 6, 'icon:star4').setDisplaySize(22, 22).setTint(0xe2be6a));
    if (claimed && day !== today) t.add(stamp(scene, tw, th));
    if (day === today) {
      const halo = scene.add.rectangle(0, 0, tw + 16, th + 16, 0xe2be6a, 0.25);
      t.addAt(halo, 0);
      scene.tweens.add({ targets: halo, alpha: 0.05, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      t.add(scene.add.rectangle(0, 0, tw + 6, th + 6, 0, 0).setStrokeStyle(3, 0xc8a24a, 1));
      if (!fresh) t.add(stamp(scene, tw, th));
      todayTile = t;
    }
    root.add(t);
  }

  // The hourglass that sits on the corner of the page.
  const hg = scene.textures.exists('hf:ui/motif_hourglass') ? 'hf:ui/motif_hourglass' : null;
  if (hg) {
    const im = scene.add.image(px + pw / 2 - 30, py + ph / 2 - 70, hg).setDisplaySize(170, 170).setAngle(14).setTint(0xe8dccb).setAlpha(0.9);
    root.add(im);
    scene.tweens.add({ targets: im, angle: 8, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Close.
  // Close: a dark seal set on the page's corner, clear of the calendar.
  const sx = px + pw / 2 + 6;
  const sy = py - ph / 2 - 6;
  const seal = scene.add.container(sx, sy);
  seal.add(scene.add.circle(2, 3, 32, 0x000000, 0.35));
  seal.add(scene.add.circle(0, 0, 32, 0x1e1c1a, 1).setStrokeStyle(2, 0xc8a24a, 0.9));
  seal.add(text(scene, 0, -1, '✕', { size: 28, color: CSS.cream }).setOrigin(0.5));
  seal.setSize(72, 72).setInteractive({ useHandCursor: true }).on('pointerup', close);
  root.add(seal);
  root.add(text(scene, px + 160, py + ph / 2 - 26, 'Tap outside the sheet to close', { size: 18, italic: true, color: '#8a7a60' }).setOrigin(0.5));
  const esc = () => root.active && close();
  scene.input.keyboard?.once('keydown-ESC', esc);

  root.setAlpha(0).setY(18);
  scene.tweens.add({ targets: root, alpha: 1, y: 0, duration: 420, ease: 'Sine.easeOut' });

  // Sign in: today's tile is stamped, the tick lands on the reward, and the slips arrive.
  if (fresh && todayTile) {
    const res = signIn(save, now);
    saves.commit();
    scene.time.delayedCall(700, () => {
      if (!root.active || !todayTile) return;
      const st = stamp(scene, tw, th).setScale(2.2).setAlpha(0);
      todayTile.add(st);
      scene.tweens.add({ targets: st, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeIn', onComplete: () => {
        audio.sfx('levelup');
        scene.cameras.main.shake(120, 0.002);
      } });
      scene.tweens.add({ targets: tick, alpha: 0.95, duration: 300, delay: 300 });
      setSigned();
      markMedals();
      drawTrack();
      if (res) {
        const pay = (r: Reward) => `+${r.n.toLocaleString('en-US')} ${rewardName(r)}`;
        // The reward rises off today's tile; the slips follow when the sheet is closed.
        const rise = text(scene, todayTile.x, todayTile.y - 20, pay(res.reward), { size: 24, bold: true, italic: true, color: CSS.accentInk, shadow: false }).setOrigin(0.5).setAlpha(0);
        root.add(rise);
        scene.tweens.add({ targets: rise, y: rise.y - 70, alpha: { from: 1, to: 0 }, duration: 1600, delay: 250, ease: 'Sine.easeOut', onComplete: () => rise.destroy() });
        pending.push([`Signed in · day ${sheet.days.length}  ${pay(res.reward)}`, res.reward.kind === 'glimmer' ? 'glimmer' : 'check']);
        res.milestones.forEach((m) => pending.push([`${sheet.days.length} days signed · ${pay(m)}`, 'glimmer']));
      }
    });
  }
}

/** Diagonal "CLAIMED" stamp across a tile. */
function stamp(scene: Phaser.Scene, tw: number, th: number): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  c.add(scene.add.rectangle(0, 0, tw, th, 0x3a3c4a, 0.35));
  c.add(scene.add.rectangle(0, 0, Math.hypot(tw, th) * 0.8, 1.5, 0xffffff, 0.8).setAngle(-48));
  c.add(text(scene, 0, 0, 'CLAIMED', { size: 19, font: 'display', bold: true, color: '#ffffff', spacing: 1, shadow: true }).setOrigin(0.5));
  return c;
}
