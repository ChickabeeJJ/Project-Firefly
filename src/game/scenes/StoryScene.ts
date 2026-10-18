import Phaser from 'phaser';
import { ensureBg } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getEnemy } from '../data/enemies';
import { CHAPTERS, STAGES, getStage } from '../data/stages';
import type { StageDef } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { frontierStage, isUnlocked, REWARDS, trialCleared, trialUnlocked } from '../systems/progression';
import { TRIAL_FAMILIES, trialsOf, type TrialFamily } from '../data/trials';
import { formatQty, fromLegacyLevel, insightLabel, ITEMS, type ItemId, stageItems } from '../systems/growth';
import { CINEMATICS } from '../data/story';
import { goToStage } from '../systems/storyFlow';
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
          tl.add(this.add.image(x + (k - 1) * 30, y - size - 26, 'icon:star4').setDisplaySize(26, 26).setTint(k < save.stars[s.id] ? 0xf26b3a : 0x3a3a42));
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

  private renderDetail(): void {
    this.detail?.destroy();
    const s = this.selected;
    const save = saves.get();
    const c = this.add.container(W / 2, 800).setDepth(60);
    const w = 1500;
    c.add(this.add.nineslice(0, 0, 'ui:paper', undefined, w, 330, 16, 16, 16, 16));
    const lx = -w / 2 + 50;
    c.add(text(this, lx, -122, `${s.id}${s.boss ? '  ·  BOSS' : ''}`, { size: 28, font: 'display', bold: true, color: s.boss ? '#a8322a' : CSS.paperSub, spacing: 3 }));
    c.add(text(this, lx, -82, s.name, { size: 50, font: 'display', bold: true, color: CSS.paperText }));
    const rec = fromLegacyLevel(s.level, 4);
    c.add(text(this, lx, -12, `Recommended ${insightLabel(rec.insight)} Lv ${rec.level}   ·   Round limit ${s.roundLimit}   ·   ${s.waves.length} wave${s.waves.length > 1 ? 's' : ''}`, { size: 26, color: CSS.paperSub }));
    const cleared = s.id in save.stars;
    const reward = cleared ? `+${REWARDS.repeatClear} Glimmer` : `+${REWARDS.firstClear} Glimmer first clear (+${REWARDS.perfectBonus} for ★★★)`;
    c.add(this.add.image(lx + 20, 44, 'icon:glimmer').setDisplaySize(40, 40));
    const rt = text(this, lx + 50, 44, reward, { size: 26, color: CSS.paperText }).setOrigin(0, 0.5);
    c.add(rt);
    let ix = lx + 50 + rt.width + 40;
    for (const [id, n] of Object.entries(stageItems(s.level, s.chapter, !cleared, false))) {
      c.add(this.add.image(ix, 44, `item:${id}`).setDisplaySize(46, 46));
      const q = text(this, ix + 26, 44, `×${formatQty(n as number)}`, { size: 22, bold: true, color: CSS.paperText }).setOrigin(0, 0.5);
      c.add(q);
      ix += 26 + q.width + 26;
    }
    const goals = `★ Win   ★ Within ${s.starRounds} rounds   ★ No one falls`;
    c.add(text(this, lx, 90, goals, { size: 26, color: '#9a5a2a' }));
    if (s.rule) {
      c.add(text(this, lx + 620, -122, s.rule === 'fireflyBloom' ? '✦ Firefly Bloom: two fireflies per round' : '✦ Restless Dim: enemies start with 2 Ardor', { size: 24, italic: true, color: '#6a7a2a' }));
    }

    // Enemy line-up
    const ids = [...new Set(s.waves.flat())];
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const ex = 230 + i * 140;
      const img = this.add.image(ex, 30, `enemy:${e.kind}`).setOrigin(0.5, 1);
      img.setScale(Math.min(120 / img.height, 120 / img.width));
      c.add(this.add.circle(ex, -30, 66, 0x1a1c22, 0.85));
      c.add(img);
      c.add(this.add.image(ex + 46, -80, `icon:${e.mood}`).setDisplaySize(34, 34));
      const lbl = text(this, ex, 50, e.name.replace(/^The /, ''), { size: 20, color: CSS.paperSub }).setOrigin(0.5);
      if (lbl.width > 128) lbl.setScale(128 / lbl.width);
      c.add(lbl);
    });

    const start = new Button(this, w / 2 - 170, 104, {
      w: 280, h: 80, label: 'Begin', style: 'amber', size: 36, onClick: () => void this.begin(s),
    });
    c.add(start);

    this.detail = c;
  }

  private async begin(s: StageDef): Promise<void> {
    goToStage(this, s.id);
  }

  /** Archive of story cinematics already watched, to replay at will. */
  private openMemories(): void {
    const c = this.add.container(0, 0).setDepth(3000);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.85).setInteractive();
    const panel = this.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, 1100, 820, 14, 14, 14, 14);
    const title = text(this, W / 2, H / 2 - 360, 'MEMORIES', { size: 48, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0.5);
    c.add([dim, panel, title, ornament(this, W / 2, H / 2 - 312, 520)]);
    const close = () => c.destroy();
    dim.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Math.abs(p.x - W / 2) > 550 || Math.abs(p.y - H / 2) > 410) close();
    });
    c.add(new Button(this, W / 2 + 490, H / 2 - 360, { w: 64, h: 64, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: close }));
    const list = this.add.container(0, 0);
    c.add(list);
    const scroll = scrollable(this, list, new Phaser.Geom.Rectangle(W / 2 - 500, H / 2 - 290, 1000, 680), CINEMATICS.length * 76 + 20);
    CINEMATICS.forEach((cin, i) => {
      const y = H / 2 - 250 + i * 76;
      const seen = saves.hasHint(`cine:${cin.id}`);
      const row = this.add.container(W / 2, y);
      row.add(this.add.rectangle(0, 0, 960, 64, seen ? 0x1a1820 : 0x101014, 0.9).setStrokeStyle(1.5, C.gold, seen ? 0.5 : 0.15));
      row.add(text(this, -450, 0, seen ? cin.name : '— not yet witnessed —', { size: 28, font: 'display', bold: seen, color: seen ? CSS.cream : CSS.muted }).setOrigin(0, 0.5));
      if (seen) {
        row.add(text(this, 450, 0, 'Replay ▸', { size: 24, italic: true, color: CSS.goldLight }).setOrigin(1, 0.5));
        row.setSize(960, 64).setInteractive({ useHandCursor: true });
        row.on('pointerup', () => {
          if (scroll.wasDrag() || !scroll.visible(list.y + y)) return;
          audio.sfx('tap');
          goTo(this, 'Cinematic', { ids: [cin.id], next: { scene: 'Story' } });
        });
      }
      list.add(row);
    });
  }

  // ------------------------------------------------------------------ modes

  /** Bottom tab bar, as in the reference: Story · Resource · Insight. */
  private tabBar(): void {
    const tabs: [Mode, string, string][] = [['story', 'Story', 'story'], ['resource', 'Resource', 'shop'], ['insight', 'Insight', 'eye']];
    const bar = this.add.container(W / 2, H - 46).setDepth(95);
    const light = this.mode !== 'story' && !this.family;
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, light ? 0.18 : 0.7, light ? 0.18 : 0.7).fillRect(-W / 2, -60, W, 106);
    bar.add(g);
    tabs.forEach(([m, label, icon], i) => {
      const x = (i - 1) * 190;
      const on = m === this.mode;
      const col = light ? (on ? '#c8501e' : '#3a342c') : on ? CSS.amber : CSS.cream;
      const t = this.add.container(x, 0);
      t.add(this.add.image(0, -14, `icon:${icon}`).setDisplaySize(40, 40).setTint(Phaser.Display.Color.HexStringToColor(col).color));
      t.add(text(this, 0, 20, label, { size: 22, color: col }).setOrigin(0.5));
      if (on) t.add(this.add.rectangle(0, 40, 110, 4, C.amber, 1));
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
    this.add.rectangle(W / 2, H / 2, W, H, 0xdedad2);
    const sk = this.add.graphics();
    sk.lineStyle(1, 0x8a8478, 0.18);
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      sk.lineBetween(x, y, x + 80 + Math.random() * 220, y + (Math.random() - 0.5) * 60);
    }
    const vg = this.add.graphics();
    vg.fillGradientStyle(0x6a6458, 0x6a6458, 0x6a6458, 0x6a6458, 0.0, 0.0, 0.35, 0.35).fillRect(0, H * 0.55, W, H * 0.45);
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }).setDepth(90);
    text(this, W - 70, 70, this.mode === 'resource' ? 'RESOURCE' : 'INSIGHT', { size: 40, font: 'display', bold: true, color: '#3a342c', spacing: 10 }).setOrigin(1, 0.5);
    text(this, W - 70, 116, this.mode === 'resource' ? 'Wick Dust and Brass Sovereigns, for levelling up' : 'Materials for raising Insight', { size: 22, italic: true, color: '#6a6458' }).setOrigin(1, 0.5);
    const fams = TRIAL_FAMILIES.filter((f) => f.mode === this.mode);
    const gap = fams.length > 2 ? 450 : 640;
    fams.forEach((f, i) => {
      const x = W / 2 + (i - (fams.length - 1) / 2) * gap;
      const card = this.trialCard(f, x, 500, fams.length > 2 ? 0.86 : 1.05);
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
    // Vinyl record behind the photo.
    const rec = this.add.graphics();
    rec.fillStyle(0x0c0c0e, 1).fillCircle(0, 0, 190);
    rec.lineStyle(1, 0x2a2a2e, 0.9);
    for (let r = 60; r < 186; r += 9) rec.strokeCircle(0, 0, r);
    rec.fillStyle(0xc8501e, 1).fillCircle(0, 0, 46);
    rec.fillStyle(0x0c0c0e, 1).fillCircle(0, 0, 6);
    c.add(rec);
    if (open) this.tweens.add({ targets: rec, angle: 360, duration: 9000, repeat: -1 });
    rec.setPosition(120, 10);
    // The photograph.
    const photo = this.add.container(-40, 20).setAngle(-2.5);
    photo.add(this.add.rectangle(4, 8, 400, 320, 0x000000, 0.25));
    photo.add(this.add.rectangle(0, 0, 400, 320, 0xf6f2ea));
    const img = this.add.image(0, 10, ensureBg(this, f.bg));
    img.setScale(Math.max(372 / img.width, 262 / img.height));
    img.setCrop((img.width - 372 / img.scaleX) / 2, (img.height - 262 / img.scaleY) / 2, 372 / img.scaleX, 262 / img.scaleY);
    photo.add(img);
    photo.add(this.add.rectangle(0, 10, 372, 262, 0x000000, open ? 0.05 : 0.55));
    const code = text(this, 176, -136, f.code, { size: 24, font: 'display', bold: true, color: '#141414' }).setOrigin(1, 0.5);
    photo.add(this.add.rectangle(188, -136, code.width + 26, 34, 0xffffff, 0.92).setOrigin(1, 0.5));
    photo.add(code);
    c.add(photo);
    // Title, overlapping the photo's left edge.
    const words = f.name.split(' ');
    const t1 = text(this, -250, -150, words[0], { size: 54, font: 'display', bold: true, color: '#141414', stroke: '#f6f2ea', strokeThickness: 8 });
    const t2 = text(this, -210, -92, `× ${words.slice(1).join(' ')}`, { size: 42, font: 'display', bold: true, color: '#141414', stroke: '#f6f2ea', strokeThickness: 8 });
    c.add([t1, t2]);
    // Item medallion.
    c.add(this.add.circle(150, 150, 62, 0x1a1a1e, 0.95).setStrokeStyle(3, 0xc8a24a, 0.9));
    c.add(this.add.image(150, 150, `item:${f.item}`).setDisplaySize(100, 100));
    c.add(text(this, -40, 216, open ? `Cleared ${done} / ${levels.length}` : `Opens after Story ${levels[0].requires}`, { size: 24, bold: true, color: open ? '#3a342c' : '#8a3a2a' }).setOrigin(0.5));
    if (!open) c.add(this.add.image(-40, 30, 'icon:lock').setDisplaySize(70, 70).setTint(0xf6f2ea));
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
    d.add(text(this, px, 120, `LP ${String(sel.index).padStart(2, '0')}`, { size: 34, font: 'display', color: CSS.cream }).setOrigin(1, 0.5));
    d.add(text(this, px, 190, sel.name, { size: 60, font: 'display', color: CSS.cream, shadow: true }).setOrigin(1, 0.5));
    const rec = fromLegacyLevel(sel.level, 4);
    const rl = text(this, px - 520, 262, 'Recommended:', { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5);
    d.add(rl);
    d.add(text(this, px - 520 + rl.width + 12, 262, `${insightLabel(rec.insight)} Level ${rec.level}`, { size: 24, color: '#f26b3a' }).setOrigin(0, 0.5));
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
