import Phaser from 'phaser';
import { PCARD_H } from '../art/cardArt';
import { ensureBg } from '../art/registry';
import { audio } from '../audio/AudioController';
import { moodRelation } from '../battle/rules';
import { allyStats } from '../battle/stats';
import { effectiveLevel } from '../systems/growth';
import { CHARACTERS, getCharacter } from '../data/characters';
import { getEnemy } from '../data/enemies';
import { getStage } from '../data/stages';
import type { StageDef } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { Atmosphere, Button, fadeIn, goTo, ornament, text, toast } from '../ui/kit';
import { PortraitCard } from '../ui/PortraitCard';

/** Pre-battle check: goals, enemy intel and the three-Luminary team. */
export class FormationScene extends Phaser.Scene {
  private stage!: StageDef;
  private cards: Phaser.GameObjects.Container[] = [];
  private picker?: Phaser.GameObjects.Container;

  constructor() {
    super('Formation');
  }

  create(data: { stageId: string }): void {
    fadeIn(this);
    this.cards = [];
    this.picker = undefined;
    this.stage = getStage(data.stageId);
    this.add.image(W / 2, H / 2, ensureBg(this, this.stage.bg)).setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x07080a, 0.55);
    new Atmosphere(this, { depth: 40, fireflies: 3 });

    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Story', { stageId: this.stage.id }) }).setDepth(90);
    this.buildIntel();
    text(this, 1340, 170, 'TEAM', { size: 30, font: 'display', bold: true, color: CSS.cream, spacing: 6 }).setOrigin(0.5);
    ornament(this, 1340, 206, 560);
    text(this, 1340, 900, 'Tap a Luminary to swap them out', { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0.5);
    this.buildTeam();
    new Button(this, W - 260, H - 90, {
      w: 400, h: 100, label: 'Start', sub: `${this.stage.id} · ${this.stage.name}`, style: 'amber', size: 40,
      onClick: () => goTo(this, 'Battle', { stageId: this.stage.id }),
    }).setDepth(90);
    audio.play('lobby');
  }

  private buildIntel(): void {
    const s = this.stage;
    const x = 80;
    let y = 160;
    text(this, x, y, s.id, { size: 30, font: 'display', bold: true, color: CSS.goldLight, spacing: 3 });
    text(this, x, y + 36, s.name, { size: 46, font: 'display', bold: true, color: CSS.cream, shadow: true, wrap: 760 });
    y += 140;
    text(this, x, y, 'GOALS', { size: 26, font: 'display', bold: true, color: CSS.creamDim, spacing: 4 });
    ['Drive back the Dimming', `Win within ${s.starRounds} rounds`, 'No Luminary falls'].forEach((g, i) => {
      this.add.image(x + 18, y + 56 + i * 48, 'icon:star4').setDisplaySize(26, 26).setTint(0xf26b3a);
      text(this, x + 46, y + 56 + i * 48, g, { size: 28, color: CSS.cream }).setOrigin(0, 0.5);
    });
    y += 230;
    text(this, x, y, 'ENEMIES', { size: 26, font: 'display', bold: true, color: CSS.creamDim, spacing: 4 });
    const ids = [...new Set(s.waves.flat())];
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const ex = x + 70 + i * 150;
      this.add.circle(ex, y + 110, 64, 0x0c0e12, 0.8).setStrokeStyle(2, e.boss ? C.danger : C.gold, 0.5);
      const img = this.add.image(ex, y + 166, `enemy:${e.kind}`).setOrigin(0.5, 1);
      img.setScale(Math.min(116 / img.height, 116 / img.width));
      this.add.image(ex + 48, y + 60, `icon:${e.mood}`).setDisplaySize(36, 36);
      text(this, ex, y + 196, e.name.split(' ').slice(-1)[0], { size: 22, color: CSS.creamDim }).setOrigin(0.5);
    });
    y += 250;
    text(this, x, y, `Recommended Lv ${s.level}  ·  ${s.waves.length} wave${s.waves.length > 1 ? 's' : ''}  ·  Round limit ${s.roundLimit}`, { size: 26, color: CSS.creamDim });
    if (s.rule) {
      text(this, x, y + 44, s.rule === 'fireflyBloom' ? '✦ Firefly Bloom — two fireflies light your Verses each round.' : '✦ Restless Dim — enemies begin with 2 Ardor.', { size: 26, italic: true, color: CSS.firefly });
    }
  }

  private buildTeam(): void {
    for (const c of this.cards) c.destroy();
    this.cards = [];
    const save = saves.get();
    const enemyMoods = [...new Set(this.stage.waves.flat().map((id) => getEnemy(id).mood))];
    save.team.forEach((id, i) => {
      const owned = save.roster[id];
      const x = 1000 + i * 340;
      const y = 560;
      const card = new PortraitCard(this, x, y, id, { level: owned.level, badge: i === 0 ? 'LEAD' : undefined });
      card.setScale(0.98);
      const c = getCharacter(id);
      const adv = enemyMoods.some((m) => moodRelation(c.mood, m) === 1);
      const dis = enemyMoods.some((m) => moodRelation(c.mood, m) === -1);
      if (adv || dis) {
        const tag = text(this, 0, -PCARD_H / 2 - 26, adv ? '▲ Mood advantage' : '▼ Mood disadvantage', { size: 22, bold: true, color: adv ? CSS.gold : CSS.muted }).setOrigin(0.5);
        card.add(tag);
      }
      const st = allyStats(c.base, effectiveLevel(owned), owned.resonance);
      card.add(text(this, 0, PCARD_H / 2 + 30, `HP ${st.hp}  ·  ATK ${st.atk}`, { size: 22, color: CSS.creamDim }).setOrigin(0.5));
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setScale(1.01));
      card.on('pointerout', () => card.setScale(0.98));
      card.on('pointerup', () => {
        audio.sfx('tap');
        this.openPicker(i);
      });
      this.cards.push(card);
    });
  }

  private openPicker(slot: number): void {
    this.picker?.destroy();
    const save = saves.get();
    const owned = CHARACTERS.filter((c) => save.roster[c.id]);
    const p = this.add.container(0, 0).setDepth(200);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    shade.on('pointerup', () => this.closePicker());
    p.add(shade);
    p.add(this.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, 1700, 640, 14, 14, 14, 14));
    p.add(text(this, W / 2, H / 2 - 270, `Choose a Luminary for slot ${slot + 1}`, { size: 36, font: 'display', bold: true, color: CSS.cream }).setOrigin(0.5));
    const twoRows = owned.length > 8;
    const cols = twoRows ? 5 : owned.length;
    const scale = twoRows ? 0.46 : 0.6;
    owned.forEach((c, i) => {
      const x = W / 2 + (i % cols - (cols - 1) / 2) * (twoRows ? 160 : 196);
      const y = twoRows ? H / 2 - 100 + Math.floor(i / cols) * 250 : H / 2 + 20;
      const o = save.roster[c.id];
      const inTeam = save.team.indexOf(c.id);
      const card = new PortraitCard(this, x, y, c.id, { level: o.level, slot: inTeam >= 0 ? inTeam + 1 : undefined }).setScale(scale);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerup', () => {
        audio.sfx('card');
        const cur = save.team[slot];
        if (inTeam >= 0) {
          save.team[inTeam] = cur;
        }
        save.team[slot] = c.id;
        saves.commit();
        this.closePicker();
        this.buildTeam();
        toast(this, `${c.name.split(' ')[0]} joins the team`, c.mood);
      });
      p.add(card);
    });
    if (owned.length <= 3) {
      p.add(text(this, W / 2, H / 2 + 260, 'Recruit more Luminaries at the Lantern Rite.', { size: 26, italic: true, color: CSS.firefly }).setOrigin(0.5));
    }
    this.picker = p;
  }

  private closePicker(): void {
    this.picker?.destroy();
    this.picker = undefined;
  }
}
