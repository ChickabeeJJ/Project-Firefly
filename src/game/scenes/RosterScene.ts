import Phaser from 'phaser';
import { PCARD_H, PCARD_W } from '../art/cardArt';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { describeVerse, TYPE_LABEL } from '../battle/describe';
import { MAX_LEVEL, MAX_RESONANCE } from '../battle/rules';
import { allyStats } from '../battle/stats';
import type { Card } from '../battle/types';
import { CHARACTERS, getCharacter } from '../data/characters';
import { BIOS } from '../data/story';
import type { BioSection, CharacterDef } from '../data/types';
import { C, CSS, H, MOOD_CSS, MOOD_NAME, RARITY_CSS, TYPE_CSS, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { expToNext } from '../systems/progression';
import { CardView } from '../ui/CardView';
import { Atmosphere, Button, fadeIn, goTo, ornament, rarityStars, text, toast } from '../ui/kit';
import { livingPortrait } from '../ui/LivingSprite';
import { PortraitCard } from '../ui/PortraitCard';

const COLS = 8;
const CARD_SCALE = 0.64;
const GAP = 16;

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
    const cw = PCARD_W * CARD_SCALE;
    const ch = PCARD_H * CARD_SCALE;
    const x0 = (W - (COLS * cw + (COLS - 1) * GAP)) / 2 + cw / 2;
    list.forEach((c, i) => {
      const o = save.roster[c.id];
      const x = x0 + (i % COLS) * (cw + GAP);
      const rows = Math.ceil(list.length / COLS);
      const top = 110 + (H - 110 - 90 - (rows * ch + (rows - 1) * (GAP + 10))) / 2;
      const y = top + ch / 2 + Math.floor(i / COLS) * (ch + GAP + 10);
      const team = save.team.indexOf(c.id);
      const card = new PortraitCard(this, x, y, c.id, { level: o?.level, locked: !o, slot: team >= 0 ? team + 1 : undefined }).setScale(CARD_SCALE);
      if (o) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setScale(CARD_SCALE * 1.04));
        card.on('pointerout', () => card.setScale(CARD_SCALE));
        card.on('pointerup', () => {
          audio.sfx('tap');
          this.openCharacter(c.id);
        });
      }
    });
    text(this, W / 2, H - 46, `${Object.keys(save.roster).length} of ${CHARACTERS.length} Luminaries found — the rest answer at the Lantern Rite`, { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0.5);
  }

  // ===================================================================== character page

  private openCharacter(id: string, view: 'overview' | 'dossier' = 'overview'): void {
    this.page?.destroy();
    const c = getCharacter(id);
    const p = this.add.container(0, 0).setDepth(200);
    this.page = p;
    const tint = Phaser.Display.Color.HexStringToColor(c.palette.primary).color;
    p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0b0e, 1).setInteractive());
    p.add(this.add.image(940, 560, 'fx:glow').setTint(tint).setDisplaySize(1300, 1100).setAlpha(0.42));
    p.add(text(this, W - 40, 150, view === 'dossier' ? 'DOSSIER' : 'DOCUMENT', { size: 150, font: 'display', bold: true, color: '#ffffff', spacing: 20 }).setOrigin(1, 0.5).setAlpha(0.035));
    p.add(backButton(this, () => {
      p.destroy();
      this.page = undefined;
    }));
    p.add(tab(this, 230, 60, 'Overview', view === 'overview', () => this.openCharacter(id, 'overview')));
    p.add(tab(this, 400, 60, 'Dossier', view === 'dossier', () => this.openCharacter(id, 'dossier')));
    if (view === 'overview') this.overview(p, c);
    else this.dossier(p, c);
  }

  private overview(p: Phaser.GameObjects.Container, c: CharacterDef): void {
    const save = saves.get();
    const o = save.roster[c.id];
    const st = allyStats(c.base, o.level, o.resonance);

    p.add(livingPortrait(this, 930, H + 30, ensurePortrait(this, c.id), 0.9, 1000, 900));

    // ---- left: identity + stats
    const lx = 70;
    p.add(this.add.image(lx + 56, 190, `icon:${c.mood}`).setDisplaySize(112, 112));
    p.add(text(this, lx + 56, 262, MOOD_NAME[c.mood].toUpperCase(), { size: 20, font: 'display', bold: true, color: MOOD_CSS[c.mood], spacing: 6 }).setOrigin(0.5));
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
    p.add(text(this, lx, 392, 'Personal Stats  ▸', { size: 28, font: 'display', color: CSS.creamDim, spacing: 1 }));
    p.add(this.add.rectangle(lx, 432, 470, 1, C.gold, 0.35).setOrigin(0, 0.5));
    ([['heal', 'HP', st.hp], ['attack', 'ATK', st.atk], ['shield', 'DEF', st.def]] as const).forEach(([icon, k, v], i) => {
      const y = 470 + i * 52;
      p.add(this.add.rectangle(lx, y, 470, 44, 0x121116, 0.75).setOrigin(0, 0.5));
      p.add(this.add.image(lx + 26, y, `icon:${icon}`).setDisplaySize(28, 28));
      p.add(text(this, lx + 52, y, k, { size: 24, color: CSS.creamDim }).setOrigin(0, 0.5));
      p.add(text(this, lx + 450, y, v.toLocaleString('en-US'), { size: 26, bold: true, color: CSS.cream }).setOrigin(1, 0.5));
    });
    const ly = 660;
    p.add(text(this, lx, ly, 'Level', { size: 26, font: 'display', color: CSS.creamDim }));
    p.add(text(this, lx + 100, ly - 6, `${o.level}`, { size: 46, font: 'display', bold: true, color: CSS.cream }));
    p.add(text(this, lx + 100 + (o.level >= 10 ? 56 : 30), ly + 10, `/ ${MAX_LEVEL}`, { size: 24, color: CSS.creamDim }));
    const need = expToNext(o.level);
    p.add(this.add.rectangle(lx, ly + 66, 470, 8, 0x2a2a30).setOrigin(0, 0.5));
    p.add(this.add.rectangle(lx, ly + 66, o.level >= MAX_LEVEL ? 470 : 470 * Math.min(1, o.exp / need), 8, C.amber).setOrigin(0, 0.5));
    p.add(text(this, lx + 470, ly + 92, o.level >= MAX_LEVEL ? 'MAX' : `${o.exp} / ${need} EXP`, { size: 20, color: CSS.creamDim }).setOrigin(1, 0.5));
    p.add(text(this, lx, ly + 140, 'Resonance', { size: 24, font: 'display', color: CSS.creamDim }));
    for (let i = 0; i < MAX_RESONANCE; i++) {
      p.add(this.add.image(lx + 180 + i * 40, ly + 154, 'icon:star4').setDisplaySize(30, 30).setTint(i < o.resonance ? 0xb886e0 : 0x3a3a42));
    }

    // ---- right: verses + actions
    const rx = 1420;
    p.add(text(this, rx, 150, 'Verses', { size: 30, font: 'display', bold: true, color: CSS.cream, spacing: 2 }));
    p.add(this.add.rectangle(rx, 190, 440, 1, C.gold, 0.35).setOrigin(0, 0.5));
    const info = this.add.container(0, 0);
    p.add(info);
    const verses = [...c.verses, c.finale];
    const cards: CardView[] = [];
    const show = (k: number) => {
      info.removeAll(true);
      cards.forEach((cv, j) => cv.setSelected(j === k));
      const v = verses[k];
      const box = this.add.rectangle(rx, 560, 440, 230, 0x121116, 0.85).setOrigin(0, 0).setStrokeStyle(1, 0xe8dcc0, 0.2);
      const t = text(this, rx + 20, 574, v.name, { size: 30, font: 'display', bold: true, color: v.finale ? CSS.gold : CSS.goldLight });
      if (t.width > 400) t.setScale(400 / t.width);
      const ty = text(this, rx + 20, 616, v.finale ? 'Finale' : TYPE_LABEL[v.type], { size: 22, italic: true, color: v.finale ? CSS.gold : TYPE_CSS[v.type] });
      const d = text(this, rx + 20, 650, describeVerse(v, 1), { size: 22, color: CSS.cream, wrap: 400, lineSpacing: 2 });
      info.add([box, t, ty, d]);
    };
    verses.forEach((v, k) => {
      const card: Card = { cid: -1 - k, ownerUid: '', verseId: v.id, rank: 1, lit: false, finale: !!v.finale };
      const cv = new CardView(this, rx + 70 + k * 150, 370, card, c.id).setScale(0.5);
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
    p.add(new Button(this, rx + 220, 850, {
      w: 440, h: 76, label: team === 0 ? 'Team leader' : 'Make leader', style: team === 0 ? 'dark' : 'amber', size: 28,
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
    p.add(new Button(this, rx + 220, 944, { w: 440, h: 66, label: 'Read Dossier', style: 'cream', size: 26, onClick: () => this.openCharacter(c.id, 'dossier') }));

    // ---- bottom: voice line
    const q = text(this, 930, H - 50, `“${c.quote}”`, { size: 26, italic: true, color: CSS.cream, wrap: 760, align: 'center', shadow: true }).setOrigin(0.5);
    p.add(this.add.rectangle(930, H - 50, Math.min(840, q.width + 80), q.height + 24, 0x000000, 0.55));
    p.add(q);
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
      body.add(text(this, bx + 50, by - bh / 2 + 110, pages[at].text, { size: 30, color: CSS.paperText, wrap: bw / 2 - 110, lineSpacing: 10 }));
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
