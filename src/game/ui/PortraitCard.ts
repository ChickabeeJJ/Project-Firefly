import Phaser from 'phaser';
import { PCARD_H, PCARD_W } from '../art/cardArt';
import { ensurePortraitCard } from '../art/registry';
import { getCharacter } from '../data/characters';
import { C, CSS, RARITY_COLOR } from '../config/theme';
import { rarityStars, text } from './kit';

export interface PortraitCardOpts {
  level?: number;
  locked?: boolean;
  /** Team slot number shown as a small medal (1–3). */
  slot?: number;
  /** Short ribbon label ("NEW", "LEAD"). */
  badge?: string;
}

/** Tall character card: art, mood emblem, level, name and rarity. Scaled by the caller. */
export class PortraitCard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, readonly charId: string, o: PortraitCardOpts = {}) {
    super(scene, x, y);
    const c = getCharacter(charId);
    const art = scene.add.image(0, 0, ensurePortraitCard(scene, charId));
    this.add(art);
    if (o.locked) {
      art.setTintFill(0x16171c);
      this.add(scene.add.image(0, -20, 'icon:lock').setDisplaySize(90, 90).setAlpha(0.5));
      this.add(text(scene, 0, PCARD_H / 2 - 50, '???', { size: 34, font: 'display', bold: true, color: CSS.muted }).setOrigin(0.5));
    } else {
      this.add(scene.add.rectangle(0, PCARD_H / 2 - 4, PCARD_W - 8, 8, RARITY_COLOR[c.rarity]));
      this.add(scene.add.image(-PCARD_W / 2 + 40, -PCARD_H / 2 + 42, `icon:${c.mood}`).setDisplaySize(60, 60));
      if (o.level !== undefined) {
        this.add(text(scene, 0, PCARD_H / 2 - 108, `LV ${o.level}`, { size: 24, font: 'display', bold: true, color: CSS.creamDim, spacing: 2, shadow: true }).setOrigin(0.5));
      }
      const name = text(scene, 0, PCARD_H / 2 - 70, c.name.split(' ')[0], { size: 40, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0.5);
      if (name.width > PCARD_W - 30) name.setScale((PCARD_W - 30) / name.width);
      this.add(name);
      this.add(rarityStars(scene, 0, PCARD_H / 2 - 30, c.rarity, 22));
    }
    if (o.slot) {
      const b = scene.add.container(PCARD_W / 2 - 36, -PCARD_H / 2 + 38);
      b.add(scene.add.circle(0, 0, 22, 0x14110c, 0.92).setStrokeStyle(2.5, C.gold));
      b.add(text(scene, 0, 1, String(o.slot), { size: 26, font: 'display', bold: true, color: CSS.goldLight }).setOrigin(0.5));
      this.add(b);
    }
    if (o.badge) {
      const b = scene.add.container(PCARD_W / 2 - 50, -PCARD_H / 2 + 38);
      b.add(scene.add.nineslice(0, 0, 'ui:btnGold', undefined, 86, 38, 10, 10, 10, 10));
      b.add(text(scene, 0, 0, o.badge, { size: 20, font: 'display', bold: true, color: '#2a1e0c', spacing: 2 }).setOrigin(0.5));
      this.add(b);
    }
    this.setSize(PCARD_W, PCARD_H);
    scene.add.existing(this);
  }
}
