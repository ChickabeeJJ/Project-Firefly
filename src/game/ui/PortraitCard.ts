import Phaser from 'phaser';
import { PCARD_H, PCARD_W } from '../art/cardArt';
import { ensurePortraitCard } from '../art/registry';
import { getCharacter } from '../data/characters';
import { CSS, RARITY_COLOR } from '../config/theme';
import { rarityStars, text } from './kit';

export interface PortraitCardOpts {
  level?: number;
  resonance?: number;
  locked?: boolean;
  badge?: string;
}

/** Tall character card: art, name, mood, rarity and level. Scaled by the caller. */
export class PortraitCard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, readonly charId: string, o: PortraitCardOpts = {}) {
    super(scene, x, y);
    const c = getCharacter(charId);
    const art = scene.add.image(0, 0, ensurePortraitCard(scene, charId));
    this.add(art);
    if (o.locked) {
      art.setTintFill(0x1a1b20);
      this.add(scene.add.image(0, -20, 'icon:lock').setDisplaySize(90, 90).setAlpha(0.6));
      this.add(text(scene, 0, PCARD_H / 2 - 50, '???', { size: 34, font: 'display', bold: true, color: CSS.muted }).setOrigin(0.5));
    } else {
      this.add(scene.add.rectangle(0, -PCARD_H / 2 + 6, PCARD_W - 12, 8, RARITY_COLOR[c.rarity]).setOrigin(0.5, 0));
      this.add(scene.add.image(-PCARD_W / 2 + 40, -PCARD_H / 2 + 46, `icon:${c.mood}`).setDisplaySize(54, 54));
      this.add(text(scene, 0, PCARD_H / 2 - 92, c.name.split(' ')[0], { size: 38, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0.5));
      this.add(rarityStars(scene, 0, PCARD_H / 2 - 54, c.rarity, 24));
      if (o.level !== undefined) {
        this.add(text(scene, 0, PCARD_H / 2 - 22, `Lv ${o.level}${o.resonance ? `  ·  Resonance ${o.resonance}` : ''}`, { size: 24, color: CSS.creamDim }).setOrigin(0.5));
      }
    }
    if (o.badge) {
      const b = scene.add.container(PCARD_W / 2 - 54, -PCARD_H / 2 + 40);
      b.add(scene.add.nineslice(0, 0, 'ui:btnGold', undefined, 96, 44, 10, 10, 10, 10));
      b.add(text(scene, 0, 0, o.badge, { size: 22, font: 'display', bold: true, color: '#2a1e0c' }).setOrigin(0.5));
      this.add(b);
    }
    this.setSize(PCARD_W, PCARD_H);
    scene.add.existing(this);
  }
}
