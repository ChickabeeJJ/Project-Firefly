import Phaser from 'phaser';
import { PCARD_H, PCARD_W } from '../art/cardArt';
import { elementPanel, ensureBg, ensurePortrait, panelFor } from '../art/registry';
import { dropIn } from '../art/assets';
import { audio } from '../audio/AudioController';
import { describeVerse, TYPE_LABEL } from '../battle/describe';
import { MAX_RESONANCE } from '../battle/rules';
import { allyStats } from '../battle/stats';
import type { Card } from '../battle/types';
import { CHARACTERS, getCharacter } from '../data/characters';
import { BIOS } from '../data/story';
import type { BioSection, CharacterDef } from '../data/types';
import { C, CSS, H, MOOD_CSS, MOOD_NAME, RARITY_CSS, TYPE_CSS, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { affordable, effectiveLevel, formatQty, insightCost, insightLabel, insightState, ITEMS, type ItemId, levelCap, levelCost, levelUp, maxAffordableLevel, maxInsight, raiseInsight } from '../systems/growth';
import { CardView } from '../ui/CardView';
import { Atmosphere, Button, fadeIn, goTo, ornament, rarityStars, scrollable, text, toast } from '../ui/kit';
import { livingPortrait } from '../ui/LivingSprite';
import { PortraitCard } from '../ui/PortraitCard';

const COLS = 6;
const CARD_SCALE = 0.9;
const GAP = 26;

/** Text tab with an underline when active (the reference's Level / Rarity tabs). */
function tab(scene: Phaser.Scene, x: number, y: number, label: string, active: boolean, onClick: () => void): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const t = text(scene, 0, 0, label, { size: 28, font: 'display', bold: active, color: active ? CSS.amber : CSS.creamDim, spacing: 2 }).setOrigin(0.5);
  c.add(t);
  if (active) c.add(scene.add.rectangle(0, 26, t.width + 30, 3, C.amber));
  c.setSize(t.width + 40, 56).setInteractive({ useHandCursor: true });
  c.on('pointerup', () => {
    audio.sfx('tap');
    onClick();
  });
  return c;
}

function backButton(scene: Phaser.Scene, onClick: () => void): Phaser.GameObjects.Container {
  const c = scene.add.container(64, 60);
  c.add([scene.add.circle(0, 0, 32, 0x0c0e11, 0.5).setStrokeStyle(1.5, 0xe8dcc0, 0.4), scene.add.image(0, 0, 'icon:back').setDisplaySize(34, 34)]);
  c.setSize(76, 76).setInteractive({ useHandCursor: true });
  c.on('pointerup', () => {
    audio.sfx('back');
    onClick();
  });
  return c;
}

function fallbackBio(c: CharacterDef): BioSection[] {
  return [{ title: c.title.replace(/^The /, ''), text: `${c.name}, ${c.title.toLowerCase()}. A ${MOOD_NAME[c.mood]} ${c.role.toLowerCase()} who answered the Lantern Rite.\n\n“${c.quote}”` }];
}

/** The Troupe: collection grid, character page (stats, verses, quote) and dossier. */
export class RosterScene extends Phaser.Scene {
  private sort: 'rarity' | 'level' = 'level';
  private page?: Phaser.GameObjects.Container;
  private statRows: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Roster');
  }

  create(data: { sort?: 'rarity' | 'level' } = {}): void {
    fadeIn(this);
    this.sort = data.sort ?? this.sort;
    this.page = undefined;
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x07080a, 0.82);
    new Atmosphere(this, { depth: 40, fireflies: 3 });
    this.add.existing(backButton(this, () => goTo(this, 'Lobby'))).setDepth(90);
    text(this, 116, 60, 'THE TROUPE', { size: 34, font: 'display', bold: true, color: CSS.cream, spacing: 8 }).setOrigin(0, 0.5);
    tab(this, W / 2 - 90, 60, 'Level', this.sort === 'level', () => this.scene.restart({ sort: 'level' }));
    tab(this, W / 2 + 90, 60, 'Rarity', this.sort === 'rarity', () => this.scene.restart({ sort: 'rarity' }));
    this.add.rectangle(W / 2, 104, W - 120, 1, C.gold, 0.25);
    this.renderGrid();
    audio.play('lobby');
  }

  private renderGrid(): void {
    const save = saves.get();
    const list = [...CHARACTERS].sort((a, b) => {
      const oa = save.roster[a.id];
      const ob = save.roster[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      if (this.sort === 'level' && oa && ob && oa.level !== ob.level) return ob.level - oa.level;
      return b.rarity - a.rarity || a.name.localeCompare(b.name);
    });
    // Six to a row across the full width; the grid scrolls (drag or wheel) when it runs long.
    const cw = PCARD_W * CARD_SCALE;
    const ch = PCARD_H * CARD_SCALE;
    const x0 = (W - (COLS * cw + (COLS - 1) * GAP)) / 2 + cw / 2;
    const top = 130;
    const grid = this.add.container(0, 0);
    const rows = Math.ceil(list.length / COLS);
    const scroll = scrollable(this, grid, new Phaser.Geom.Rectangle(0, 112, W, H - 112 - 84), rows * (ch + GAP) + 40);
    list.forEach((c, i) => {
      const o = save.roster[c.id];
      const x = x0 + (i % COLS) * (cw + GAP);
      const y = top + ch / 2 + Math.floor(i / COLS) * (ch + GAP);
      const team = save.team.indexOf(c.id);
      const card = new PortraitCard(this, x, y, c.id, { level: o?.level, locked: !o, slot: team >= 0 ? team + 1 : undefined }).setScale(CARD_SCALE);
      grid.add(card);
      if (o) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setScale(CARD_SCALE * 1.03));
        card.on('pointerout', () => card.setScale(CARD_SCALE));
        card.on('pointerup', () => {
          if (scroll.wasDrag()) return;
          audio.sfx('tap');
          this.openCharacter(c.id);
        });
      }
    });
    text(this, W / 2, H - 46, `${Object.keys(save.roster).length} of ${CHARACTERS.length} Luminaries found — the rest answer at the Lantern Rite`, { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0.5);
  }

  // ===================================================================== character page

  private openCharacter(id: string, view: 'overview' | 'dossier' = 'overview', reopen?: 'levelup'): void {
    this.page?.destroy();
    const c = getCharacter(id);
    const p = this.add.container(0, 0).setDepth(200);
    this.page = p;
    const tint = Phaser.Display.Color.HexStringToColor(c.palette.primary).color;
    p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0b0e, 1).setInteractive());
    // Full-screen element backdrop (ui/charbg_<element>), falling back to the card panel.
    const panel = dropIn(this, 'ui', `charbg_${panelFor(id)}`) ?? elementPanel(this, id);
    if (panel) {
      const bgImg = this.add.image(W / 2, H / 2, panel);
      bgImg.setScale(Math.max(W / bgImg.width, H / bgImg.height)).setAlpha(panel.includes('charbg_') ? 0.85 : 0.3);
      p.add(bgImg);
      p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0b0e, 0.28));
    }
    p.add(this.add.image(940, 560, 'fx:glow').setTint(tint).setDisplaySize(1300, 1100).setAlpha(0.42));
    p.add(text(this, W - 40, 150, view === 'dossier' ? 'DOSSIER' : 'DOCUMENT', { size: 150, font: 'display', bold: true, color: '#ffffff', spacing: 20 }).setOrigin(1, 0.5).setAlpha(0.035));
    p.add(backButton(this, () => {
      p.destroy();
      this.page = undefined;
    }));
    p.add(tab(this, 230, 60, 'Overview', view === 'overview', () => this.openCharacter(id, 'overview')));
    p.add(tab(this, 400, 60, 'Dossier', view === 'dossier', () => this.openCharacter(id, 'dossier')));
    if (view === 'overview') {
      this.overview(p, c);
      if (reopen === 'levelup') this.openLevelUp(p, c, this.statRows, false);
    }
    else this.dossier(p, c);
  }

  private overview(p: Phaser.GameObjects.Container, c: CharacterDef): void {
    const save = saves.get();
    const o = save.roster[c.id];
    const st = allyStats(c.base, effectiveLevel(o), o.resonance);

    p.add(livingPortrait(this, 930, H + 30, ensurePortrait(this, c.id), 0.9, 1080, 1180));

    // ---- left: identity + stats
    const lx = 70;
    p.add(this.add.image(lx + 56, 190, `icon:${c.mood}`).setDisplaySize(112, 112));
    p.add(text(this, lx + 56, 262, MOOD_NAME[c.mood], { size: 22, italic: true, color: MOOD_CSS[c.mood] }).setOrigin(0.5));
    p.add(rarityStars(this, lx + 220, 152, c.rarity, 30, Phaser.Display.Color.HexStringToColor(RARITY_CSS[c.rarity]).color));
    const nm = text(this, lx + 136, 176, c.name, { size: 50, font: 'display', bold: true, color: CSS.cream, shadow: true });
    if (nm.width > 470) nm.setScale(470 / nm.width);
    p.add(nm);
    p.add(text(this, lx + 138, 240, c.title, { size: 26, italic: true, color: CSS.creamDim }));
    [c.role, MOOD_NAME[c.mood], `${c.rarity}★`].forEach((tag, i) => {
      const tx = lx + 6 + i * 150;
      p.add(this.add.rectangle(tx, 320, 138, 44, 0x16151a, 0.9).setOrigin(0, 0.5).setStrokeStyle(1, 0xe8dcc0, 0.25));
      p.add(text(this, tx + 69, 320, tag, { size: 22, color: CSS.cream }).setOrigin(0.5));
    });
    p.add(text(this, lx, 392, 'Personal stats  ▸', { size: 28, italic: true, color: CSS.creamDim }));
    p.add(this.add.rectangle(lx, 432, 470, 1, C.gold, 0.35).setOrigin(0, 0.5));
    const statRows: Phaser.GameObjects.Text[] = [];
    ([['heal', 'HP', st.hp], ['attack', 'ATK', st.atk], ['shield', 'DEF', st.def]] as const).forEach(([icon, k, v], i) => {
      const y = 470 + i * 52;
      p.add(this.add.rectangle(lx, y, 470, 44, 0x121116, 0.75).setOrigin(0, 0.5));
      p.add(this.add.image(lx + 26, y, `icon:${icon}`).setDisplaySize(28, 28));
      p.add(text(this, lx + 52, y, k, { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5));
      const vt = text(this, lx + 450, y, v.toLocaleString('en-US'), { size: 26, bold: true, color: CSS.cream }).setOrigin(1, 0.5);
      statRows.push(vt);
      p.add(vt);
    });
    p.add(text(this, lx, 640, `${insightLabel(o.insight)}  ·  Lv ${o.level} / ${levelCap(o.insight)}`, { size: 26, font: 'display', color: CSS.goldLight }));
    const ly = 690;
    p.add(text(this, lx, ly, 'Echo', { size: 24, font: 'display', color: CSS.creamDim }));
    for (let i = 0; i < MAX_RESONANCE; i++) {
      p.add(this.add.image(lx + 180 + i * 40, ly + 14, 'icon:star4').setDisplaySize(30, 30).setTint(i < o.resonance ? 0xb886e0 : 0x3a3a42));
    }
    this.statRows = statRows;

    // ---- right: verses + actions
    const rx = 1420;
    // Level / Insight boxes with "+" buttons (the reference's top-right pair).
    const box = (bx: number, label: string, value: string, sub: string, onClick: () => void, dot: boolean) => {
      const b = this.add.container(bx, 172);
      b.add(this.add.rectangle(0, 0, 214, 84, 0xefe6d2, 0.96).setOrigin(0, 0.5));
      b.add(this.add.rectangle(160, 0, 54, 84, C.amber).setOrigin(0, 0.5));
      b.add(this.add.image(187, 0, 'icon:plus').setDisplaySize(30, 30));
      b.add(text(this, 14, -20, label, { size: 22, font: 'display', color: CSS.paperText }).setOrigin(0, 0.5));
      b.add(this.add.rectangle(14, 2, 132, 1, 0x2a241c, 0.4).setOrigin(0, 0.5));
      const vt = text(this, 14, 22, value, { size: 26, bold: true, color: CSS.paperText }).setOrigin(0, 0.5);
      b.add(vt);
      b.add(text(this, 18 + vt.width, 26, sub, { size: 16, color: CSS.paperSub }).setOrigin(0, 0.5));
      if (dot) b.add(this.add.circle(208, -36, 8, C.danger).setStrokeStyle(2, 0xffffff));
      // Content is drawn from x = 0 (left edge); a container's hit box is centred, so shift it.
      b.setSize(214, 84).setInteractive({ useHandCursor: true });
      b.input!.hitArea.setTo(107, 0, 214, 84);
      b.on('pointerup', () => {
        audio.sfx('tap');
        onClick();
      });
      p.add(b);
    };
    const cap = levelCap(o.insight);
    const ist = insightState(save, c.id);
    box(rx, 'Level', `${o.level}`, `/${cap}`, () => this.openLevelUp(p, c, statRows), o.level < cap && maxAffordableLevel(save, c.id) > o.level);
    box(rx + 228, 'Kindle', ['0', 'I', 'II', 'III'][o.insight], `/${['0', 'I', 'II', 'III'][maxInsight(c.rarity)]}`, () => this.openInsight(p, c), ist === 'ready');
    p.add(text(this, rx, 250, 'Verses', { size: 32, italic: true, bold: true, color: CSS.cream }));
    p.add(this.add.rectangle(rx, 290, 440, 1, C.gold, 0.35).setOrigin(0, 0.5));
    const info = this.add.container(0, 0);
    p.add(info);
    const verses = [...c.verses, c.finale];
    const cards: CardView[] = [];
    const show = (k: number) => {
      info.removeAll(true);
      cards.forEach((cv, j) => cv.setSelected(j === k));
      const v = verses[k];
      const box = this.add.rectangle(rx, 548, 440, 250, 0x121116, 0.85).setOrigin(0, 0).setStrokeStyle(1, 0xe8dcc0, 0.2);
      const t = text(this, rx + 20, 562, v.name, { size: 30, font: 'display', bold: true, color: v.finale ? CSS.gold : CSS.goldLight });
      if (t.width > 400) t.setScale(400 / t.width);
      const ty = text(this, rx + 20, 604, v.finale ? 'Finale' : TYPE_LABEL[v.type], { size: 22, italic: true, color: v.finale ? CSS.gold : TYPE_CSS[v.type] });
      const d = text(this, rx + 20, 638, describeVerse(v, 1), { size: 22, color: CSS.cream, wrap: 400, lineSpacing: 2 });
      info.add([box, t, ty, d]);
    };
    verses.forEach((v, k) => {
      const card: Card = { cid: -1 - k, ownerUid: '', verseId: v.id, rank: 1, lit: false, finale: !!v.finale };
      const cv = new CardView(this, rx + 70 + k * 150, 416, card, c.id).setScale(0.5);
      cv.setInteractive({ useHandCursor: true });
      cv.on('pointerup', () => {
        audio.sfx('tap');
        show(k);
      });
      cards.push(cv);
      p.add(cv);
    });
    show(0);

    const team = save.team.indexOf(c.id);
    // Two compact buttons side by side, set in the book face rather than spaced capitals.
    p.add(new Button(this, rx + 108, 900, {
      w: 212, h: 64, label: team === 0 ? 'Team leader' : 'Make leader', style: team === 0 ? 'dark' : 'amber', size: 27, font: 'body',
      onClick: () => {
        if (team === 0) return;
        if (team > 0) save.team[team] = save.team[0];
        else save.team[2] = save.team[0];
        save.team[0] = c.id;
        saves.commit();
        toast(this, `${c.name.split(' ')[0]} now leads the troupe`, c.mood);
        this.scene.restart({ sort: this.sort });
      },
    }));
    p.add(new Button(this, rx + 332, 900, { w: 212, h: 64, label: 'Read dossier', style: 'cream', size: 27, font: 'body', onClick: () => this.openCharacter(c.id, 'dossier') }));

    // ---- bottom: voice line
    const q = text(this, 930, H - 50, `“${c.quote}”`, { size: 26, italic: true, color: CSS.cream, wrap: 760, align: 'center', shadow: true }).setOrigin(0.5);
    p.add(this.add.rectangle(930, H - 50, Math.min(840, q.width + 80), q.height + 24, 0x000000, 0.55));
    p.add(q);
  }

  // ===================================================================== level up / insight

  /** Cream side panel (the reference's level-up sheet) with a close cross. */
  private sheet(p: Phaser.GameObjects.Container, title: string): Phaser.GameObjects.Container {
    const s = this.add.container(0, 0);
    s.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setInteractive());
    const x0 = 1290;
    const bg = this.add.graphics();
    bg.fillStyle(0xefe6d2, 0.98).fillRect(x0, 100, W - x0, H - 100);
    bg.fillGradientStyle(0xefe6d2, 0xf2b8a0, 0xefe6d2, 0xf2b8a0, 0, 0.55, 0, 0.55).fillRect(x0 + 300, 100, W - x0 - 300, H - 100);
    s.add(bg);
    s.add(this.add.tileSprite(x0 + (W - x0) / 2, H / 2 + 50, W - x0, H - 100, 'fx:grain').setAlpha(0.06));
    s.add(text(this, x0 + 40, 140, title, { size: 34, font: 'display', bold: true, color: CSS.paperText, spacing: 3 }));
    s.add(this.closeCross(W - 54, 146, () => {
      s.destroy();
      this.statRows.forEach((t) => t.setData('preview', null));
    }));
    // currency strip
    const save = saves.get();
    (['dust', 'sovereign'] as ItemId[]).forEach((id, i) => {
      const cx = x0 + 60 + i * 230;
      s.add(this.add.image(cx, H - 60, `item:${id}`).setDisplaySize(52, 52));
      s.add(text(this, cx + 34, H - 60, formatQty(save.items[id]), { size: 24, bold: true, color: CSS.paperText }).setOrigin(0, 0.5));
    });
    p.add(s);
    return s;
  }

  private closeCross(x: number, y: number, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.lineStyle(3, 0x2a241c, 0.9).lineBetween(-14, -14, 14, 14).lineBetween(14, -14, -14, 14);
    c.add(g);
    c.setSize(56, 56).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      audio.sfx('back');
      onClick();
    });
    return c;
  }

  /** Triangle emblem filled to show progress through the current Insight tier. */
  /** Progress lantern: a brass lantern whose glass fills with amber light as the Luminary grows. */
  private lanternGauge(cx: number, cy: number, fill: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const bw = 116;
    const bh = 140;
    const top = cy - bh / 2 + 10;
    // Hanging ring and cap.
    g.lineStyle(4, 0x6a5232, 1).strokeCircle(cx, top - 50, 11);
    g.fillStyle(0x6a5232, 1).fillTriangle(cx - bw / 2 - 12, top - 4, cx + bw / 2 + 12, top - 4, cx, top - 40);
    g.fillStyle(0x8a6c40, 1).fillRect(cx - bw / 2 - 14, top - 8, bw + 28, 10);
    // Glass, then light rising from the wick.
    g.fillStyle(0xe8dfcc, 1).fillRect(cx - bw / 2, top, bw, bh);
    const lh = bh * Phaser.Math.Clamp(fill, 0, 1);
    g.fillGradientStyle(0xffd27a, 0xffd27a, 0xd8742a, 0xd8742a, 0.95, 0.95, 1, 1).fillRect(cx - bw / 2, top + bh - lh, bw, lh);
    // Flame.
    g.fillStyle(0xfff2c8, fill > 0 ? 1 : 0.4).fillEllipse(cx, top + bh - 30, 16, 30);
    // Frame: panes and posts.
    g.lineStyle(4, 0x5a4428, 1).strokeRect(cx - bw / 2, top, bw, bh);
    g.lineStyle(2, 0x5a4428, 0.8).lineBetween(cx - bw / 6, top, cx - bw / 6, top + bh).lineBetween(cx + bw / 6, top, cx + bw / 6, top + bh);
    g.fillStyle(0x8a6c40, 1).fillRect(cx - bw / 2 - 14, top + bh - 2, bw + 28, 12);
    g.fillStyle(0x6a5232, 1).fillRect(cx - bw / 2 + 6, top + bh + 10, bw - 12, 10);
    return g;
  }

  private openLevelUp(p: Phaser.GameObjects.Container, c: CharacterDef, statRows: Phaser.GameObjects.Text[], animate = true): void {
    const save = saves.get();
    const o = save.roster[c.id];
    const cap = levelCap(o.insight);
    const s = this.sheet(p, 'Level Up');
    if (!animate) s.setAlpha(1);
    const cx = 1290 + (W - 1290) / 2;
    s.add(this.lanternGauge(cx, 330, (o.level - 1) / (cap - 1)));
    s.add(text(this, cx, 460, 'Lv', { size: 26, font: 'display', color: CSS.paperText }).setOrigin(0.5));
    s.add(this.add.rectangle(cx, 520, W - 1290 - 60, 1, 0x8a2a2a, 0.6));
    const dial = this.add.container(0, 0);
    s.add(dial);
    let target = Math.min(cap, o.level + 1);
    const best = maxAffordableLevel(save, c.id);
    const costT = this.add.container(0, 0);
    s.add(costT);
    const st0 = allyStats(c.base, effectiveLevel(o), o.resonance);
    // Drag the slider to choose the target level (the dial, arrows and Max still work too).
    // Built once, outside the redrawn dial, so a drag is never interrupted.
    const lo = Math.min(cap, o.level + 1);
    const sx0 = cx - 240;
    const sw = 480;
    const sy = 616;
    const slider = this.add.container(0, 0).setVisible(o.level < cap);
    s.add(slider);
    const bestFrac = cap > lo ? Phaser.Math.Clamp((best - lo) / (cap - lo), 0, 1) : 0;
    slider.add(this.add.rectangle(sx0, sy, sw, 6, 0x8a8578, 0.35).setOrigin(0, 0.5));
    if (best >= lo) slider.add(this.add.rectangle(sx0, sy, sw * bestFrac, 6, 0x6a9a5a, 0.55).setOrigin(0, 0.5));
    const fill = this.add.rectangle(sx0, sy, 0, 6, 0x8a2a2a, 0.9).setOrigin(0, 0.5);
    const knob = this.add.circle(sx0, sy, 16, 0xefe6d2).setStrokeStyle(3, 0x8a2a2a);
    slider.add([fill, knob]);
    slider.add(text(this, sx0, sy + 28, `Lv ${lo}`, { size: 18, color: CSS.paperSub }).setOrigin(0, 0.5));
    slider.add(text(this, sx0 + sw, sy + 28, `Lv ${cap}`, { size: 18, color: CSS.paperSub }).setOrigin(1, 0.5));
    const track = this.add.rectangle(sx0 + sw / 2, sy, sw + 40, 64, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    slider.add(track);
    this.input.setDraggable(track);
    const syncSlider = () => {
      const f = cap > lo ? (target - lo) / (cap - lo) : 1;
      fill.width = sw * f;
      knob.x = sx0 + sw * f;
    };
    const pick = (px: number) => {
      const lv = Math.round(lo + Phaser.Math.Clamp((px - sx0) / sw, 0, 1) * (cap - lo));
      if (lv !== target) {
        target = lv;
        audio.sfx('tap');
        draw();
      }
    };
    track.on('pointerdown', (ptr: Phaser.Input.Pointer) => pick(ptr.x));
    track.on('drag', (ptr: Phaser.Input.Pointer) => pick(ptr.x));
    const draw = () => {
      dial.removeAll(true);
      costT.removeAll(true);
      for (let k = -2; k <= 2; k++) {
        const lv = target + k;
        if (lv < o.level || lv > cap) continue;
        const on = k === 0;
        const t = text(this, cx + k * 90, 520, String(lv), { size: on ? 46 : 30, font: 'display', color: on ? CSS.paperText : CSS.paperSub }).setOrigin(0.5);
        t.setInteractive({ useHandCursor: true }).on('pointerup', () => {
          target = lv;
          draw();
        });
        dial.add(t);
      }
      dial.add(this.add.rectangle(cx, 520, 86, 86).setStrokeStyle(2.5, 0x8a2a2a));
      dial.add(this.add.triangle(cx, 470, 0, 0, 16, 0, 8, 10, 0x8a2a2a));
      dial.add(this.add.triangle(cx, 570, 0, 10, 16, 10, 8, 0, 0x8a2a2a));
      // arrows
      const arrow = (x: number, d: number) => {
        const a = text(this, x, 520, d < 0 ? '‹' : '›', { size: 56, color: '#8a2a2a' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        a.on('pointerup', () => {
          target = Phaser.Math.Clamp(target + d, Math.min(cap, o.level + 1), cap);
          draw();
        });
        dial.add(a);
      };
      arrow(cx - 270, -1);
      arrow(cx + 270, 1);
      syncSlider();
      const mx = this.add.container(cx + 170, 680);
      mx.add(this.add.rectangle(0, 0, 150, 40, 0xffffff, 0.8).setStrokeStyle(1, 0x8a8578));
      mx.add(text(this, 0, 0, `Max  Lv.${Math.max(best, Math.min(cap, o.level + 1))}`, { size: 20, color: CSS.paperText }).setOrigin(0.5));
      mx.setSize(150, 40).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        target = Math.max(Math.min(cap, o.level + 1), best);
        draw();
      });
      dial.add(mx);
      if (o.level >= cap) {
        costT.add(text(this, cx, 720, insightState(save, c.id) === 'max' ? 'Fully raised' : 'Level cap reached — Kindle them', { size: 28, italic: true, color: CSS.paperSub }).setOrigin(0.5));
        statRows.forEach((r, i) => r.setText([st0.hp, st0.atk, st0.def][i].toLocaleString('en-US')).setColor(CSS.cream));
        return;
      }
      const cost = levelCost(o, target);
      (['dust', 'sovereign'] as ItemId[]).forEach((id, i) => {
        const x = cx - 150 + i * 220;
        const ok = save.items[id] >= cost[id as 'dust' | 'sovereign'];
        costT.add(this.add.rectangle(x + 30, 756, 200, 70, 0xffffff, 0.55).setStrokeStyle(1, 0x8a8578, 0.6));
        costT.add(this.add.image(x - 30, 756, `item:${id}`).setDisplaySize(60, 60).setInteractive({ useHandCursor: true }).on('pointerup', () => this.itemInfo(id)));
        costT.add(text(this, x + 10, 756, formatQty(cost[id as 'dust' | 'sovereign']), { size: 26, bold: true, color: ok ? CSS.paperText : '#c0392b' }).setOrigin(0, 0.5));
      });
      const ok = affordable(save, cost);
      const btn = new Button(this, cx, 866, {
        w: 300, h: 76, label: 'Level Up', style: ok ? 'amber' : 'cream', size: 32, sfx: ok ? 'levelup' : 'deny',
        onClick: () => {
          if (!levelUp(save, c.id, target)) {
            toast(this, 'Not enough materials — visit the Pawnshop', 'glimmer');
            return;
          }
          saves.commit();
          toast(this, `${c.name.split(' ')[0]} reached Lv ${target}`, c.mood);
          // Rebuild the page with the new numbers but keep the Level Up sheet open.
          this.openCharacter(c.id, 'overview', 'levelup');
        },
      });
      costT.add(btn);
      const st1 = allyStats(c.base, effectiveLevel({ insight: o.insight, level: target }), o.resonance);
      statRows.forEach((r, i) => r.setText(`${[st0.hp, st0.atk, st0.def][i].toLocaleString('en-US')}  ▸ ${[st1.hp, st1.atk, st1.def][i].toLocaleString('en-US')}`).setColor('#9be8ad'));
    };
    draw();
  }

  private openInsight(p: Phaser.GameObjects.Container, c: CharacterDef): void {
    const save = saves.get();
    const o = save.roster[c.id];
    const s = this.sheet(p, 'Kindle');
    const cx = 1290 + (W - 1290) / 2;
    const state = insightState(save, c.id);
    s.add(this.lanternGauge(cx, 320, o.insight / maxInsight(c.rarity)));
    const R = ['0', 'I', 'II', 'III'];
    if (state === 'max') {
      s.add(text(this, cx, 480, `${insightLabel(o.insight)} — fully awakened`, { size: 30, font: 'display', color: CSS.paperText }).setOrigin(0.5));
      return;
    }
    s.add(text(this, cx, 470, `Kindle ${R[o.insight]}  ▸  ${R[o.insight + 1]}`, { size: 34, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0.5));
    s.add(text(this, cx, 516, `Level cap ${levelCap(o.insight)} ▸ ${levelCap(o.insight + 1)}  ·  level resets to 1, stats are kept`, { size: 20, italic: true, color: CSS.paperSub }).setOrigin(0.5));
    const cost = insightCost(o.insight + 1);
    Object.entries(cost).forEach(([id, n], i) => {
      const x = cx - 180 + (i % 3) * 180;
      const have = save.items[id as ItemId];
      s.add(this.add.rectangle(x, 640, 150, 150, 0xffffff, 0.5).setStrokeStyle(1, 0x8a8578, 0.6));
      s.add(this.add.image(x, 620, `item:${id}`).setDisplaySize(92, 92).setInteractive({ useHandCursor: true }).on('pointerup', () => this.itemInfo(id as ItemId)));
      s.add(text(this, x, 692, `${formatQty(have)} / ${formatQty(n as number)}`, { size: 20, bold: true, color: have >= (n as number) ? CSS.paperText : '#c0392b' }).setOrigin(0.5));
    });
    const msg = state === 'needsLevel' ? `Reach Lv ${levelCap(o.insight)} first` : state === 'short' ? 'Not enough materials' : '';
    if (msg) s.add(text(this, cx, 760, msg, { size: 24, italic: true, color: '#9a3a2a' }).setOrigin(0.5));
    s.add(new Button(this, cx, 830, {
      w: 300, h: 76, label: 'Kindle', style: state === 'ready' ? 'amber' : 'cream', size: 32, sfx: state === 'ready' ? 'reveal5' : 'deny',
      onClick: () => {
        if (!raiseInsight(save, c.id)) return;
        saves.commit();
        toast(this, `${c.name.split(' ')[0]} reached ${insightLabel(o.insight)}`, c.mood);
        this.openCharacter(c.id);
      },
    }));
  }

  /** Item detail card (name, lore, how to get it). */
  private itemInfo(id: ItemId): void {
    const it = ITEMS[id];
    const save = saves.get();
    const c = this.add.container(0, 0).setDepth(400);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive().on('pointerup', () => c.destroy()));
    c.add(this.add.rectangle(W / 2, H / 2, 900, 330, 0xefe6d2).setStrokeStyle(2, 0x9a8660));
    c.add(this.add.circle(W / 2 - 320, H / 2 - 20, 90, 0xf2b8a0, 0.5));
    c.add(this.add.image(W / 2 - 320, H / 2 - 20, `item:${id}`).setDisplaySize(150, 150));
    c.add(text(this, W / 2 - 200, H / 2 - 130, it.name, { size: 36, font: 'display', bold: true, color: CSS.paperText }));
    c.add(text(this, W / 2 - 200, H / 2 - 76, it.blurb, { size: 22, color: CSS.paperText, wrap: 600, lineSpacing: 4 }));
    c.add(text(this, W / 2 - 200, H / 2 + 70, `Source: ${it.source}`, { size: 22, italic: true, color: CSS.paperSub }));
    c.add(text(this, W / 2 - 320, H / 2 + 120, `Inventory: ${formatQty(save.items[id])}`, { size: 20, color: CSS.paperSub }).setOrigin(0.5));
    c.add(this.closeCross(W / 2 + 420, H / 2 - 135, () => c.destroy()));
  }

  // ===================================================================== dossier

  private dossier(p: Phaser.GameObjects.Container, c: CharacterDef): void {
    const pages = BIOS[c.id] ?? fallbackBio(c);
    let at = 0;
    const body = this.add.container(0, 0);
    p.add(body);
    const side = this.add.container(0, 0);
    p.add(side);

    const draw = () => {
      body.removeAll(true);
      side.removeAll(true);
      // section index, like the reference's Cover / Voice / Item / Story list
      pages.forEach((pg, k) => {
        const y = 300 + k * 90;
        const on = k === at;
        const row = this.add.container(110, y);
        const d = this.add.rectangle(0, 0, 18, 18, on ? C.amber : 0x8a8578).setAngle(45);
        const t = text(this, 30, 0, pg.title, { size: on ? 30 : 26, font: 'display', bold: on, color: on ? CSS.amber : CSS.creamDim }).setOrigin(0, 0.5);
        if (t.width > 260) t.setScale(260 / t.width);
        row.add([d, t]);
        row.setSize(320, 70).setInteractive({ useHandCursor: true });
        row.on('pointerup', () => {
          audio.sfx('tap');
          at = k;
          draw();
        });
        side.add(row);
      });
      // open book
      const bx = 1160;
      const by = 540;
      const bw = 1360;
      const bh = 760;
      body.add(this.add.rectangle(bx + 10, by + 14, bw, bh, 0x000000, 0.5));
      body.add(this.add.rectangle(bx, by, bw, bh, 0xefe6d2).setStrokeStyle(2, 0xb8a47e, 0.8));
      body.add(this.add.tileSprite(bx, by, bw, bh, 'fx:grain').setAlpha(0.08));
      body.add(this.add.rectangle(bx, by, bw - 28, bh - 28).setStrokeStyle(1, 0x9a8660, 0.45));
      body.add(this.add.rectangle(bx, by, 3, bh - 20, 0x9a8660, 0.5));
      body.add(text(this, bx - bw / 2 + 40, by - bh / 2 + 26, `DOSSIER · ${c.name.toUpperCase()}`, { size: 16, font: 'display', color: CSS.paperSub, spacing: 4 }));
      body.add(text(this, bx + bw / 2 - 40, by - bh / 2 + 26, 'VELLMOOR, 1929', { size: 16, font: 'display', color: CSS.paperSub, spacing: 4 }).setOrigin(1, 0));
      // left page: sepia portrait study + section title
      const lpx = bx - bw / 4;
      const art = this.add.image(lpx, by - 20, ensurePortrait(this, c.id));
      art.setScale(Math.min(520 / art.height, 560 / art.width)).setTint(0xd8c8a8).setAlpha(0.92);
      body.add(this.add.image(lpx, by - 20, 'fx:glow').setTint(0xf6eedc).setDisplaySize(700, 600).setAlpha(0.9));
      body.add(art);
      const title = text(this, lpx, by + 270, pages[at].title, { size: 40, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0.5);
      if (title.width > 560) title.setScale(560 / title.width);
      body.add(title);
      body.add(ornament(this, lpx, by + 316, 360, 0x8a6a3a, 0.8));
      // right page: text
      const page = text(this, bx + 50, by - bh / 2 + 110, pages[at].text, { size: 30, color: CSS.paperText, wrap: bw / 2 - 110, lineSpacing: 10 });
      for (let sz = 28; sz >= 20 && page.height > bh - 170; sz -= 2) page.setFontSize(sz);
      body.add(page);
      // page tabs
      pages.forEach((_pg, k) => {
        const x = bx - 120 + k * 120;
        const on = k === at;
        const num = text(this, x, by + bh / 2 + 40, String(k + 1).padStart(2, '0'), { size: 26, font: 'display', bold: on, color: on ? CSS.amber : CSS.creamDim }).setOrigin(0.5);
        num.setInteractive({ useHandCursor: true }).on('pointerup', () => {
          at = k;
          draw();
        });
        body.add(num);
      });
      body.add(this.add.rectangle(bx, by + bh / 2 + 70, 400, 2, 0x5a5048));
      body.add(this.add.rectangle(bx - 200 + (400 / pages.length) * at, by + bh / 2 + 70, 400 / pages.length, 3, C.amber).setOrigin(0, 0.5));
    };
    draw();
  }
}
