import Phaser from 'phaser';
import { audio, type Track } from '../audio/AudioController';
import { CHARACTERS } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { STAGES } from '../data/stages';
import { C, CSS, H, MOOD_CSS, MOOD_NAME, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { ACHIEVEMENTS, achievementState, claimAchievement, playerLevel, totalStars } from '../systems/achievements';
import { formatQty, ITEM_ORDER, ITEMS } from '../systems/growth';
import { claimTask, DAILY, type TaskDef, taskProgress, taskState, WEEKLY } from '../systems/tasks';
import { Button, ornament, scrollable, text, toast } from './kit';

// Modal info panels opened from the lobby and its options menu. Each is a self-contained
// container that swallows input underneath and closes with the ✕ or a tap on the backdrop.

const DEPTH = 3000;

interface Modal {
  c: Phaser.GameObjects.Container;
  close: (swap?: boolean) => void;
}

let swapping = false;

function modal(scene: Phaser.Scene, title: string, w: number, h: number, onClose?: () => void): Modal {
  const c = scene.add.container(0, 0).setDepth(DEPTH);
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.78).setInteractive();
  const panel = scene.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, w, h, 14, 14, 14, 14);
  const x0 = W / 2 - w / 2;
  const y0 = H / 2 - h / 2;
  const t = text(scene, W / 2, y0 + 50, title, { size: 44, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0.5);
  const orn = ornament(scene, W / 2, y0 + 96, Math.min(560, w - 200));
  const x = scene.add.image(x0 + w - 50, y0 + 50, 'icon:close').setDisplaySize(48, 48).setInteractive({ useHandCursor: true });
  c.add([dim, panel, t, orn, x]);
  // Open: the sheet rises a few pixels as it fades in; the backdrop dims separately.
  if (swapping) swapping = false;
  else {
    c.setAlpha(0).setY(22);
    scene.tweens.add({ targets: c, alpha: 1, y: 0, duration: 260, ease: 'Cubic.easeOut' });
  }
  let closed = false;
  /** `swap`: replaced at once by another panel (a tab change) — no fade, no sound. */
  const close = (swap = false) => {
    if (closed) return;
    closed = true;
    if (swap) {
      swapping = true;
      c.destroy();
      onClose?.();
      return;
    }
    audio.sfx('back');
    scene.tweens.add({ targets: c, alpha: 0, y: 14, duration: 180, ease: 'Cubic.easeIn', onComplete: () => c.destroy() });
    onClose?.();
  };
  x.on('pointerup', () => close());
  dim.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (Math.abs(p.x - W / 2) > w / 2 || Math.abs(p.y - H / 2) > h / 2) close();
  });
  scene.input.keyboard?.once('keydown-ESC', () => c.active && close());
  return { c, close };
}

// ===================================================================== Atlas

export function openAtlas(scene: Phaser.Scene): void {
  const { c } = modal(scene, 'ATLAS OF THE DIMMED', 1640, 900);
  const seen = new Set(saves.get().seen);
  const cols = 4;
  const tw = 230;
  const th = 176;
  const gx = W / 2 - 790;
  const gy = 220;
  const detail = scene.add.container(0, 0);
  c.add(detail);

  const show = (id: string) => {
    detail.removeAll(true);
    const e = ENEMIES.find((x) => x.id === id)!;
    const known = seen.has(id);
    const dx = W / 2 + 200;
    const img = scene.add.image(dx + 290, 520, `enemy:${e.kind}`).setOrigin(0.5, 1);
    img.setScale(Math.min(300 / img.height, 420 / img.width));
    if (!known) img.setTintFill(0x000000).setAlpha(0.7);
    detail.add(scene.add.image(dx + 290, 500, 'fx:glow').setTint(known ? C.gold : 0x666666).setDisplaySize(480, 300).setAlpha(0.18));
    detail.add(img);
    detail.add(text(scene, dx, 560, known ? e.name : '???', { size: 40, font: 'display', bold: true, color: known ? CSS.cream : CSS.muted }));
    if (known) {
      detail.add(text(scene, dx, 614, `${MOOD_NAME[e.mood]}${e.boss ? '  ·  BOSS' : ''}`, { size: 24, bold: true, color: MOOD_CSS[e.mood], spacing: 3 }));
      detail.add(text(scene, dx, 656, e.blurb, { size: 26, italic: true, color: CSS.creamDim, wrap: 600, lineSpacing: 4 }));
      const moves = [...e.moves.map((m) => m.name), `${e.finale.name} (finale)`].join('  ·  ');
      detail.add(text(scene, dx, 800, `Moves: ${moves}`, { size: 22, color: CSS.cream, wrap: 600 }));
    } else {
      detail.add(text(scene, dx, 620, 'Not yet encountered. Meet it in battle to fill this page.', { size: 26, italic: true, color: CSS.muted, wrap: 600 }));
    }
  };

  ENEMIES.forEach((e, i) => {
    const x = gx + (i % cols) * (tw + 14) + tw / 2;
    const y = gy + Math.floor(i / cols) * (th + 12) + th / 2;
    const known = seen.has(e.id);
    const tile = scene.add.container(x, y);
    const bg = scene.add.nineslice(0, 0, 'ui:paper', undefined, tw, th, 12, 12, 12, 12).setAlpha(known ? 1 : 0.35);
    const img = scene.add.image(0, 46, `enemy:${e.kind}`).setOrigin(0.5, 1);
    img.setScale(Math.min(110 / img.height, 190 / img.width));
    if (!known) img.setTintFill(0x1a1612);
    const name = text(scene, 0, 66, known ? e.name : '???', { size: 20, bold: true, color: CSS.paperText, wrap: tw - 16, align: 'center' }).setOrigin(0.5);
    tile.add([bg, img, name]);
    if (e.boss) tile.add(scene.add.image(tw / 2 - 22, -th / 2 + 22, 'icon:star4').setDisplaySize(30, 30));
    tile.setSize(tw, th).setInteractive({ useHandCursor: true });
    tile.on('pointerup', () => {
      audio.sfx('tap');
      show(e.id);
    });
    c.add(tile);
  });
  c.add(text(scene, gx + 10, 150, `${seen.size} / ${ENEMIES.length} recorded`, { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0, 0.5));
  show(ENEMIES.find((e) => seen.has(e.id))?.id ?? ENEMIES[0].id);
}

// ===================================================================== Achievements

/** The task board: Daily, Weekly and Achievements, as tabs along the top. */
export function openAchievements(scene: Phaser.Scene, onChange?: () => void, tab: 'daily' | 'weekly' | 'ach' = 'daily'): void {
  const { c, close } = modal(scene, 'TASKS', 1640, 920);
  const tabs: ['daily' | 'weekly' | 'ach', string][] = [['daily', 'Daily Tasks'], ['weekly', 'Weekly Tasks'], ['ach', 'Achievements']];
  tabs.forEach(([id, label], i) => {
    const on = id === tab;
    const tx = W / 2 - 300 + i * 300;
    const t = scene.add.container(tx, H / 2 - 460 + 128);
    const ready = id === 'ach' ? ACHIEVEMENTS.filter((a) => achievementState(saves.get(), a) === 'ready').length : (id === 'daily' ? DAILY : WEEKLY).filter((d) => taskState(saves.get(), d) === 'ready').length;
    t.add(text(scene, 0, 0, label, { size: on ? 28 : 25, font: 'display', bold: on, color: on ? CSS.goldLight : CSS.creamDim, spacing: 2 }).setOrigin(0.5));
    if (on) t.add(scene.add.rectangle(0, 26, 200, 3, C.gold, 0.9));
    if (ready) t.add(scene.add.circle(110, -12, 8, C.danger).setStrokeStyle(2, 0xffffff, 0.9));
    t.setSize(260, 60).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (on) return;
      audio.sfx('tap');
      close(true);
      openAchievements(scene, onChange, id);
    });
    c.add(t);
  });
  if (tab === 'ach') drawAchievements(scene, c, onChange, () => {
    close(true);
    openAchievements(scene, onChange, 'ach');
  });
  else drawTasks(scene, c, tab === 'daily' ? DAILY : WEEKLY, tab, onChange, () => {
    close(true);
    openAchievements(scene, onChange, tab);
  });
}

function drawTasks(scene: Phaser.Scene, c: Phaser.GameObjects.Container, defs: TaskDef[], tab: 'daily' | 'weekly', onChange: (() => void) | undefined, redraw: () => void): void {
  const save = saves.get();
  const now = new Date();
  const end = tab === 'daily' ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7 - ((now.getDay() + 6) % 7));
  const left = Math.max(0, end.getTime() - now.getTime());
  const hrs = Math.floor(left / 3600000);
  c.add(text(scene, W / 2, H / 2 - 460 + 190, `Resets in ${tab === 'daily' ? `${hrs}h ${Math.floor((left % 3600000) / 60000)}m` : `${Math.floor(hrs / 24)}d ${hrs % 24}h`}`, { size: 21, italic: true, color: CSS.creamDim }).setOrigin(0.5));
  const rowW = 1440;
  const rowH = 96;
  defs.forEach((d, i) => {
    const y = H / 2 - 460 + 270 + i * (rowH + 14);
    const st = taskState(save, d);
    const [cur, goal] = taskProgress(save, d);
    const row = scene.add.container(W / 2, y);
    row.add(scene.add.nineslice(0, 0, st === 'claimed' ? 'ui:dark' : 'ui:paper', undefined, rowW, rowH, 12, 12, 12, 12).setAlpha(st === 'claimed' ? 0.6 : 1));
    const dark = st !== 'claimed';
    row.add(text(scene, -rowW / 2 + 40, -16, d.name, { size: 27, font: 'display', bold: true, color: dark ? CSS.paperText : CSS.creamDim }).setOrigin(0, 0.5));
    // Progress bar.
    row.add(scene.add.rectangle(-rowW / 2 + 40, 22, 420, 10, 0x000000, 0.18).setOrigin(0, 0.5));
    row.add(scene.add.rectangle(-rowW / 2 + 40, 22, 420 * (cur / goal), 10, C.amber, 0.95).setOrigin(0, 0.5));
    row.add(text(scene, -rowW / 2 + 480, 22, `${cur} / ${goal}`, { size: 20, color: dark ? CSS.paperSub : CSS.muted }).setOrigin(0, 0.5));
    // Rewards.
    const rewards: [string, number][] = [['icon:glimmer', d.glimmer], ...Object.entries(d.items ?? {}).map(([k, v]) => [`item:${k}`, v as number] as [string, number])];
    rewards.forEach(([key, q], k) => {
      const rx = 40 + k * 118;
      row.add(scene.add.image(rx - 20, 0, key).setDisplaySize(52, 52).setAlpha(st === 'claimed' ? 0.5 : 1));
      row.add(text(scene, rx + 10, 16, formatQty(q), { size: 19, bold: true, color: dark ? CSS.paperText : CSS.muted }).setOrigin(0, 0.5));
    });
    if (st === 'claimed') row.add(scene.add.image(rowW / 2 - 90, 0, 'icon:check').setDisplaySize(44, 44));
    else {
      const b = new Button(scene, rowW / 2 - 110, 0, {
        w: 180, h: 62, label: st === 'ready' ? 'Claim' : 'In progress', style: st === 'ready' ? 'gold' : 'dark', size: st === 'ready' ? 26 : 20, sfx: st === 'ready' ? 'levelup' : 'tap',
        onClick: () => {
          if (st !== 'ready') return;
          if (claimTask(saves.get(), d.id)) {
            saves.commit();
            toast(scene, `+${d.glimmer} Glimmer${d.items ? ' and materials' : ''}`, 'glimmer');
            onChange?.();
            redraw();
          }
        },
      });
      if (st !== 'ready') b.setAlpha(0.6);
      row.add(b);
    }
    c.add(row);
  });
}

function drawAchievements(scene: Phaser.Scene, c: Phaser.GameObjects.Container, onChange: (() => void) | undefined, _redraw: () => void): void {
  const list = scene.add.container(0, 0);
  c.add(list);
  const rowsH = Math.ceil(ACHIEVEMENTS.length / 2) * 100 + 40;
  // Drag or wheel to scroll; no scroll bar (like the reference's lists).
  const scroll = scrollable(scene, list, new Phaser.Geom.Rectangle(W / 2 - 810, 236, 1620, H / 2 + 460 - 250), rowsH);
  const done = ACHIEVEMENTS.filter((a) => saves.get().claimed.includes(a.id)).length;
  c.add(text(scene, W / 2, H / 2 - 460 + 190, `${done} / ${ACHIEVEMENTS.length} claimed`, { size: 21, italic: true, color: CSS.creamDim }).setOrigin(0.5));
  const draw = () => {
    list.removeAll(true);
    const save = saves.get();
    const rowW = 760;
    const rowH = 92;
    ACHIEVEMENTS.forEach((a, i) => {
      const col = i % 2;
      const x = W / 2 - 400 + col * 800;
      const y = 286 + Math.floor(i / 2) * (rowH + 8) + rowH / 2;
      const st = achievementState(save, a);
      const [cur, goal] = a.progress(save);
      const row = scene.add.container(x, y);
      row.add(scene.add.nineslice(0, 0, st === 'claimed' ? 'ui:dark' : 'ui:paper', undefined, rowW, rowH, 12, 12, 12, 12).setAlpha(st === 'claimed' ? 0.6 : 1));
      const dark = st !== 'claimed';
      row.add(scene.add.image(-rowW / 2 + 46, 0, 'icon:trophy').setDisplaySize(52, 52).setAlpha(st === 'locked' ? 0.4 : 1));
      row.add(text(scene, -rowW / 2 + 88, -18, a.name, { size: 26, font: 'display', bold: true, color: dark ? CSS.paperText : CSS.creamDim }).setOrigin(0, 0.5));
      row.add(text(scene, -rowW / 2 + 88, 18, `${a.desc}  (${Math.min(cur, goal)}/${goal})`, { size: 20, color: dark ? CSS.paperSub : CSS.muted }).setOrigin(0, 0.5));
      if (st === 'claimed') {
        row.add(scene.add.image(rowW / 2 - 60, 0, 'icon:check').setDisplaySize(44, 44));
      } else if (st === 'ready') {
        const b = new Button(scene, rowW / 2 - 92, 0, {
          w: 160, h: 60, label: `+${a.reward}`, icon: 'glimmer', style: 'gold', size: 24, sfx: 'levelup',
          onClick: () => {
            if (scroll.wasDrag() || !scroll.visible(list.y + y)) return;
            const got = claimAchievement(saves.get(), a.id);
            if (got) {
              saves.commit();
              toast(scene, `+${got} Glimmer`, 'glimmer');
              onChange?.();
              draw();
            }
          },
        });
        row.add(b);
      } else {
        row.add(scene.add.image(rowW / 2 - 120, 0, 'icon:glimmer').setDisplaySize(34, 34).setAlpha(0.6));
        row.add(text(scene, rowW / 2 - 98, 0, `${a.reward}`, { size: 24, bold: true, color: CSS.paperSub }).setOrigin(0, 0.5));
      }
      list.add(row);
    });
  };
  draw();
}

// ===================================================================== Notice board

const HOW_TO = [
  ['Verses', 'Tap a Verse to cast it. Each round you have 3 Beats; the round plays out once they are all used.'],
  ['Merging', 'Identical Verses side by side merge into a higher rank (★★, ★★★). Casting the card between two twins merges them for free.'],
  ['Moving', 'Drag a Verse along your hand to move it. It costs a Beat but can set up a merge.'],
  ['Fireflies', 'Lit Verses hit 30% harder and feed the Lantern. At 5 fireflies, tap the Lantern for an extra Beat.'],
  ['Finales', 'Casting builds Ardor. At 5 Ardor a Luminary’s Finale card appears: a huge Verse that never merges.'],
  ['Moods', 'Sun beats Star, Star beats Moon, Moon beats Sun: +30% damage when you hold the advantage.'],
];

const WHATS_NEW = [
  ['Version 1.0 · The Thirteenth Hour', 'Cassian Vire, Ambroise Morrow, Mireille Brume and Perrine Lys join the Troupe. Listen to the parlour clock at midnight.'],
  ['Chapter 3 · The Drowned Docks', 'Drowned brides, bilge shades and a siren in the mirror. Boss: Keeper Brine.'],
  ['Chapter 4 · The Clock Without Hands', 'Climb the Cathedral Clock and face The Hourless King.'],
  ['New faces', 'Corvin, Seraphine, Columbine, Lucien, Aldric, Ophelia, Valerian and Elias have new portraits and new names.'],
  ['A guided first battle', 'Stage 1-1 now walks new Lamplighters through every rule.'],
  ['Lobby & menu', 'A new parlour, an options menu, the Atlas, Achievements and a gramophone.'],
];

export function openNotice(scene: Phaser.Scene): void {
  const { c } = modal(scene, 'NOTICE BOARD', 1640, 900);
  const cols: [string, string[][]][] = [['How to Play', HOW_TO], ['What’s New', WHATS_NEW]];
  cols.forEach(([head, items], k) => {
    const x = W / 2 - 760 + k * 780;
    c.add(text(scene, x + 20, 214, head.toUpperCase(), { size: 28, font: 'display', bold: true, color: CSS.firefly, spacing: 4 }));
    let y = 268;
    for (const [t, body] of items) {
      const tt = text(scene, x + 20, y, t, { size: 26, font: 'display', bold: true, color: CSS.cream });
      const bt = text(scene, x + 20, y + 38, body, { size: 22, color: CSS.creamDim, wrap: 700, lineSpacing: 2 });
      c.add([tt, bt]);
      y += 52 + bt.height + 18;
    }
  });
}

// ===================================================================== Gramophone

const RECORDS: { track: Track; name: string; desc: string }[] = [
  { track: 'lobby', name: 'Parlour Waltz', desc: 'The lobby theme. A quiet room with the lamps low.' },
  { track: 'rite', name: 'The Lantern Rite', desc: 'Shimmering chimes from the summoning hall.' },
  { track: 'battle', name: 'Street Skirmish', desc: 'The everyday battle theme.' },
  { track: 'boss', name: 'Curtain Call', desc: 'Played when something enormous steps out of the dark.' },
];

export function openGramophone(scene: Phaser.Scene): void {
  const { c } = modal(scene, 'GRAMOPHONE', 1100, 760);
  const rows = scene.add.container(0, 0);
  c.add(rows);
  const draw = () => {
    rows.removeAll(true);
    const cur = saves.get().settings.track;
    RECORDS.forEach((r, i) => {
      const y = 330 + i * 130;
      const on = r.track === cur;
      const row = scene.add.container(W / 2, y);
      row.add(scene.add.nineslice(0, 0, on ? 'ui:paper' : 'ui:dark', undefined, 940, 112, 12, 12, 12, 12).setAlpha(on ? 1 : 0.9));
      const disc = scene.add.circle(-400, 0, 40, 0x15120f).setStrokeStyle(4, on ? C.amber : 0x5a5048);
      row.add([disc, scene.add.circle(-400, 0, 12, on ? C.amber : 0x8a6a48)]);
      if (on) scene.tweens.add({ targets: disc, angle: 360, duration: 3000, repeat: -1 });
      row.add(text(scene, -330, -20, r.name, { size: 30, font: 'display', bold: true, color: on ? CSS.paperText : CSS.cream }).setOrigin(0, 0.5));
      row.add(text(scene, -330, 20, r.desc, { size: 22, italic: true, color: on ? CSS.paperSub : CSS.creamDim }).setOrigin(0, 0.5));
      if (on) row.add(text(scene, 430, 0, 'NOW PLAYING', { size: 20, bold: true, color: CSS.amber, spacing: 3 }).setOrigin(1, 0.5));
      row.setSize(940, 112).setInteractive({ useHandCursor: true });
      row.on('pointerup', () => {
        if (on) return;
        audio.sfx('tap');
        saves.get().settings.track = r.track;
        saves.commit();
        audio.play(r.track);
        draw();
      });
      rows.add(row);
    });
  };
  draw();
}

// ===================================================================== Profile

export function openProfile(scene: Phaser.Scene): void {
  const { c } = modal(scene, 'LAMPLIGHTER', 1500, 800);
  const s = saves.get();
  const top = H / 2 - 400;
  c.add(text(scene, W / 2, top + 150, `Lv ${playerLevel(s)}  ·  ID ${s.playerId}`, { size: 28, color: CSS.creamDim }).setOrigin(0.5));
  // Left: the record.
  const lx = W / 2 - 690;
  c.add(text(scene, lx, top + 214, 'RECORD', { size: 22, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0, 0.5));
  const stats: [string, string][] = [
    ['Stages cleared', `${Object.keys(s.stars).length} / ${STAGES.length}`],
    ['Stars earned', `${totalStars(s)} / ${STAGES.length * 3}`],
    ['Luminaries', `${Object.keys(s.roster).length} / ${CHARACTERS.length}`],
    ['Lantern Rites', `${s.totalPulls}`],
    ['Dimmed recorded', `${s.seen.length} / ${ENEMIES.length}`],
    ['Achievements', `${s.claimed.length} / ${ACHIEVEMENTS.length}`],
  ];
  stats.forEach(([k, v], i) => {
    const y = top + 272 + i * 66;
    c.add(text(scene, lx, y, k, { size: 27, color: CSS.cream }).setOrigin(0, 0.5));
    c.add(text(scene, lx + 600, y, v, { size: 27, bold: true, color: CSS.goldLight }).setOrigin(1, 0.5));
    if (i < stats.length - 1) c.add(scene.add.rectangle(lx + 300, y + 33, 600, 1, C.gold, 0.2));
  });
  c.add(scene.add.rectangle(W / 2 - 30, top + 470, 1, 520, C.gold, 0.3));
  // Right: the wallet — Glimmer and every material, as tiles.
  const rx = W / 2 + 30;
  c.add(text(scene, rx, top + 214, 'RESOURCES', { size: 22, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0, 0.5));
  const wallet: [string, string, number][] = [['icon:glimmer', 'Glimmer', s.glimmer], ...ITEM_ORDER.map((id) => [`item:${id}`, ITEMS[id].name, s.items[id] ?? 0] as [string, string, number])];
  const tw = 318;
  const th = 118;
  wallet.forEach(([icon, name, n], i) => {
    const x = rx + (i % 2) * (tw + 22);
    const y = top + 250 + Math.floor(i / 2) * (th + 14);
    c.add(scene.add.rectangle(x, y, tw, th, 0x0b0c10, 0.45).setOrigin(0).setStrokeStyle(1, 0xe8dcc0, 0.25));
    c.add(scene.add.image(x + 18, y + 22, 'fx:glow').setOrigin(0).setDisplaySize(80, 80).setTint(0xffe2a0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.12));
    c.add(scene.add.image(x + 58, y + th / 2, icon).setDisplaySize(78, 78));
    c.add(text(scene, x + 110, y + 40, name, { size: 21, italic: true, color: CSS.creamDim }).setOrigin(0, 0.5));
    c.add(text(scene, x + 110, y + 78, n.toLocaleString('en-US'), { size: 32, bold: true, color: CSS.cream }).setOrigin(0, 0.5));
  });
}
