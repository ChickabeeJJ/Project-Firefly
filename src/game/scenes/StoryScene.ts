import Phaser from 'phaser';
import { vintageHandCanvas } from '../art/clockFace';
import { ensureBg } from '../art/registry';
import { dropIn } from '../art/assets';
import { audio } from '../audio/AudioController';
import { getEnemy } from '../data/enemies';
import { CHAPTERS, STAGES, getStage } from '../data/stages';
import type { StageDef } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { frontierStage, isUnlocked, REWARDS, trialCleared, trialUnlocked } from '../systems/progression';
import { TRIAL_FAMILIES, trialsOf, type TrialFamily } from '../data/trials';
import { formatQty, fromLegacyLevel, insightLabel, ITEMS, type ItemId, stageItems } from '../systems/growth';
import { CINEMATICS, STAGE_INTERLUDES } from '../data/story';
import { goToStage } from '../systems/storyFlow';
import { deskPaperCanvas, playbillCanvas } from '../art/letterPaper';
import { Atmosphere, Button, fadeIn, goTo, ornament, scrollable, softPress, text } from '../ui/kit';

type Mode = 'story' | 'resource' | 'insight';

/** Chapter timeline of stages (adapted from the reference's stage line), with a detail panel. */
export class StoryScene extends Phaser.Scene {
  private chapter = 1;
  private selected!: StageDef;
  private timeline?: Phaser.GameObjects.Container;
  private detail?: Phaser.GameObjects.Container;
  private header?: Phaser.GameObjects.Container;
  private mode: Mode = 'story';
  private family: string | null = null;

  constructor() {
    super('Story');
  }

  create(data: { stageId?: string; mode?: Mode; family?: string | null } = {}): void {
    fadeIn(this);
    const save = saves.get();
    const asked = data.stageId ? getStage(data.stageId) : null;
    this.mode = data.mode ?? asked?.mode ?? 'story';
    this.family = data.family !== undefined ? data.family : asked?.family ?? null;
    this.tabBar();
    if (this.mode !== 'story') {
      this.timeline = undefined;
      this.detail = undefined;
      this.header = undefined;
      if (this.family) this.renderFamily(TRIAL_FAMILIES.find((f) => f.id === this.family)!, asked?.mode ? asked : null);
      else this.renderCards();
      audio.play('lobby');
      return;
    }
    const pick = asked && !asked.mode ? asked : frontierStage(save);
    this.selected = pick;
    this.chapter = pick.chapter;
    this.timeline = undefined;
    this.detail = undefined;
    this.header = undefined;
    this.add.image(W / 2, H / 2, ensureBg(this, 'map')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 40, fireflies: 4 });
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }).setDepth(90);
    new Button(this, 330, 70, { w: 250, h: 64, label: 'Memories', icon: 'story', style: 'dark', size: 24, onClick: () => this.openMemories() }).setDepth(90);
    CHAPTERS.forEach((ch, i) => {
      const unlocked = isUnlocked(save, STAGES.find((s) => s.chapter === ch.id)!.id);
      const b = new Button(this, W - 130 - (CHAPTERS.length - 1 - i) * 210, 70, {
        w: 200, h: 64, label: `Chapter ${ch.id}`, style: ch.id === this.chapter ? 'gold' : 'dark', size: 21, icon: unlocked ? undefined : 'lock',
        onClick: () => {
          if (!unlocked) {
            audio.sfx('deny');
            return;
          }
          this.chapter = ch.id;
          this.selected = STAGES.find((s) => s.chapter === ch.id && isUnlocked(save, s.id) && !(s.id in save.stars)) ?? STAGES.find((s) => s.chapter === ch.id)!;
          this.scene.restart({ stageId: this.selected.id });
        },
      }).setDepth(90);
      if (!unlocked) b.setAlpha(0.6);
    });
    this.render();
    audio.play('lobby');
  }

  private render(): void {
    this.header?.destroy();
    this.timeline?.destroy();
    const ch = CHAPTERS.find((c) => c.id === this.chapter)!;
    this.header = this.add.container(0, 0).setDepth(50);
    this.header.add(text(this, W / 2, 168, `CHAPTER ${ch.id}`, { size: 28, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0.5));
    this.header.add(text(this, W / 2, 226, ch.name.toUpperCase(), { size: 72, font: 'display', bold: true, color: CSS.cream, spacing: 8, shadow: true }).setOrigin(0.5));
    this.header.add(text(this, W / 2, 290, ch.subtitle, { size: 28, italic: true, color: CSS.creamDim }).setOrigin(0.5));
    this.header.add(ornament(this, W / 2, 330, 600));

    const save = saves.get();
    const stages = STAGES.filter((s) => s.chapter === this.chapter);
    const tl = this.add.container(0, 0).setDepth(50);
    const y = 470;
    const x0 = 190;
    const gap = (W - 380) / (stages.length - 1);
    const line = this.add.graphics();
    line.lineStyle(3, C.gold, 0.5).lineBetween(x0 - 60, y, W - x0 + 60, y);
    tl.add(line);
    stages.forEach((s, i) => {
      const x = x0 + i * gap;
      const unlocked = isUnlocked(save, s.id);
      const cleared = s.id in save.stars;
      const sel = s.id === this.selected.id;
      const size = s.boss ? 50 : 38;
      const node = this.add.graphics();
      node.fillStyle(sel ? C.amber : cleared ? 0x2a2620 : 0x15171c, 1);
      node.lineStyle(3, s.boss ? C.danger : sel ? C.gold : cleared ? C.goldDeep : 0x4a4a52, 1);
      const pts = [new Phaser.Math.Vector2(x, y - size), new Phaser.Math.Vector2(x + size, y), new Phaser.Math.Vector2(x, y + size), new Phaser.Math.Vector2(x - size, y)];
      node.fillPoints(pts, true).strokePoints(pts, true);
      tl.add(node);
      tl.add(text(this, x, y, unlocked ? String(s.index).padStart(2, '0') : '', { size: s.boss ? 34 : 28, font: 'display', bold: true, color: sel ? '#fff4e4' : CSS.cream }).setOrigin(0.5));
      if (!unlocked) tl.add(this.add.image(x, y, 'icon:lock').setDisplaySize(34, 34).setAlpha(0.7));
      tl.add(text(this, x, y + 74, unlocked ? s.name : '— locked —', {
        size: 24, color: unlocked ? (sel ? CSS.goldLight : CSS.cream) : CSS.muted, align: 'center', wrap: 200,
      }).setOrigin(0.5, 0));
      if (cleared) {
        for (let k = 0; k < 3; k++) {
          tl.add(this.add.image(x + (k - 1) * 30, y - size - 26, 'icon:star4').setDisplaySize(26, 26).setTint(k < save.stars[s.id] ? 0x9fd27a : 0x3a3a42));
        }
      }
      if (sel) {
        const ring = this.add.image(x, y, 'fx:glow').setTint(C.amberLight).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(220, 220).setAlpha(0.5);
        this.tweens.add({ targets: ring, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
        tl.addAt(ring, 0);
      }
      const zone = this.add.zone(x, y + 40, gap * 0.9, 220).setInteractive({ useHandCursor: unlocked });
      zone.on('pointerup', () => {
        if (!unlocked) {
          audio.sfx('deny');
          return;
        }
        audio.sfx('tap');
        this.selected = s;
        this.render();
      });
      tl.add(zone);
    });
    this.timeline = tl;
    this.renderDetail();
  }

  /** The selected stage as an aged playbill: the bill on the left, the cast and takings on the right, a ticket stub to begin. */
  private renderDetail(): void {
    this.detail?.destroy();
    const s = this.selected;
    const save = saves.get();
    const w = 1560;
    const h = 330;
    const c = this.add.container(W / 2, 800).setDepth(60);
    const key = `ui:playbill${w}x${h}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, playbillCanvas(w, h));
    c.add(this.add.image(0, 0, key));
    const ink = '#2a1d10';
    const sepia = '#6a5034';
    const rust = '#3f6a44';
    const stub = 230;
    const lx = -w / 2 + 52;

    // ---- the bill
    const ch = CHAPTERS.find((x) => x.id === s.chapter)!;
    c.add(text(this, lx, -122, `${s.id}   ·   CHAPTER ${['I', 'II', 'III', 'IV'][s.chapter - 1] ?? s.chapter}${s.boss ? '   ·   FINAL ACT' : ''}`, { size: 18, font: 'display', color: s.boss ? '#a8322a' : rust, spacing: 4 }).setOrigin(0, 0.5));
    const title = text(this, lx, -74, s.name, { size: 48, font: 'display', bold: true, color: ink }).setOrigin(0, 0.5);
    if (title.width > 660) title.setScale(660 / title.width);
    c.add(title);
    c.add(this.add.rectangle(lx, -38, 300, 1.5, 0x5a4026, 0.6).setOrigin(0, 0.5));
    const rec = fromLegacyLevel(s.level, 4);
    c.add(text(this, lx, -10, `${ch.subtitle}  ·  recommended ${insightLabel(rec.insight)}, Lv ${rec.level}`, { size: 22, italic: true, color: sepia }).setOrigin(0, 0.5));
    c.add(text(this, lx, 22, `${s.waves.length} act${s.waves.length > 1 ? 's' : ''}  ·  round limit ${s.roundLimit}`, { size: 22, italic: true, color: sepia }).setOrigin(0, 0.5));
    // Objectives as three small ruled lines with stars (filled when earned).
    const best = save.stars[s.id] ?? 0;
    ['Drive back the Dimming', `Win within ${s.starRounds} rounds`, 'No Luminary falls'].forEach((g, i) => {
      const y = 66 + i * 30;
      c.add(this.add.image(lx + 10, y, 'icon:starp').setDisplaySize(22, 22).setAlpha(i < best ? 1 : 0.35));
      c.add(text(this, lx + 30, y, g, { size: 21, color: i < best ? ink : sepia }).setOrigin(0, 0.5));
    });
    if (s.rule) {
      const note = text(this, lx + 420, 80, s.rule === 'fireflyBloom' ? 'Firefly Bloom\ntwo fireflies a round' : 'Restless Dim\nfoes start with 2 Ardor', { size: 19, font: 'letter', italic: true, color: '#5a6a22', align: 'center', lineSpacing: 2 }).setOrigin(0.5).setAngle(-4);
      c.add(this.add.rectangle(lx + 420, 80, note.width + 26, note.height + 14, 0x5a6a22, 0.08).setStrokeStyle(1.5, 0x5a6a22, 0.6).setAngle(-4));
      c.add(note);
    }

    // ---- divider
    const dx = 40;
    const g = this.add.graphics();
    g.lineStyle(1, 0x5a4026, 0.5);
    for (let y = -h / 2 + 34; y < h / 2 - 34; y += 10) g.lineBetween(dx, y, dx, y + 5);
    c.add(g);

    // ---- the cast of the Dimmed
    const rx = dx + 46;
    c.add(text(this, rx, -122, 'THE DIMMED', { size: 18, font: 'display', color: rust, spacing: 4 }).setOrigin(0, 0.5));
    const ids = [...new Set(s.waves.flat())];
    const step = Math.min(118, (w / 2 - stub - rx - 40) / Math.max(1, ids.length));
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const ex = rx + 50 + i * step;
      c.add(this.add.circle(ex, -50, 46, 0x1c1610, 0.9).setStrokeStyle(2, 0x8a6a3a, 0.8));
      const img = this.add.image(ex, -50, `enemy:${e.kind}`);
      img.setScale(Math.min(84 / img.height, 84 / img.width));
      c.add(img);
      c.add(this.add.image(ex + 34, -84, `icon:${e.mood}`).setDisplaySize(28, 28));
      const lbl = text(this, ex, 8, e.name.replace(/^The /, ''), { size: 17, italic: true, color: sepia }).setOrigin(0.5);
      if (lbl.width > step - 8) lbl.setScale((step - 8) / lbl.width);
      c.add(lbl);
    });

    // ---- the takings
    const cleared = s.id in save.stars;
    c.add(text(this, rx, 48, cleared ? 'TAKINGS' : 'TAKINGS  ·  FIRST NIGHT', { size: 18, font: 'display', color: rust, spacing: 4 }).setOrigin(0, 0.5));
    const rewards: [string, string][] = [['icon:glimmer', `${cleared ? REWARDS.repeatClear : REWARDS.firstClear}`]];
    for (const [id, n] of Object.entries(stageItems(s.level, s.chapter, !cleared, false))) rewards.push([`item:${id}`, formatQty(n as number)]);
    rewards.forEach(([icon, q], i) => {
      const tx = rx + 40 + i * 92;
      c.add(this.add.rectangle(tx, 100, 80, 80, 0x2a2016, 0.08).setStrokeStyle(1.5, 0x5a4026, 0.55));
      c.add(this.add.image(tx, 94, icon).setDisplaySize(56, 56));
      c.add(text(this, tx, 128, q, { size: 16, bold: true, color: ink }).setOrigin(0.5));
    });
    if (!cleared) c.add(text(this, rx + 40 + rewards.length * 92 - 20, 100, `+${REWARDS.perfectBonus} for ★★★`, { size: 17, italic: true, color: sepia }).setOrigin(0, 0.5));

    // ---- ticket stub
    const sx = w / 2 - stub / 2 - 14;
    const perf = this.add.graphics();
    perf.fillStyle(0x5a4026, 0.55);
    for (let y = -h / 2 + 22; y < h / 2 - 16; y += 12) perf.fillCircle(w / 2 - stub - 14, y, 2);
    c.add(perf);
    c.add(this.add.rectangle(sx, 0, stub - 30, h - 56, 0x3c6e45, 0.92).setStrokeStyle(1.5, 0x1e3a24, 0.9));
    c.add(this.add.rectangle(sx, 0, stub - 46, h - 72).setStrokeStyle(1, 0xf2d8b0, 0.5));
    c.add(text(this, sx, -86, 'ADMIT ONE', { size: 16, font: 'display', color: '#f6e6c8', spacing: 4 }).setOrigin(0.5));
    c.add(text(this, sx, -10, 'Begin', { size: 46, font: 'display', bold: true, color: '#fff4e4' }).setOrigin(0.5));
    c.add(this.add.image(sx, 54, 'icon:back').setDisplaySize(30, 30).setFlipX(true).setTint(0xf6e6c8));
    c.add(text(this, sx, 104, s.id, { size: 18, font: 'display', color: '#f6e6c8', spacing: 3 }).setOrigin(0.5));
    const hit = this.add.zone(sx, 0, stub - 30, h - 56).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.005, duration: 120 }));
    hit.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
    hit.on('pointerup', () => {
      audio.sfx('tap');
      void this.begin(s);
    });
    this.detail = c;
  }

  private async begin(s: StageDef): Promise<void> {
    goToStage(this, s.id);
  }

  /** Archive of story cinematics already watched, to replay at will. */
  private openMemories(): void {
    const c = this.add.container(0, 0).setDepth(3000);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.85).setInteractive();
    const panel = this.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, 1160, 880, 14, 14, 14, 14);
    const title = text(this, W / 2, H / 2 - 384, 'MEMORIES', { size: 46, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0.5);
    c.add([dim, panel, title, ornament(this, W / 2, H / 2 - 338, 520)]);
    const close = () => {
      audio.sfx('back');
      c.destroy();
    };
    dim.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Math.abs(p.x - W / 2) > 580 || Math.abs(p.y - H / 2) > 440) close();
    });
    this.input.keyboard?.once('keydown-ESC', close);
    c.add(new Button(this, W / 2 + 524, H / 2 - 384, { w: 60, h: 60, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: close }));

    // Story order: each chapter's opening, its interludes in stage order, then its ending.
    const stageOf = new Map(Object.entries(STAGE_INTERLUDES).map(([st, id]) => [id, getStage(st).index]));
    const rank = (id: string): [number, number] => {
      if (id === 'prologue') return [1, 0];
      const m = id.match(/^ch(\d)_(open|end|i\d+)$/);
      if (!m) return [9, 0];
      return [Number(m[1]), m[2] === 'open' ? 1 : m[2] === 'end' ? 99 : 10 + (stageOf.get(id) ?? Number(m[2].slice(1)))];
    };
    const ordered = [...CINEMATICS].sort((x, y) => {
      const [a1, b1] = rank(x.id);
      const [a2, b2] = rank(y.id);
      return a1 - a2 || b1 - b2;
    });
    const seenCount = ordered.filter((cin) => saves.hasHint(`cine:${cin.id}`)).length;
    c.add(text(this, W / 2, H / 2 - 300, `${seenCount} of ${ordered.length} remembered  ·  drag or scroll`, { size: 20, italic: true, color: CSS.creamDim }).setOrigin(0.5));

    const area = new Phaser.Geom.Rectangle(W / 2 - 540, H / 2 - 270, 1080, 690);
    const list = this.add.container(0, 0);
    c.add(list);
    const rows: { y: number; row: Phaser.GameObjects.Container }[] = [];
    let y = area.y + 30;
    let lastCh = 0;
    ordered.forEach((cin) => {
      const ch = rank(cin.id)[0];
      if (ch !== lastCh) {
        lastCh = ch;
        if (rows.length) y += 14;
        const chap = CHAPTERS.find((x) => x.id === ch);
        list.add(text(this, W / 2 - 500, y, chap ? `CHAPTER ${ch}  ·  ${chap.name.toUpperCase()}` : 'OTHER', { size: 20, font: 'display', color: CSS.goldLight, spacing: 4 }).setOrigin(0, 0.5));
        list.add(this.add.rectangle(W / 2 - 500, y + 22, 1000, 1, C.gold, 0.3).setOrigin(0, 0.5));
        y += 58;
      }
      const seen = saves.hasHint(`cine:${cin.id}`);
      const row = this.add.container(W / 2, y);
      row.add(this.add.rectangle(0, 0, 1000, 62, seen ? 0x1a1820 : 0x0e0e12, 0.92).setStrokeStyle(1.2, C.gold, seen ? 0.45 : 0.12));
      const label = cin.name.replace(/^Chapter [IV]+ · /, '');
      row.add(text(this, -470, 0, seen ? label : '— not yet witnessed —', { size: 26, font: seen ? 'display' : 'body', italic: !seen, color: seen ? CSS.cream : CSS.muted }).setOrigin(0, 0.5));
      if (seen && cin.clock) row.add(text(this, 300, 0, cin.clock, { size: 20, color: CSS.creamDim }).setOrigin(0.5));
      if (seen) {
        row.add(text(this, 470, 0, 'Replay  ▸', { size: 22, italic: true, color: CSS.goldLight }).setOrigin(1, 0.5));
        row.setSize(1000, 62).setInteractive({ useHandCursor: true });
        row.on('pointerover', () => row.list[0] instanceof Phaser.GameObjects.Rectangle && (row.list[0] as Phaser.GameObjects.Rectangle).setFillStyle(0x2a2430, 0.95));
        row.on('pointerout', () => row.list[0] instanceof Phaser.GameObjects.Rectangle && (row.list[0] as Phaser.GameObjects.Rectangle).setFillStyle(0x1a1820, 0.92));
      }
      rows.push({ y, row });
      list.add(row);
      y += 72;
    });
    const scroll = scrollable(this, list, area, y - area.y + 20);
    for (const { y: ry, row } of rows) {
      row.on('pointerup', () => {
        // Hidden rows (scrolled out of the window) and drag releases never start a replay.
        if (scroll.wasDrag() || !scroll.visible(list.y + ry) || !c.active) return;
        audio.sfx('tap');
        const id = ordered[rows.findIndex((r) => r.row === row)].id;
        goTo(this, 'Cinematic', { ids: [id], next: { scene: 'Story', data: { mode: 'story' } } });
      });
    }
  }

  // ------------------------------------------------------------------ modes

  /** Bottom tab bar, as in the reference: Story · Resource · Insight. */
  private tabBar(): void {
    const tabs: [Mode, string, string, string][] = [['story', 'Story', 'story', 'books'], ['resource', 'Supplies', 'shop', 'key'], ['insight', 'Kindling', 'eye', 'lantern']];
    const bar = this.add.container(W / 2, H - 46).setDepth(95);
    const light = this.mode !== 'story' && !this.family;
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, light ? 0.18 : 0.7, light ? 0.18 : 0.7).fillRect(-W / 2, -60, W, 106);
    bar.add(g);
    tabs.forEach(([m, label, icon, art], i) => {
      const x = (i - 1) * 190;
      const on = m === this.mode;
      const col = light ? (on ? '#3f7a4a' : '#5a4a36') : on ? CSS.amber : CSS.cream;
      const t = this.add.container(x, 0);
      const painted = dropIn(this, 'ui', `motif_${art}`);
      if (painted) {
        // Painted emblem on a soft disc; the active tab glows, the others rest a little smaller.
        t.add(this.add.circle(0, -16, 30, light ? 0xf6eedc : 0x0b0c10, light ? 0.55 : 0.35));
        if (on) t.add(this.add.image(0, -16, 'fx:glow').setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(110, 110).setAlpha(0.45));
        t.add(this.add.image(0, -16, painted).setDisplaySize(on ? 58 : 50, on ? 58 : 50).setAlpha(on ? 1 : 0.85));
      } else {
        t.add(this.add.image(0, -14, `icon:${icon}`).setDisplaySize(40, 40).setTint(Phaser.Display.Color.HexStringToColor(col).color));
      }
      t.add(text(this, 0, 26, label, { size: 22, color: col, bold: on }).setOrigin(0.5));
      if (on) t.add(this.add.rectangle(0, 44, 90, 3, C.amber, 1));
      t.setSize(170, 90).setInteractive({ useHandCursor: true });
      softPress(t, () => {
        if (on && !this.family) return;
        this.scene.restart({ mode: m, family: null });
      }, 'tap', 1.06);
      bar.add(t);
    });
  }

  /** Trial families as torn photographs over vinyl records, on a pale sketch-paper desk. */
  private renderCards(): void {
    const save = saves.get();
    // An old cartographer's desk: aged paper, foxing, a faded map grid and coffee rings.
    if (!this.textures.exists('ui:deskPaper')) this.textures.addCanvas('ui:deskPaper', deskPaperCanvas());
    this.add.image(W / 2, H / 2, 'ui:deskPaper');
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }).setDepth(90);
    text(this, W - 70, 70, this.mode === 'resource' ? 'SUPPLIES' : 'KINDLING', { size: 40, font: 'display', bold: true, color: '#3a342c', spacing: 10 }).setOrigin(1, 0.5);
    text(this, W - 70, 116, this.mode === 'resource' ? 'Wick Dust and Brass Sovereigns, for levelling up' : 'Materials for Kindling your Luminaries', { size: 22, italic: true, color: '#6a6458' }).setOrigin(1, 0.5);
    const fams = TRIAL_FAMILIES.filter((f) => f.mode === this.mode);
    const gap = fams.length > 2 ? 460 : 660;
    const sc = fams.length > 2 ? 0.78 : 1.05;
    fams.forEach((f, i) => {
      // The card's visual centre sits ~43 px right of its origin (dial to the right of the photo).
      const x = W / 2 + (i - (fams.length - 1) / 2) * gap - 43 * sc;
      const card = this.trialCard(f, x, 470, sc);
      card.setAlpha(0).setY(530);
      this.tweens.add({ targets: card, alpha: 1, y: 500, duration: 500, delay: i * 90, ease: 'Cubic.easeOut' });
    });
    const owned = (id: string) => formatQty(save.items[id as ItemId] ?? 0);
    const strip = fams.map((f) => `${ITEMS[f.item as ItemId].name}: ${owned(f.item)}`).join('    ·    ');
    text(this, W / 2, 900, strip, { size: 22, color: '#4a443a' }).setOrigin(0.5);
  }

  private trialCard(f: TrialFamily, x: number, y: number, s: number): Phaser.GameObjects.Container {
    const save = saves.get();
    const levels = trialsOf(f.id);
    const open = trialUnlocked(save, levels[0]);
    const done = levels.filter((t) => trialCleared(save, t)).length;
    const c = this.add.container(x, y).setScale(s);
    // The ornate tower clock behind the photo, keeping real time with hand-made Breguet hands.
    // (A locked trial's clock stands still at the thirteenth hour.)
    const ornate = dropIn(this, 'ui', 'clock_ornate');
    const R = 130; // radius of the numeral ring at this size
    const ox = 150; // dial centre: up and right, clear of the photo
    const oy = -60;
    if (ornate) {
      c.add(this.add.image(ox, oy, ornate).setDisplaySize(R / 0.33, R / 0.33).setTint(open ? 0xffffff : 0x9a948a));
    } else {
      const dial = this.add.graphics();
      dial.fillStyle(0x2a2016, 1).fillCircle(0, 0, 190);
      dial.fillStyle(0xd8c49a, 1).fillCircle(0, 0, 176);
      dial.setPosition(ox, oy);
      c.add(dial);
    }
    if (!this.textures.exists('ui:vHour')) {
      this.textures.addCanvas('ui:vHour', vintageHandCanvas('hour', 74));
      this.textures.addCanvas('ui:vMin', vintageHandCanvas('minute', 106));
      this.textures.addCanvas('ui:vSec', vintageHandCanvas('second', 112));
    }
    const mk = (key: string, len: number) => {
      const t = this.textures.get(key).getSourceImage();
      return this.add.image(ox, oy - 3, key).setOrigin(0.5, len / t.height);
    };
    const hands = [mk('ui:vHour', 74), mk('ui:vMin', 106), mk('ui:vSec', 112)];
    c.add(hands);
    c.add(this.add.circle(ox, oy - 3, 7, 0xd6b264).setStrokeStyle(2, 0x3a2410));
    const setTime = () => {
      if (!open) {
        hands.forEach((h) => h.setAngle(15));
        return;
      }
      const d = new Date();
      const sec = d.getSeconds();
      const min = d.getMinutes() + sec / 60;
      hands[0].setAngle(((d.getHours() % 12) + min / 60) * 30);
      hands[1].setAngle(min * 6);
      hands[2].setAngle(sec * 6);
    };
    setTime();
    if (open) this.time.addEvent({ delay: 1000, loop: true, callback: setTime });
    // The photograph.
    const photo = this.add.container(-60, 50).setAngle(-2.5);
    photo.add(this.add.rectangle(4, 8, 400, 320, 0x000000, 0.25));
    photo.add(this.add.rectangle(0, 0, 400, 320, 0xf6f2ea));
    const img = this.add.image(0, 10, ensureBg(this, f.bg));
    img.setScale(Math.max(372 / img.width, 262 / img.height));
    img.setCrop((img.width - 372 / img.scaleX) / 2, (img.height - 262 / img.scaleY) / 2, 372 / img.scaleX, 262 / img.scaleY);
    photo.add(img);
    photo.add(this.add.rectangle(0, 10, 372, 262, 0x000000, open ? 0.05 : 0.55));
    const code = text(this, 176, -136, f.code, { size: 22, font: 'letter', italic: true, color: '#2a1d10' }).setOrigin(1, 0.5);
    photo.add(this.add.rectangle(188, -136, code.width + 26, 34, 0xf2e6c8, 0.95).setOrigin(1, 0.5).setAngle(2));
    photo.add(code);
    c.add(photo);
    // Title on a typed paper label, pinned askew across the photo's lower edge (no outlines).
    const label = this.add.container(-60, 244).setAngle(-1.5);
    const nm = text(this, 0, -12, f.name, { size: 36, font: 'display', bold: true, color: '#241a0e' }).setOrigin(0.5);
    const sub = text(this, 0, 22, open ? `Cleared ${done} / ${levels.length}` : `Opens after Story ${levels[0].requires}`, { size: 19, italic: true, color: open ? '#5a4632' : '#8a3a2a' }).setOrigin(0.5);
    const lw = Math.max(nm.width, sub.width) + 56;
    label.add(this.add.rectangle(3, 4, lw, 82, 0x000000, 0.18));
    label.add(this.add.rectangle(0, 0, lw, 82, 0xf2e8d0).setStrokeStyle(1, 0x8a6a3a, 0.5));
    label.add(this.add.rectangle(0, 2, lw - 24, 1, 0x8a6a3a, 0.4));
    label.add(this.add.circle(-lw / 2 + 14, -26, 5, 0x3c6e45));
    label.add([nm, sub]);
    c.add(label);
    // Item medallion.
    c.add(this.add.circle(262, 100, 56, 0x1a1a1e, 0.95).setStrokeStyle(3, 0xc8a24a, 0.9));
    c.add(this.add.image(262, 100, `item:${f.item}`).setDisplaySize(90, 90));
    if (!open) c.add(this.add.image(-60, 60, 'icon:lock').setDisplaySize(70, 70).setTint(0xf6f2ea));
    c.setSize(520, 460).setInteractive({ useHandCursor: true });
    softPress(c, () => {
      if (!open) {
        audio.sfx('deny');
        return;
      }
      this.scene.restart({ mode: this.mode, family: f.id });
    }, 'tap', 1.03);
    return c;
  }

  /** One family: its backdrop, a level line along the bottom and a detail panel on the right. */
  private renderFamily(f: TrialFamily, pick: StageDef | null): void {
    const save = saves.get();
    const levels = trialsOf(f.id);
    const sel = pick ?? [...levels].reverse().find((t) => trialUnlocked(save, t)) ?? levels[0];
    this.add.image(W / 2, H / 2, ensureBg(this, f.bg)).setDisplaySize(W, H);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.55, 0.1, 0.55).fillRect(0, 0, W, H);
    shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8).fillRect(0, H - 360, W, 360);
    new Atmosphere(this, { depth: 40, fireflies: 3 });
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => this.scene.restart({ mode: this.mode, family: null }) }).setDepth(90);
    // Level line.
    const y = 880;
    const x0 = 160;
    const gap = Math.min(300, (1300 - x0) / Math.max(1, levels.length - 1));
    this.add.rectangle(x0 - 40, y + 46, gap * (levels.length - 1) + 80, 1, 0xe8dcc0, 0.4).setOrigin(0, 0.5).setDepth(50);
    levels.forEach((t, i) => {
      const x = x0 + i * gap;
      const open = trialUnlocked(save, t);
      const on = t.id === sel.id;
      const c = this.add.container(x, y).setDepth(55);
      c.add(text(this, 0, -26, String(t.index).padStart(2, '0'), { size: on ? 40 : 30, font: 'display', color: on ? '#fff4e4' : open ? CSS.cream : CSS.muted }).setOrigin(0, 0.5));
      c.add(text(this, 52, -30, '✦', { size: 20, color: trialCleared(save, t) ? CSS.amber : '#5a5a62' }).setOrigin(0, 0.5));
      c.add(text(this, 0, 14, open ? t.name : `Opens after ${t.requires}`, { size: on ? 26 : 22, color: on ? '#fff4e4' : open ? CSS.creamDim : CSS.muted }).setOrigin(0, 0.5));
      if (on) c.add(this.add.circle(18, 46, 7, C.amber, 1));
      c.setSize(260, 100).setInteractive({ useHandCursor: true });
      c.input!.hitArea.setTo(130, 0, 260, 100);
      softPress(c, () => {
        if (!open) {
          audio.sfx('deny');
          return;
        }
        this.scene.restart({ mode: this.mode, family: f.id, stageId: t.id });
      }, 'tap', 1.04);
    });
    // Detail panel (right), as the reference's stage card.
    const px = W - 60;
    const d = this.add.container(0, 0).setDepth(60);
    d.add(text(this, px, 120, `No. ${String(sel.index).padStart(2, '0')}`, { size: 34, font: 'display', color: CSS.cream }).setOrigin(1, 0.5));
    d.add(text(this, px, 190, sel.name, { size: 60, font: 'display', color: CSS.cream, shadow: true }).setOrigin(1, 0.5));
    const rec = fromLegacyLevel(sel.level, 4);
    const rl = text(this, px - 520, 262, 'Recommended:', { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5);
    d.add(rl);
    d.add(text(this, px - 520 + rl.width + 12, 262, `${insightLabel(rec.insight)} Level ${rec.level}`, { size: 24, color: '#9fd27a' }).setOrigin(0, 0.5));
    d.add(text(this, px - 520, 300, f.blurb, { size: 24, color: CSS.cream, wrap: 520, lineSpacing: 4 }));
    d.add(text(this, px - 520, 470, 'Rewards:', { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5));
    const first = !trialCleared(save, sel);
    Object.entries(sel.drops ?? {}).forEach(([id, n], i) => {
      const ix = px - 360 + i * 130;
      d.add(this.add.rectangle(ix, 470, 104, 104, 0x14161c, 0.8).setStrokeStyle(1, 0xe8dcc0, 0.4));
      d.add(this.add.image(ix, 462, `item:${id}`).setDisplaySize(78, 78));
      d.add(text(this, ix, 506, formatQty(Math.round(n * (first ? 1.5 : 1))), { size: 20, bold: true, color: CSS.cream, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5));
      if (first && i === 0) d.add(text(this, ix, 408, 'First ×1.5', { size: 18, bold: true, color: '#ffb08a' }).setOrigin(0.5));
    });
    const ids = [...new Set(sel.waves.flat())];
    d.add(text(this, px - 520, 590, 'Enemies:', { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5));
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const ex = px - 340 + i * 96;
      d.add(this.add.circle(ex, 590, 40, 0x1a1c22, 0.85).setStrokeStyle(1, 0xe8dcc0, 0.3));
      const im = this.add.image(ex, 590, `enemy:${e.kind}`);
      im.setScale(Math.min(70 / im.height, 70 / im.width));
      d.add(im);
    });
    const start = new Button(this, px - 200, 700, { w: 400, h: 84, label: 'Start', style: 'amber', size: 36, onClick: () => goToStage(this, sel.id) });
    d.add(start);
  }
}
