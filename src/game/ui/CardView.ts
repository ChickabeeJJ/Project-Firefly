import Phaser from 'phaser';
import { CARD_H, CARD_W } from '../art/cardArt';
import { FRAME } from '../art/cardFrame';
import { TYPE_LABEL } from '../battle/describe';
import type { Card } from '../battle/types';
import { findVerse } from '../data/characters';
import { C, CSS, TYPE_CSS } from '../config/theme';
import { text } from './kit';

export const HAND_SCALE = 0.6;
export const CARD_DW = CARD_W * HAND_SCALE;
export const CARD_DH = CARD_H * HAND_SCALE;

const TYPE_ICON: Record<string, string> = {
  attack: 'attack', mass: 'mass', heal: 'heal', shield: 'shield', buff: 'buff', debuff: 'debuff',
};

/**
 * A verse card: illustration inside the gilt playbill frame (see art/cardFrame), the caster's
 * portrait in the medallion, rank stars in the top cartouche, a type seal and an engraved plate.
 * Built at native card resolution (264×404) and scaled by its owner.
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
    const fin = card.finale;

    this.litGlow = scene.add.image(0, 0, 'card:auraLit').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.selectGlow = scene.add.image(0, 0, 'card:auraSelect').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.add([this.litGlow, this.selectGlow]);
    if (fin) {
      const aura = scene.add.image(0, 0, 'card:auraGold').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
      this.add(aura);
      scene.tweens.add({ targets: aura, alpha: 0.95, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const art = scene.add.image(0, 0, `card:${verse.id}`);
    const frame = scene.add.image(0, 0, fin ? 'card:frameGold' : 'card:frame');
    this.add([art, frame]);

    // Rank stars sit in the cartouche; Finales show a crown of three gold stars.
    for (let i = 0; i < 3; i++) {
      const s = scene.add.image(FRAME.rank.x - CARD_W / 2 + (i - 1) * 30, FRAME.rank.y - CARD_H / 2, 'icon:star4').setDisplaySize(26, 26);
      this.stars.push(s);
      this.add(s);
    }

    const m = FRAME.medal;
    this.add(scene.add.image(m.x - CARD_W / 2, m.y - CARD_H / 2, `head:${charId}`).setDisplaySize(m.r * 2, m.r * 2));

    // Type seal + engraved type on the plate.
    const typeColor = fin ? CSS.gold : TYPE_CSS[verse.type];
    const sx = FRAME.seal.x - CARD_W / 2;
    const sy = FRAME.seal.y - CARD_H / 2;
    this.add(scene.add.image(sx, sy, `icon:${fin ? 'star4' : TYPE_ICON[verse.type]}`).setDisplaySize(28, 28));
    const plateMid = (FRAME.plateY + CARD_H - 7) / 2 - CARD_H / 2 + 8;
    const label = text(scene, 0, plateMid, fin ? 'FINALE' : TYPE_LABEL[verse.type].toUpperCase(), {
      size: 30, font: 'display', bold: true, color: typeColor, spacing: 5, stroke: '#08070a', strokeThickness: 3,
    }).setOrigin(0.5);
    if (label.width > CARD_W - 64) label.setScale((CARD_W - 64) / label.width);
    this.add(label);

    this.fly = scene.add.image(CARD_W / 2 - 30, -CARD_H / 2 + 34, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setScale(1.5).setVisible(false);
    this.add(this.fly);

    if (fin) {
      // Glints wandering over the gold leaf.
      for (let k = 0; k < 2; k++) {
        const g = scene.add.image(0, 0, 'icon:star4').setTint(0xfff3c8).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(22, 22).setAlpha(0);
        this.add(g);
        const hop = () => {
          if (!g.active) return;
          const edge = Phaser.Math.Between(0, 3);
          const px = edge < 2 ? Phaser.Math.Between(-CARD_W / 2 + 10, CARD_W / 2 - 10) : (edge === 2 ? -1 : 1) * (CARD_W / 2 - 6);
          const py = edge >= 2 ? Phaser.Math.Between(-CARD_H / 2 + 10, CARD_H / 2 - 10) : (edge === 0 ? -1 : 1) * (CARD_H / 2 - 6);
          g.setPosition(px, py).setAngle(0);
          scene.tweens.add({ targets: g, alpha: 1, angle: 90, duration: 380, yoyo: true, onComplete: () => scene.time.delayedCall(Phaser.Math.Between(300, 1400), hop) });
        };
        scene.time.delayedCall(k * 700, hop);
      }
    }

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
      s.setTint(this.card.finale ? 0xf6d27a : on ? C.accentStar : 0x4a4650).setAlpha(on ? 1 : 0.7);
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
