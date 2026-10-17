import Phaser from 'phaser';
import { CARD_H, CARD_W } from '../art/cardArt';
import { TYPE_LABEL } from '../battle/describe';
import type { Card } from '../battle/types';
import { findVerse } from '../data/characters';
import { CSS, TYPE_CSS } from '../config/theme';
import { text } from './kit';

export const HAND_SCALE = 0.6;
export const CARD_DW = CARD_W * HAND_SCALE;
export const CARD_DH = CARD_H * HAND_SCALE;

const TYPE_ICON: Record<string, string> = {
  attack: 'attack', mass: 'mass', heal: 'heal', shield: 'shield', buff: 'buff', debuff: 'debuff',
};

/**
 * A verse card. Built at native card resolution (264×404) and scaled by its owner, so text and
 * art stay crisp at every size the game uses.
 */
export class CardView extends Phaser.GameObjects.Container {
  card: Card;
  private stars: Phaser.GameObjects.Image[] = [];
  private litGlow: Phaser.GameObjects.Image;
  private fly: Phaser.GameObjects.Image;
  private selectGlow: Phaser.GameObjects.Image;
  private flyTween?: Phaser.Tweens.Tween;
  homeX = 0;
  homeY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card, charId: string) {
    super(scene, x, y);
    this.card = { ...card };
    const { verse } = findVerse(card.verseId);

    this.litGlow = scene.add.image(0, 0, 'card:lit').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.selectGlow = scene.add.image(0, 0, 'card:select').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    const art = scene.add.image(0, 0, `card:${verse.id}`);
    const border = scene.add.image(0, 0, card.finale ? 'card:borderGold' : 'card:border');
    this.add([this.litGlow, this.selectGlow, art, border]);

    // Rank stars (top centre) — Finales show a crown of three gold stars instead.
    for (let i = 0; i < 3; i++) {
      const s = scene.add.image((i - 1) * 40, -CARD_H / 2 + 28, 'icon:star4').setDisplaySize(40, 40);
      this.stars.push(s);
      this.add(s);
    }

    const head = scene.add.image(-CARD_W / 2 + 34, -CARD_H / 2 + 34, `head:${charId}`).setDisplaySize(64, 64);
    this.add(head);

    const typeColor = card.finale ? CSS.gold : TYPE_CSS[verse.type];
    const icon = scene.add.image(-CARD_W / 2 + 34, CARD_H / 2 - 32, `icon:${card.finale ? 'star4' : TYPE_ICON[verse.type]}`).setDisplaySize(40, 40);
    const label = text(scene, -CARD_W / 2 + 62, CARD_H / 2 - 32, card.finale ? 'FINALE' : TYPE_LABEL[verse.type].toUpperCase(), {
      size: 34, font: 'display', bold: true, color: typeColor, spacing: 5,
    }).setOrigin(0, 0.5);
    this.add([icon, label]);

    this.fly = scene.add.image(CARD_W / 2 - 30, -CARD_H / 2 + 30, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setVisible(false);
    this.add(this.fly);

    this.setSize(CARD_W, CARD_H);
    this.refresh();
    scene.add.existing(this);
  }

  get cid(): number {
    return this.card.cid;
  }

  update_(card: Partial<Card>): void {
    Object.assign(this.card, card);
    this.refresh();
  }

  refresh(): void {
    this.stars.forEach((s, i) => {
      const on = this.card.finale || i < this.card.rank;
      s.setTint(this.card.finale ? 0xf0c25a : on ? 0xf26b3a : 0x6a6a6a).setAlpha(on ? 1 : 0.55);
    });
    this.litGlow.setVisible(this.card.lit);
    this.fly.setVisible(this.card.lit);
    if (this.card.lit && !this.flyTween) {
      this.flyTween = this.scene.tweens.add({ targets: this.fly, y: this.fly.y - 12, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({ targets: this.litGlow, alpha: 0.55, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  setSelected(on: boolean): void {
    this.selectGlow.setVisible(on);
  }

  /** Bright flash + star pop when this card absorbs a merge. */
  mergeFlash(): void {
    const flash = this.scene.add.image(0, 0, 'fx:glow').setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(CARD_W * 1.6, CARD_H * 1.3).setAlpha(0.9);
    this.add(flash);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    const star = this.stars[Math.min(2, this.card.rank - 1)];
    star.setScale(star.scaleX * 2.2);
    this.scene.tweens.add({ targets: star, scaleX: star.scaleX / 2.2, scaleY: star.scaleY / 2.2, duration: 380, ease: 'Back.easeOut' });
  }
}
