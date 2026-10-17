import Phaser from 'phaser';
import { C, CSS, H, W } from '../config/theme';
import { text } from './kit';

/** Reusable battle feedback. Functional effects (hits, heals, statuses) always win over decoration. */
export class BattleFx {
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private motes: Phaser.GameObjects.Particles.ParticleEmitter;
  readonly dim: Phaser.GameObjects.Rectangle;

  constructor(private scene: Phaser.Scene) {
    this.dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 1).setAlpha(0).setDepth(15);
    this.sparks = scene.add.particles(0, 0, 'fx:spark', {
      lifespan: { min: 300, max: 600 }, speed: { min: 160, max: 520 }, scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 }, blendMode: Phaser.BlendModes.ADD, emitting: false,
    }).setDepth(55);
    this.motes = scene.add.particles(0, 0, 'fx:dot', {
      lifespan: { min: 600, max: 1100 }, speed: { min: 30, max: 140 }, scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 }, gravityY: -120, blendMode: Phaser.BlendModes.ADD, emitting: false,
    }).setDepth(55);
  }

  setDim(alpha: number, duration = 220): void {
    this.scene.tweens.add({ targets: this.dim, alpha, duration });
  }

  burst(x: number, y: number, color: number, count = 14): void {
    this.sparks.setParticleTint(color);
    this.sparks.explode(count, x, y);
  }

  rise(x: number, y: number, color: number, count = 16): void {
    this.motes.setParticleTint(color);
    this.motes.explode(count, x, y);
  }

  ring(x: number, y: number, color: number, size = 260, duration = 500, flat = false): void {
    const r = this.scene.add.image(x, y, 'fx:ring').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(54)
      .setDisplaySize(size * 0.3, flat ? size * 0.09 : size * 0.3).setAlpha(1);
    this.scene.tweens.add({
      targets: r, displayWidth: size, displayHeight: flat ? size * 0.3 : size, alpha: 0, duration, ease: 'Cubic.easeOut',
      onComplete: () => r.destroy(),
    });
  }

  glowAt(x: number, y: number, color: number, size = 300, duration = 500): void {
    const g = this.scene.add.image(x, y, 'fx:glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(53).setDisplaySize(size, size).setAlpha(0.9);
    this.scene.tweens.add({ targets: g, alpha: 0, scale: g.scale * 1.3, duration, onComplete: () => g.destroy() });
  }

  slash(x: number, y: number, color: number, flip = false, scale = 1): void {
    const s = this.scene.add.image(x, y, 'fx:slash').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(56)
      .setAngle(Phaser.Math.Between(-35, 15)).setFlipX(flip).setScale(0.4 * scale).setAlpha(1);
    this.scene.tweens.add({ targets: s, scale: 1.1 * scale, alpha: 0, duration: 280, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
  }

  beam(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, color: number): void {
    const len = Phaser.Math.Distance.BetweenPoints(from, to);
    const b = this.scene.add.image(from.x, from.y, 'fx:beam').setOrigin(0, 0.5).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(54)
      .setRotation(Phaser.Math.Angle.BetweenPoints(from, to)).setDisplaySize(len, 46).setAlpha(0);
    this.scene.tweens.add({ targets: b, alpha: 1, duration: 90, yoyo: true, hold: 120, onComplete: () => b.destroy() });
  }

  /** Large italic serif number, gold for critical hits — the reference's signature feedback. */
  number(x: number, y: number, value: number, kind: 'dmg' | 'crit' | 'heal' | 'shield' | 'dot' | 'absorb'): void {
    const style = {
      dmg: { size: 58, color: '#fbf3e2', stroke: '#1a0e0c' },
      crit: { size: 80, color: CSS.goldLight, stroke: '#3a1a08' },
      heal: { size: 52, color: CSS.heal, stroke: '#0c2414' },
      shield: { size: 44, color: CSS.shield, stroke: '#0c1824' },
      dot: { size: 42, color: '#ffb070', stroke: '#2a1206' },
      absorb: { size: 38, color: CSS.shield, stroke: '#0c1824' },
    }[kind];
    const prefix = kind === 'heal' || kind === 'shield' ? '+' : '';
    const t = text(this.scene, x + Phaser.Math.Between(-24, 24), y, `${prefix}${value}`, {
      size: style.size, bold: true, italic: true, color: style.color, stroke: style.stroke, strokeThickness: kind === 'crit' ? 8 : 6,
    }).setOrigin(0.5).setDepth(60).setScale(1.5);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: kind === 'crit' ? 700 : 480, duration: 420, ease: 'Sine.easeIn', onComplete: () => t.destroy() });
    if (kind === 'crit') {
      const c = text(this.scene, t.x, y - 52, 'CRITICAL', { size: 24, font: 'display', bold: true, color: CSS.gold, spacing: 4, stroke: '#2a1206', strokeThickness: 4 }).setOrigin(0.5).setDepth(60);
      this.scene.tweens.add({ targets: c, y: y - 110, alpha: 0, delay: 600, duration: 400, onComplete: () => c.destroy() });
    }
  }

  label(x: number, y: number, str: string, color: string): void {
    const t = text(this.scene, x, y, str, { size: 32, italic: true, bold: true, color, stroke: '#0a0a0c', strokeThickness: 5 }).setOrigin(0.5).setDepth(61).setAlpha(0);
    this.scene.tweens.add({ targets: t, alpha: 1, y: y - 24, duration: 200 });
    this.scene.tweens.add({ targets: t, alpha: 0, y: y - 70, delay: 760, duration: 360, onComplete: () => t.destroy() });
  }

  /** Bezier flight of a firefly between two points. */
  flyFirefly(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, duration = 700): Promise<void> {
    return new Promise((resolve) => {
      const f = this.scene.add.image(from.x, from.y, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setDepth(400).setScale(1.4);
      const ctrl = new Phaser.Math.Vector2((from.x + to.x) / 2 + Phaser.Math.Between(-120, 120), Math.min(from.y, to.y) - 160);
      const curve = new Phaser.Curves.QuadraticBezier(from, ctrl, to);
      const o = { t: 0 };
      this.scene.tweens.add({
        targets: o, t: 1, duration, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const p = curve.getPoint(o.t);
          f.setPosition(p.x, p.y);
          if (Math.random() < 0.5) this.rise(p.x, p.y, C.firefly, 1);
        },
        onComplete: () => {
          f.destroy();
          resolve();
        },
      });
    });
  }

  shake(intensity = 0.004, duration = 160): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(color = 0xffffff, duration = 120, alpha = 0.5): void {
    const r = this.scene.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(700).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: r, alpha: 0, duration, onComplete: () => r.destroy() });
  }

  /** Short centred banner ("WAVE 2", "ROUND 3"). */
  banner(str: string, sub?: string, color: string = CSS.cream): Promise<void> {
    return new Promise((resolve) => {
      const c = this.scene.add.container(W / 2, H * 0.42).setDepth(650).setAlpha(0);
      const band = this.scene.add.rectangle(0, 0, W, sub ? 150 : 110, 0x07080a, 0.72);
      const t = text(this.scene, 0, sub ? -18 : 0, str, { size: 64, font: 'display', bold: true, color, spacing: 12, shadow: true }).setOrigin(0.5);
      c.add([band, t]);
      if (sub) c.add(text(this.scene, 0, 40, sub, { size: 28, italic: true, color: CSS.creamDim }).setOrigin(0.5));
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
      this.scene.tweens.add({ targets: t, scaleX: { from: 1.25, to: 1 }, duration: 380, ease: 'Cubic.easeOut' });
      this.scene.tweens.add({ targets: c, alpha: 0, delay: 900, duration: 260, onComplete: () => { c.destroy(); resolve(); } });
    });
  }

  /** Finale cut-in: a diagonal band sweeps in with the caster's portrait and the verse name. */
  cutIn(portraitKey: string, name: string, title: string, color: number): Promise<void> {
    return new Promise((resolve) => {
      const c = this.scene.add.container(0, 0).setDepth(680);
      const shade = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
      const band = this.scene.add.rectangle(W / 2, H / 2, W * 1.4, 420, color, 0.92).setAngle(-8);
      const band2 = this.scene.add.rectangle(W / 2, H / 2 + 230, W * 1.4, 18, C.gold, 1).setAngle(-8);
      const band3 = this.scene.add.rectangle(W / 2, H / 2 - 230, W * 1.4, 8, C.gold, 0.8).setAngle(-8);
      const lines = this.scene.add.graphics();
      lines.lineStyle(3, 0xffffff, 0.25);
      for (let i = 0; i < 26; i++) {
        const y = H / 2 - 200 + i * 16;
        lines.lineBetween(-200, y + 120, W + 200, y - 160);
      }
      const portrait = this.scene.add.image(-300, H / 2 + 420, portraitKey).setOrigin(0.5, 1).setScale(0.62);
      const nm = text(this.scene, W + 400, H / 2 - 30, name, { size: 92, font: 'display', bold: true, color: '#fff8ea', spacing: 6, stroke: '#1a1012', strokeThickness: 10 }).setOrigin(0.5);
      const tt = text(this.scene, W + 400, H / 2 + 60, title, { size: 34, italic: true, color: CSS.goldLight, stroke: '#1a1012', strokeThickness: 6 }).setOrigin(0.5);
      c.add([shade, band, lines, band2, band3, portrait, nm, tt]);
      c.setAlpha(0);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
      this.scene.tweens.add({ targets: portrait, x: 560, duration: 420, ease: 'Cubic.easeOut' });
      this.scene.tweens.add({ targets: [nm, tt], x: 1240, duration: 420, delay: 80, ease: 'Cubic.easeOut' });
      this.scene.time.delayedCall(1250, () => {
        this.flash(0xfff2d0, 220, 0.8);
        this.scene.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => { c.destroy(); resolve(); } });
      });
    });
  }
}
