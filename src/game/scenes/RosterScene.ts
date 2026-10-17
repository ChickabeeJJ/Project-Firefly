import Phaser from 'phaser';
import { fitPortrait } from '../art/assets';
import { CARD_W } from '../art/cardArt';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { describeVerse, TYPE_LABEL } from '../battle/describe';
import { MAX_LEVEL, MAX_RESONANCE } from '../battle/rules';
import { allyStats } from '../battle/stats';
import { CHARACTERS, getCharacter } from '../data/characters';
import { C, CSS, H, MOOD_NAME, RARITY_CSS, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { expToNext } from '../systems/progression';
import { Atmosphere, Button, fadeIn, goTo, ornament, rarityStars, text, toast } from '../ui/kit';
import { PortraitCard } from '../ui/PortraitCard';

/** The Troupe: collection grid and character detail (stats, verses, quote). */
export class RosterScene extends Phaser.Scene {
  private sort: 'rarity' | 'level' = 'rarity';
  private grid?: Phaser.GameObjects.Container;
  private detail?: Phaser.GameObjects.Container;

  constructor() {
    super('Roster');
  }

  create(): void {
    fadeIn(this);
    this.grid = undefined;
    this.detail = undefined;
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x07080a, 0.72);
    new Atmosphere(this, { depth: 40, fireflies: 3 });
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }).setDepth(90);
    text(this, W / 2, 80, 'THE TROUPE', { size: 60, font: 'display', bold: true, color: CSS.cream, spacing: 10 }).setOrigin(0.5);
    ornament(this, W / 2, 128, 520);
    (['rarity', 'level'] as const).forEach((k, i) => {
      new Button(this, 1540 + i * 200, 80, {
        w: 180, h: 60, label: k === 'rarity' ? 'Rarity' : 'Level', style: this.sort === k ? 'gold' : 'dark', size: 24,
        onClick: () => {
          this.sort = k;
          this.scene.restart();
        },
      }).setDepth(90);
    });
    this.renderGrid();
    audio.play('lobby');
  }

  private renderGrid(): void {
    this.grid?.destroy();
    const save = saves.get();
    const list = [...CHARACTERS].sort((a, b) => {
      const oa = save.roster[a.id];
      const ob = save.roster[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      if (this.sort === 'level' && oa && ob && oa.level !== ob.level) return ob.level - oa.level;
      return b.rarity - a.rarity || a.name.localeCompare(b.name);
    });
    const g = this.add.container(0, 0);
    list.forEach((c, i) => {
      const o = save.roster[c.id];
      const x = 260 + (i % 5) * 350;
      const y = 400 + Math.floor(i / 5) * 400;
      const team = save.team.indexOf(c.id);
      const card = new PortraitCard(this, x, y, c.id, { level: o?.level, resonance: o?.resonance, locked: !o, badge: team >= 0 ? `#${team + 1}` : undefined }).setScale(0.74);
      if (o) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setScale(0.76));
        card.on('pointerout', () => card.setScale(0.74));
        card.on('pointerup', () => {
          audio.sfx('tap');
          this.openDetail(c.id);
        });
      }
      g.add(card);
    });
    text(this, W / 2, H - 40, `${Object.keys(save.roster).length} of ${CHARACTERS.length} Luminaries found — the rest answer at the Lantern Rite`, { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0.5);
    this.grid = g;
  }

  private openDetail(id: string): void {
    this.detail?.destroy();
    const save = saves.get();
    const c = getCharacter(id);
    const o = save.roster[id];
    const st = allyStats(c.base, o.level, o.resonance);
    const d = this.add.container(0, 0).setDepth(200);
    d.add(this.add.rectangle(W / 2, H / 2, W, H, 0x06070a, 0.94).setInteractive());
    d.add(this.add.image(470, 520, 'fx:glow').setTint(Phaser.Display.Color.HexStringToColor(c.palette.primary).color).setDisplaySize(900, 900).setAlpha(0.35));
    d.add(fitPortrait(this.add.image(470, H + 30, ensurePortrait(this, id)).setOrigin(0.5, 1), 0.95, 1060));
    d.add(new Button(this, W - 90, 70, { w: 76, h: 76, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: () => { d.destroy(); this.detail = undefined; } }));

    const x = 900;
    d.add(text(this, x, 70, c.title.toUpperCase(), { size: 26, font: 'display', bold: true, color: RARITY_CSS[c.rarity], spacing: 4 }));
    d.add(text(this, x, 104, c.name, { size: 70, font: 'display', bold: true, color: CSS.cream }));
    d.add(rarityStars(this, x + 70, 210, c.rarity, 34));
    d.add(this.add.image(x + 230, 210, `icon:${c.mood}`).setDisplaySize(44, 44));
    d.add(text(this, x + 260, 210, `${MOOD_NAME[c.mood]}  ·  ${c.role}`, { size: 28, color: CSS.creamDim }).setOrigin(0, 0.5));
    d.add(ornament(this, x + 440, 254, 880));

    d.add(text(this, x, 290, `Level ${o.level}${o.level >= MAX_LEVEL ? ' (max)' : ''}`, { size: 32, bold: true, color: CSS.cream }));
    d.add(this.add.rectangle(x, 352, 360, 12, 0x2a2a30).setOrigin(0, 0.5));
    d.add(this.add.rectangle(x, 352, 360 * Math.min(1, o.exp / expToNext(o.level)), 12, C.gold).setOrigin(0, 0.5));
    d.add(text(this, x + 370, 352, `${o.exp} / ${expToNext(o.level)} EXP`, { size: 22, color: CSS.creamDim }).setOrigin(0, 0.5));
    [['HP', st.hp], ['ATK', st.atk], ['DEF', st.def]].forEach(([k, v], i) => {
      d.add(text(this, x + i * 200, 392, String(k), { size: 24, font: 'display', color: CSS.creamDim, spacing: 2 }));
      d.add(text(this, x + i * 200, 424, String(v), { size: 38, bold: true, color: CSS.cream }));
    });
    d.add(text(this, x + 620, 392, 'RESONANCE', { size: 24, font: 'display', color: CSS.creamDim, spacing: 2 }));
    for (let i = 0; i < MAX_RESONANCE; i++) {
      d.add(this.add.image(x + 640 + i * 44, 448, 'icon:star4').setDisplaySize(34, 34).setTint(i < o.resonance ? 0xb886e0 : 0x3a3a42));
    }

    [...c.verses, c.finale].forEach((v, i) => {
      const vx = x + 110 + i * 300;
      const vy = 680;
      d.add(this.add.image(vx, vy, `card:${v.id}`).setScale(0.62));
      d.add(this.add.image(vx, vy, v.finale ? 'card:borderGold' : 'card:border').setScale(0.62));
      d.add(text(this, vx - 120, vy + 140, v.name, { size: 28, font: 'display', bold: true, color: v.finale ? CSS.gold : CSS.goldLight, wrap: CARD_W }));
      d.add(text(this, vx - 120, vy + 178, v.finale ? 'Finale' : TYPE_LABEL[v.type], { size: 22, italic: true, color: CSS.creamDim }));
      d.add(text(this, vx - 120, vy + 208, describeVerse(v, 1), { size: 22, color: CSS.cream, wrap: 270, lineSpacing: 2 }));
    });

    const team = save.team.indexOf(id);
    d.add(new Button(this, W - 330, 200, {
      w: 340, h: 76, label: team === 0 ? 'Team leader' : 'Make leader', style: team === 0 ? 'dark' : 'amber', size: 30,
      onClick: () => {
        if (team === 0) return;
        if (team > 0) save.team[team] = save.team[0];
        else save.team[2] = save.team[0];
        save.team[0] = id;
        saves.commit();
        toast(this, `${c.name.split(' ')[0]} now leads the troupe`, c.mood);
        d.destroy();
        this.detail = undefined;
        this.renderGrid();
      },
    }));
    d.add(text(this, 470, H - 60, `“${c.quote}”`, { size: 28, italic: true, color: CSS.cream, wrap: 820, align: 'center', shadow: true }).setOrigin(0.5));
    this.detail = d;
  }
}
