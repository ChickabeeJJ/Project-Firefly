import Phaser from 'phaser';
import { audio, type Sfx } from '../audio/AudioController';
import { C, CSS, FONT_BODY, FONT_DISPLAY, FONT_LETTER, H, W } from '../config/theme';

// Shared UI building blocks. Everything is sized for the 1920×1080 logical canvas; the smallest
// body text is 24 px so it stays legible in the 907×510 embed.

export interface TextOpts {
  size?: number;
  font?: 'display' | 'body' | 'letter';
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  stroke?: string;
  strokeThickness?: number;
  spacing?: number;
  shadow?: boolean;
  lineSpacing?: number;
}

export function text(scene: Phaser.Scene, x: number, y: number, str: string, o: TextOpts = {}): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: o.font === 'display' ? FONT_DISPLAY : o.font === 'letter' ? FONT_LETTER : FONT_BODY,
    fontSize: `${o.size ?? 28}px`,
    color: o.color ?? CSS.cream,
    fontStyle: `${o.italic ? 'italic ' : ''}${o.bold ? 'bold' : ''}`.trim() || 'normal',
    align: o.align ?? 'left',
  };
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  if (o.stroke) {
    style.stroke = o.stroke;
    style.strokeThickness = o.strokeThickness ?? 4;
  }
  const t = scene.add.text(x, y, str, style);
  if (o.spacing) t.setLetterSpacing(o.spacing);
  if (o.lineSpacing) t.setLineSpacing(o.lineSpacing);
  if (o.shadow) t.setShadow(0, 3, 'rgba(0,0,0,0.65)', 8, true, true);
  return t;
}

/**
 * Subtle press feedback shared by every clickable: a thin gold ring that widens and fades,
 * plus a soft glow. Coordinates are world space.
 */
export function pressFx(scene: Phaser.Scene, x: number, y: number, size = 90, depth = 4000): void {
  const ring = scene.add.circle(x, y, size * 0.3).setStrokeStyle(2, C.gold, 0.85).setDepth(depth);
  scene.tweens.add({ targets: ring, radius: size * 0.62, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  const g = scene.add.image(x, y, 'fx:glow').setTint(0xffe6b0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(size * 1.1, size * 1.1).setAlpha(0.35).setDepth(depth);
  scene.tweens.add({ targets: g, alpha: 0, duration: 320, onComplete: () => g.destroy() });
}

/** Makes a container behave like a soft physical button: lift on hover, dip on press, ring on release. */
export function softPress(c: Phaser.GameObjects.Container, onClick: () => void, sfx: Sfx = 'tap', lift = 1.04): void {
  const scene = c.scene;
  let down = false;
  const base = c.scale;
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: base * lift, duration: 140, ease: 'Sine.easeOut' }));
  c.on('pointerout', () => {
    down = false;
    scene.tweens.add({ targets: c, scale: base, duration: 160, ease: 'Sine.easeOut' });
  });
  c.on('pointerdown', () => {
    down = true;
    scene.tweens.add({ targets: c, scale: base * 0.96, duration: 80, ease: 'Sine.easeOut' });
  });
  c.on('pointerup', () => {
    if (!down) return;
    down = false;
    scene.tweens.add({ targets: c, scale: base * lift, duration: 140, ease: 'Back.easeOut' });
    const m = c.getWorldTransformMatrix();
    pressFx(scene, m.tx, m.ty, Math.min(220, Math.max(c.width, c.height) * base));
    audio.sfx(sfx);
    onClick();
  });
}

export type ButtonStyle = 'amber' | 'cream' | 'dark' | 'gold';

const BTN_TEX: Record<ButtonStyle, string> = { amber: 'ui:btnAmber', cream: 'ui:btnCream', dark: 'ui:btnDark', gold: 'ui:btnGold' };
const BTN_TEXT: Record<ButtonStyle, string> = { amber: '#fff4e4', cream: CSS.paperText, dark: CSS.cream, gold: '#2a1e0c' };

export interface ButtonOpts {
  w: number;
  h: number;
  label: string;
  style?: ButtonStyle;
  size?: number;
  icon?: string;
  sub?: string;
  sfx?: Sfx;
  /** Label typeface: 'display' (engraved capitals, default) or 'body' (book serif, tighter). */
  font?: 'display' | 'body';
  onClick: () => void;
}

/** Paper/amber button with hover, press and disabled states. Click fires on release inside. */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  private subText?: Phaser.GameObjects.Text;
  private enabled = true;
  private pressed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, o: ButtonOpts) {
    super(scene, x, y);
    const style = o.style ?? 'amber';
    this.bg = scene.add.nineslice(0, 0, BTN_TEX[style], undefined, o.w, o.h, 16, 16, 16, 16);
    this.add(this.bg);
    const iconOnly = !!o.icon && !o.label;
    const iconW = o.icon && !iconOnly ? 44 : 0;
    const ly = o.sub ? -10 : 0;
    const body = o.font === 'body';
    this.label = text(scene, iconW / 2, ly, o.label, { size: o.size ?? 32, font: body ? 'body' : 'display', bold: !body, italic: body, color: BTN_TEXT[style], spacing: body ? 0 : 1 }).setOrigin(0.5);
    this.add(this.label);
    if (o.icon) {
      // Icon-only buttons (✕, back) sit dead centre; otherwise the icon leads the label.
      const isz = iconOnly ? Math.min(o.w, o.h) * 0.56 : 44;
      const ic = scene.add.image(iconOnly ? 0 : this.label.x - this.label.width / 2 - 28, ly, `icon:${o.icon}`).setDisplaySize(isz, isz);
      this.add(ic);
    }
    if (o.sub) {
      this.subText = text(scene, 0, 24, o.sub, { size: 22, color: style === 'amber' ? '#ffe2c8' : CSS.paperSub }).setOrigin(0.5);
      this.add(this.subText);
    }
    this.setSize(o.w, o.h);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.enabled && scene.tweens.add({ targets: this, scale: 1.03, duration: 120, ease: 'Sine.easeOut' }));
    this.on('pointerout', () => {
      this.pressed = false;
      scene.tweens.add({ targets: this, scale: 1, duration: 140, ease: 'Sine.easeOut' });
    });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      this.pressed = true;
      scene.tweens.add({ targets: this, scale: 0.96, duration: 70, ease: 'Sine.easeOut' });
    });
    this.on('pointerup', () => {
      if (!this.pressed) return;
      this.pressed = false;
      scene.tweens.add({ targets: this, scale: 1.03, duration: 160, ease: 'Back.easeOut' });
      const m = this.getWorldTransformMatrix();
      pressFx(scene, m.tx, m.ty, Math.min(220, Math.max(o.w, o.h) * 1.1));
      audio.sfx(o.sfx ?? 'tap');
      o.onClick();
    });
    scene.add.existing(this);
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.45);
    if (!on) this.setScale(1);
    return this;
  }

  setLabel(s: string): this {
    this.label.setText(s);
    return this;
  }

  setSub(s: string): this {
    this.subText?.setText(s);
    return this;
  }
}

/** Diamond icon button (corner HUD). */
export class DiamondButton extends Phaser.GameObjects.Container {
  private icon: Phaser.GameObjects.Image;
  private plate: Phaser.GameObjects.Graphics;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, iconKey: string, private onClick: () => void, size = 76) {
    super(scene, x, y);
    this.plate = scene.add.graphics();
    this.draw(size);
    this.icon = scene.add.image(0, 0, `icon:${iconKey}`).setDisplaySize(size * 0.5, size * 0.5);
    this.add([this.plate, this.icon]);
    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setScale(1.06));
    this.on('pointerout', () => this.setScale(1));
    this.on('pointerup', () => {
      audio.sfx('tap');
      this.onClick();
    });
    scene.add.existing(this);
  }

  private draw(size: number): void {
    const h = size / 2;
    this.plate.clear();
    this.plate.fillStyle(this.lit ? C.amber : 0xd9d4c4, this.lit ? 0.85 : 0.18);
    this.plate.lineStyle(2, this.lit ? C.gold : 0xe8e0cc, this.lit ? 0.9 : 0.45);
    this.plate.beginPath();
    this.plate.moveTo(0, -h);
    this.plate.lineTo(h, 0);
    this.plate.lineTo(0, h);
    this.plate.lineTo(-h, 0);
    this.plate.closePath();
    this.plate.fillPath();
    this.plate.strokePath();
  }

  setOn(on: boolean): this {
    this.lit = on;
    this.draw(this.width);
    return this;
  }

  setIcon(key: string): this {
    this.icon.setTexture(`icon:${key}`);
    return this;
  }
}

/** Small cream notice that slides in at the top right (like the reference's toasts). */
/**
 * Notice slip in the top-right corner, stacked like letters on a hall table: a parchment card
 * with a sealed-wax medallion for its icon. Several stack downwards and each slides away alone.
 */
export function toast(scene: Phaser.Scene, message: string, iconKey = 'star4'): void {
  const used = new Set(scene.children.list.filter((o) => o.getData && o.getData('toast')).map((o) => o.getData('slot') as number));
  let slot = 0;
  while (used.has(slot)) slot++;
  const w = 430;
  const label = text(scene, 0, 0, message, { size: 23, color: CSS.paperText, wrap: w - 128, lineSpacing: 2 });
  const h = Math.max(86, label.height + 34);
  const y = 118 + slot * 112;
  const c = scene.add.container(W + w, y).setDepth(5000).setData('toast', true).setData('slot', slot);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.3).fillRect(-w + 5, -h / 2 + 6, w, h);
  g.fillGradientStyle(0xfaf3ea, 0xfaf3ea, 0xeadfcd, 0xeadfcd, 1).fillRect(-w, -h / 2, w, h);
  g.fillStyle(0x7a2a24, 0.85).fillRect(-w, -h / 2, 5, h);
  g.lineStyle(1, 0xb9a888, 0.9).strokeRect(-w, -h / 2, w, h);
  const bx = -w + 50;
  g.fillStyle(0xf4e9dc, 1).fillCircle(bx, 0, 30);
  g.lineStyle(2.5, 0x7a2a24, 0.95).strokeCircle(bx, 0, 30);
  g.lineStyle(1, 0x7a2a24, 0.4).strokeCircle(bx, 0, 24);
  const ic = scene.add.image(bx, 0, `icon:${iconKey}`).setDisplaySize(36, 36);
  label.setOrigin(0, 0.5).setPosition(-w + 96, 0);
  c.add([g, ic, label]);
  scene.tweens.add({ targets: c, x: W - 22 - (slot % 2) * 18, duration: 320, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: c, x: W + w + 20, alpha: 0, delay: 3200, duration: 320, ease: 'Cubic.easeIn',
    onComplete: () => c.destroy(),
  });
}

/** Vignette, grain, drifting dust and wandering fireflies: the shared atmosphere layer. */
export class Atmosphere {
  private grain: Phaser.GameObjects.TileSprite;
  private flies: { s: Phaser.GameObjects.Image; bx: number; by: number; ph: number; sp: number; r: number }[] = [];
  private motes: { s: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; ph: number }[] = [];

  constructor(scene: Phaser.Scene, opts: { fireflies?: number; dust?: boolean; depth?: number; vignette?: number } = {}) {
    const depth = opts.depth ?? 900;
    scene.add.image(W / 2, H / 2, 'fx:vignette').setDisplaySize(W, H).setDepth(depth).setAlpha(opts.vignette ?? 1);
    this.grain = scene.add.tileSprite(W / 2, H / 2, W, H, 'fx:grain').setDepth(depth + 1).setAlpha(0.045).setBlendMode(Phaser.BlendModes.OVERLAY);
    if (opts.dust !== false) {
      for (let i = 0; i < 36; i++) {
        const s = scene.add.image(0, 0, 'fx:dot').setBlendMode(Phaser.BlendModes.ADD).setDepth(depth - 5).setTint(0xe8e0c8).setScale(0.04 + Math.random() * 0.08);
        this.motes.push({ s, x: Math.random() * W, y: Math.random() * H, vx: -6 + Math.random() * 18, vy: -8 + Math.random() * 12, ph: Math.random() * 10 });
      }
    }
    for (let i = 0; i < (opts.fireflies ?? 0); i++) {
      const s = scene.add.image(0, 0, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setDepth(depth - 4).setScale(0.6 + Math.random() * 0.5);
      this.flies.push({ s, bx: Math.random() * W, by: 200 + Math.random() * (H - 300), ph: Math.random() * 100, sp: 0.3 + Math.random() * 0.5, r: 40 + Math.random() * 90 });
    }
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }

  private update(time: number, delta: number): void {
    this.grain.tilePositionX = (time * 0.37) % 256 | 0;
    this.grain.tilePositionY = (time * 0.53) % 256 | 0;
    const t = time / 1000;
    const dt = Math.min(delta, 100) / 1000;
    for (const m of this.motes) {
      m.x = (m.x + m.vx * dt + W) % W;
      m.y = (m.y + m.vy * dt + H) % H;
      m.s.setPosition(m.x, m.y).setAlpha(0.45 * Math.max(0, Math.sin(t * 0.4 + m.ph)));
    }
    for (const f of this.flies) {
      const a = t * f.sp + f.ph;
      f.s.setPosition(f.bx + Math.sin(a * 1.3) * f.r, f.by + Math.cos(a * 0.9) * f.r * 0.6 + Math.sin(a * 2.1) * 12);
      f.s.setAlpha(0.35 + 0.65 * Math.max(0, Math.sin(a * 2.4 + f.ph)));
    }
  }
}

/** Fade out then start another scene. */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (scene.data.get('leaving')) return;
  scene.data.set('leaving', true);
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(260, 8, 8, 10);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
}

export function fadeIn(scene: Phaser.Scene): void {
  scene.data.set('leaving', false);
  scene.cameras.main.fadeIn(320, 8, 8, 10);
}

/** Thin gold rule with a centred diamond, used to frame headings. */
export function ornament(scene: Phaser.Scene, x: number, y: number, w: number, color: number = C.gold, alpha = 0.7): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(2, color, alpha);
  g.lineBetween(x - w / 2, y, x - 14, y);
  g.lineBetween(x + 14, y, x + w / 2, y);
  g.fillStyle(color, alpha);
  g.fillPoints([new Phaser.Math.Vector2(x, y - 7), new Phaser.Math.Vector2(x + 7, y), new Phaser.Math.Vector2(x, y + 7), new Phaser.Math.Vector2(x - 7, y)], true);
  return g;
}

export function rarityStars(scene: Phaser.Scene, x: number, y: number, rarity: number, size = 22, color: number = C.gold): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const total = rarity;
  for (let i = 0; i < total; i++) {
    c.add(scene.add.image((i - (total - 1) / 2) * size * 1.05, 0, 'icon:star4').setDisplaySize(size, size).setTint(color));
  }
  return c;
}

/**
 * Makes `content` scroll vertically inside `area` (world rect) by dragging or with the mouse
 * wheel, with a little momentum and no scroll bar. `height` is the content's full height.
 * Returns `wasDrag()`, true just after a drag, so taps on children can ignore drag releases.
 */
export function scrollable(scene: Phaser.Scene, content: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, height: number): { wasDrag: () => boolean; visible: (worldY: number) => boolean } {
  const maskG = scene.make.graphics({}).fillRect(area.x, area.y, area.width, area.height);
  content.setMask(maskG.createGeometryMask());
  const top = content.y;
  const min = Math.min(top, top - (height - area.height));
  let vel = 0;
  let dragY: number | null = null;
  let moved = 0;
  let lastDrag = 0;
  const clamp = (y: number) => Phaser.Math.Clamp(y, min, top);
  const inside = (p: Phaser.Input.Pointer) => area.contains(p.x, p.y);
  const onDown = (p: Phaser.Input.Pointer) => {
    if (!inside(p)) return;
    dragY = p.y;
    moved = 0;
    vel = 0;
  };
  const onMove = (p: Phaser.Input.Pointer) => {
    if (dragY === null || !p.isDown) return;
    const dy = p.y - dragY;
    dragY = p.y;
    moved += Math.abs(dy);
    vel = dy;
    content.y = clamp(content.y + dy);
  };
  const onUp = () => {
    if (dragY !== null && moved > 12) lastDrag = scene.time.now;
    dragY = null;
  };
  const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
    if (!inside(p)) return;
    vel = 0;
    scene.tweens.add({ targets: content, y: clamp(content.y - dy * 0.9), duration: 160, ease: 'Sine.easeOut' });
  };
  const onUpdate = () => {
    if (dragY !== null || Math.abs(vel) < 0.2) return;
    vel *= 0.92;
    content.y = clamp(content.y + vel);
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('wheel', onWheel);
  scene.events.on('update', onUpdate);
  content.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.input.off('wheel', onWheel);
    scene.events.off('update', onUpdate);
    maskG.destroy();
  });
  return {
    wasDrag: () => scene.time.now - lastDrag < 80 || moved > 12,
    visible: (worldY: number) => worldY > area.y && worldY < area.bottom,
  };
}

/** The shared plinth every painted menu icon stands on: a soft floor shadow and a thin gilt ring. */
export function iconPlinth(scene: Phaser.Scene, x: number, y: number, w: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.42).fillEllipse(x, y + 2, w * 0.92, w * 0.17);
  g.fillStyle(0xe2be6a, 0.1).fillEllipse(x, y, w, w * 0.2);
  g.lineStyle(1.5, 0xe2be6a, 0.55).strokeEllipse(x, y, w, w * 0.2);
  g.lineStyle(1, 0xf3dc9c, 0.25).strokeEllipse(x, y - 1, w * 0.7, w * 0.13);
  return g;
}
