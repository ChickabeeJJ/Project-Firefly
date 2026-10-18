import Phaser from 'phaser';
import { ARDOR_MAX } from '../battle/rules';
import type { Intent, Unit } from '../battle/types';
import { getEnemy } from '../data/enemies';
import type { StatusId } from '../data/types';
import { C, CSS } from '../config/theme';
import { text } from './kit';
import { LivingSprite } from './LivingSprite';
import { dropIn } from '../art/assets';

const FLYERS = new Set(['mothling', 'lampeater']);

export interface UnitLayout {
  x: number;
  y: number;
  scale: number;
}

/** A combatant on the field: sprite, bars, pips, statuses and (for enemies) the intent chip. */
export class UnitView {
  readonly root: Phaser.GameObjects.Container;
  readonly sprite: Phaser.GameObjects.Image | LivingSprite;
  /** The object that receives taps/hover for this unit. */
  readonly hit: Phaser.GameObjects.GameObject;
  private shadow: Phaser.GameObjects.Image;
  private hud: Phaser.GameObjects.Container;
  private hpFill: Phaser.GameObjects.Rectangle;
  private hpLag: Phaser.GameObjects.Rectangle;
  private shieldFill: Phaser.GameObjects.Rectangle;
  private pips: Phaser.GameObjects.Image[] = [];
  private statusRow: Phaser.GameObjects.Container;
  private intentChip?: Phaser.GameObjects.Container;
  private reticle?: Phaser.GameObjects.Image;
  private bob: Phaser.Tweens.Tween;
  readonly height: number;
  readonly flyer: boolean;
  /** Formation position (the root may be offset while animating). */
  readonly homeX: number;
  readonly homeY: number;
  private barW: number;
  hp: number;
  maxHp: number;
  shield = 0;

  constructor(private scene: Phaser.Scene, readonly unit: Unit, layout: UnitLayout) {
    const isEnemy = unit.side === 'enemy';
    this.homeX = layout.x;
    this.homeY = layout.y;
    const kind = isEnemy ? getEnemy(unit.defId).kind : '';
    this.flyer = FLYERS.has(kind);
    const key = isEnemy ? `enemy:${kind}` : `doll:${unit.defId}`;
    this.root = scene.add.container(layout.x, layout.y).setDepth(20 + layout.y / 100);
    this.shadow = scene.add.image(0, 0, 'fx:shadow').setDisplaySize(unit.boss ? 420 : 230, unit.boss ? 70 : 46).setAlpha(0.8);
    if (this.flyer) {
      this.sprite = scene.add.image(0, -50, key).setOrigin(0.5, 1).setScale(layout.scale);
      this.hit = this.sprite;
    } else {
      // Ground units breathe and sway; painted art gets a little more motion than the chibis.
      const painted = !!(isEnemy ? dropIn(scene, 'enemies', unit.defId) : dropIn(scene, 'battle', unit.defId) ?? dropIn(scene, 'characters', unit.defId));
      const ls = new LivingSprite(scene, 0, 4, key, { sway: painted ? 3 : 2, breathe: 0.004, speed: isEnemy ? 0.8 : 1 });
      ls.setScale(layout.scale);
      this.sprite = ls;
      this.hit = ls.hit;
    }
    this.height = this.sprite.displayHeight + (this.flyer ? 50 : 0);
    this.root.add([this.shadow, this.sprite]);

    this.hp = unit.hp;
    this.maxHp = unit.maxHp;
    this.barW = unit.boss ? 280 : 170;
    const hudY = -this.height - 34;
    this.hud = scene.add.container(layout.x, layout.y + hudY).setDepth(48);
    const moodBg = scene.add.image(-this.barW / 2 - 22, 0, `icon:${unit.mood}`).setDisplaySize(40, 40);
    const back = scene.add.rectangle(-this.barW / 2, 0, this.barW, 14, 0x0a0a0c, 0.85).setOrigin(0, 0.5).setStrokeStyle(2, 0x000000, 0.9);
    this.hpLag = scene.add.rectangle(-this.barW / 2 + 1, 0, this.barW - 2, 10, 0xf3ead6, 0.9).setOrigin(0, 0.5);
    this.hpFill = scene.add.rectangle(-this.barW / 2 + 1, 0, this.barW - 2, 10, isEnemy ? C.danger : 0x6fbf73, 1).setOrigin(0, 0.5);
    this.shieldFill = scene.add.rectangle(-this.barW / 2 + 1, -9, 0, 5, C.shield, 1).setOrigin(0, 0.5);
    this.hud.add([back, this.hpLag, this.hpFill, this.shieldFill, moodBg]);
    for (let i = 0; i < ARDOR_MAX; i++) {
      const p = scene.add.image(-this.barW / 2 + 12 + i * 22, 20, 'icon:star4').setDisplaySize(18, 18);
      this.pips.push(p);
      this.hud.add(p);
    }
    this.statusRow = scene.add.container(this.barW / 2 + 16, 0);
    this.hud.add(this.statusRow);
    if (unit.boss) {
      const name = text(scene, 0, -34, unit.name.toUpperCase(), { size: 26, font: 'display', bold: true, color: CSS.goldLight, spacing: 3, shadow: true }).setOrigin(0.5);
      this.hud.add(name);
    }
    this.setHp(unit.hp, unit.shield, false);
    this.setArdor(unit.ardor);

    this.bob = scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - (this.flyer ? 16 : 2),
      duration: this.flyer ? 1300 : 1700 + Math.random() * 500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 600,
    });
  }

  get x(): number {
    return this.root.x;
  }

  get y(): number {
    return this.root.y;
  }

  /** World point at the unit's chest (where effects land). */
  get center(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.root.x, this.root.y - this.height * 0.5);
  }

  get top(): number {
    return this.root.y - this.height;
  }

  setHp(hp: number, shield: number, animate = true): void {
    this.hp = hp;
    this.shield = shield;
    const ratio = Phaser.Math.Clamp(hp / this.maxHp, 0, 1);
    const w = (this.barW - 2) * ratio;
    if (animate) {
      this.hpFill.width = w;
      this.scene.tweens.add({ targets: this.hpLag, width: w, duration: 500, delay: 250, ease: 'Cubic.easeOut' });
    } else {
      this.hpFill.width = w;
      this.hpLag.width = w;
    }
    const sw = Math.min(1, shield / this.maxHp) * (this.barW - 2);
    this.scene.tweens.add({ targets: this.shieldFill, width: sw, duration: animate ? 250 : 0 });
  }

  setArdor(value: number): void {
    this.pips.forEach((p, i) => {
      const on = i < value;
      p.setTint(on ? (value >= ARDOR_MAX ? 0xffe08a : 0xe2a24a) : 0x3a3a40).setAlpha(on ? 1 : 0.8);
    });
  }

  setStatuses(statuses: { id: StatusId; turns: number }[]): void {
    this.statusRow.removeAll(true);
    statuses.forEach((s, i) => {
      const ic = this.scene.add.image(i * 34, 0, `icon:${s.id}`).setDisplaySize(32, 32);
      const n = text(this.scene, i * 34 + 10, 10, String(s.turns), { size: 18, bold: true, color: CSS.cream, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
      this.statusRow.add([ic, n]);
    });
  }

  setIntent(intent: Intent | null | undefined, targetCharId?: string): void {
    this.intentChip?.destroy();
    this.intentChip = undefined;
    if (!intent) return;
    const c = this.scene.add.container(this.homeX, this.homeY - this.height - (this.unit.boss ? 150 : 96)).setDepth(49);
    const w = intent.preview > 0 ? 150 : 96;
    const bg = this.scene.add.nineslice(0, 0, 'ui:dark', undefined, w, 64, 10, 10, 10, 10);
    if (intent.finale) bg.setTint(0xff8a7a);
    const ic = this.scene.add.image(-w / 2 + 32, 0, `icon:${intent.kind}`).setDisplaySize(42, 42);
    c.add([bg, ic]);
    if (intent.preview > 0) {
      c.add(text(this.scene, -w / 2 + 58, 0, String(intent.preview), { size: 28, bold: true, italic: true, color: intent.finale ? '#ffb0a0' : CSS.cream }).setOrigin(0, 0.5));
    }
    if (targetCharId) {
      c.add(this.scene.add.image(w / 2 + 8, 0, `head:${targetCharId}`).setDisplaySize(48, 48));
    }
    if (intent.finale) {
      c.add(text(this.scene, 0, -44, 'FINALE', { size: 22, font: 'display', bold: true, color: '#ff9a8a', spacing: 4, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5));
      this.scene.tweens.add({ targets: c, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    c.setAlpha(0).setY(c.y + 10);
    this.scene.tweens.add({ targets: c, alpha: 1, y: c.y - 10, duration: 260, ease: 'Cubic.easeOut' });
    this.intentChip = c;
  }

  pulseIntent(): void {
    if (!this.intentChip) return;
    const chip = this.intentChip;
    this.intentChip = undefined;
    this.scene.tweens.add({ targets: chip, scale: 1.3, alpha: 0, duration: 300, onComplete: () => chip.destroy() });
  }

  setTargeted(on: boolean): void {
    if (on && !this.reticle) {
      this.reticle = this.scene.add.image(this.homeX, this.homeY + 2, 'fx:ring').setDisplaySize(240, 64).setTint(C.amberLight).setAlpha(0.9).setDepth(19);
      this.scene.tweens.add({ targets: this.reticle, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    } else if (!on && this.reticle) {
      this.reticle.destroy();
      this.reticle = undefined;
    }
  }

  hitFlash(strong = false): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
    const dir = this.unit.side === 'ally' ? -1 : 1;
    this.scene.tweens.add({ targets: this.root, x: this.root.x + dir * (strong ? 26 : 14), duration: 60, yoyo: true, ease: 'Quad.easeOut' });
    if (this.sprite instanceof LivingSprite) this.sprite.pose(dir * (strong ? 22 : 12), -0.012, 70, 60);
  }

  lunge(toward: number, distance = 70): Promise<void> {
    return new Promise((resolve) => {
      const dir = Math.sign(toward - this.root.x) || 1;
      if (this.sprite instanceof LivingSprite) this.sprite.pose(dir * 26, -0.01, 140, 120);
      this.scene.tweens.add({
        targets: this.root, x: this.root.x + dir * distance, duration: 140, yoyo: true, hold: 120, ease: 'Cubic.easeOut',
        onYoyo: () => resolve(),
      });
    });
  }

  /** Rises onto the toes and leans back: a spell being drawn. */
  castPose(): void {
    if (!(this.sprite instanceof LivingSprite)) return;
    const back = this.unit.side === 'ally' ? -18 : 18;
    this.sprite.pose(back, 0.012, 180, 160);
  }

  die(): Promise<void> {
    this.bob.stop();
    this.setIntent(null);
    this.setTargeted(false);
    return new Promise((resolve) => {
      if (this.unit.side === 'enemy') {
        this.scene.tweens.add({ targets: [this.root, this.hud], alpha: 0, duration: 650, ease: 'Sine.easeIn', onComplete: () => resolve() });
        this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 40, scaleX: this.sprite.scaleX * 0.9, duration: 650 });
      } else {
        this.sprite.setTint(0x6a6a7a);
        this.scene.tweens.add({ targets: this.root, alpha: 0.35, duration: 500, onComplete: () => resolve() });
        if (this.sprite instanceof LivingSprite) this.sprite.lean = -30;
        this.scene.tweens.add({ targets: this.sprite, angle: -8, y: this.sprite.y + 6, duration: 500 });
        this.hud.setAlpha(0.3);
      }
    });
  }

  appear(delay = 0): void {
    this.root.setAlpha(0);
    this.hud.setAlpha(0);
    const dx = this.unit.side === 'enemy' ? 80 : -80;
    this.root.x += dx;
    this.scene.tweens.add({ targets: this.root, x: this.root.x - dx, alpha: 1, duration: 480, delay, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: this.hud, alpha: 1, duration: 300, delay: delay + 300 });
  }

  setInteractive(cb: () => void): void {
    this.hit.setInteractive({ useHandCursor: true });
    this.hit.on('pointerup', cb);
  }

  destroy(): void {
    this.bob.stop();
    this.intentChip?.destroy();
    this.reticle?.destroy();
    this.hud.destroy();
    this.root.destroy();
  }
}
