import Phaser from 'phaser';
import { idleVideoUrl, isDropIn } from '../art/assets';

// Brings still character art to life without extra frames. The texture is cut into thin
// horizontal strips and every strip is shifted and stretched each frame: the feet stay planted
// while the body sways, breathes, and hair/cloth ripple upward. `lean` and `squash` are public so
// battle code can tween them for attacks, hits and casts. Works on WebGL and Canvas alike.

export interface LivingOpts {
  /** Number of strips (more = smoother bends). */
  strips?: number;
  /** Horizontal sway at the top of the figure, in texture px. */
  sway?: number;
  /** Travelling ripple amplitude (hair, capes), in texture px. */
  flutter?: number;
  /** Chest-width breathing, as a fraction (0.02 = 2 %). */
  breathe?: number;
  /** Animation speed multiplier. */
  speed?: number;
}

interface Strip {
  img: Phaser.GameObjects.Image;
  y0: number;
  /** 0 at the top of the texture, 1 at the feet. */
  v: number;
}

export class LivingSprite extends Phaser.GameObjects.Container {
  private strips: Strip[] = [];
  private readonly texW: number;
  private readonly texH: number;
  private readonly o: Required<LivingOpts>;
  private readonly phase = Math.random() * Math.PI * 2;
  private clock = 0;
  /** Extra lean at the top of the figure (texture px, + = right). Tween it for actions. */
  lean = 0;
  /** Extra vertical stretch (+) or squash (−), e.g. 0.05. Tween it for actions. */
  squash = 0;
  /** Invisible hit box covering the figure (containers have no pixel hit test). */
  readonly hit: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, opts: LivingOpts = {}) {
    super(scene, x, y);
    this.o = { strips: 24, sway: 4, flutter: 2.5, breathe: 0.012, speed: 1, ...opts };
    const tex = scene.textures.get(key);
    // Not tex.get(): adding strip frames makes the first strip the texture's "first frame".
    const base = tex.get('__BASE');
    this.texW = base.width;
    this.texH = base.height;
    const n = this.o.strips;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor((i * this.texH) / n);
      const y1 = Math.min(this.texH, Math.floor(((i + 1) * this.texH) / n) + 1);
      const name = `__ls${n}_${i}`;
      if (!tex.has(name)) tex.add(name, 0, base.cutX, base.cutY + y0, this.texW, y1 - y0);
      const img = scene.add.image(0, y0 - this.texH, key, name).setOrigin(0.5, 0);
      this.add(img);
      this.strips.push({ img, y0, v: (y0 + (y1 - y0) / 2) / this.texH });
    }
    // Keep plain images of this texture (Atlas, portraits…) showing the whole picture.
    tex.firstFrame = '__BASE';
    this.hit = scene.add.zone(0, -this.texH / 2, this.texW * 0.7, this.texH * 0.92);
    this.add(this.hit);
    this.setSize(this.texW, this.texH);
    scene.add.existing(this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this));
    this.tick(0, 0);
  }

  private tick(_time: number, delta: number): void {
    this.clock += (delta / 1000) * this.o.speed;
    const t = this.clock + this.phase;
    const sway = Math.sin(t * 1.05) * this.o.sway + Math.sin(t * 0.43) * this.o.sway * 0.5;
    const breath = Math.sin(t * 1.7);
    const sq = this.squash + breath * 0.006;
    for (const s of this.strips) {
      const u = 1 - s.v; // height above the feet
      const bend = (sway + this.lean) * Math.pow(u, 1.6);
      const ripple = Math.sin(t * 2.4 - s.v * 8) * this.o.flutter * u * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.7)));
      const chest = Math.exp(-Math.pow((s.v - 0.38) / 0.16, 2));
      s.img.x = bend + ripple;
      s.img.y = (s.y0 - this.texH) * (1 + sq);
      s.img.scaleY = 1 + sq;
      s.img.scaleX = 1 + this.o.breathe * breath * chest;
    }
  }

  setTintFill(color: number): this {
    for (const s of this.strips) s.img.setTintFill(color);
    return this;
  }

  setTint(color: number): this {
    for (const s of this.strips) s.img.setTint(color);
    return this;
  }

  clearTint(): this {
    for (const s of this.strips) s.img.clearTint();
    return this;
  }

  /** Quick action pose: lean (px at the top) and stretch, then settle back. */
  pose(lean: number, squash: number, duration = 140, hold = 80): void {
    this.scene.tweens.killTweensOf(this.poseState);
    this.poseState.lean = this.lean;
    this.poseState.squash = this.squash;
    this.scene.tweens.add({
      targets: this.poseState, lean, squash, duration, hold, yoyo: true, ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.lean = this.poseState.lean;
        this.squash = this.poseState.squash;
      },
    });
  }

  private poseState = { lean: 0, squash: 0 };
}

/**
 * Standing portrait (lobby, menu, Troupe…) as a LivingSprite with bottom-centre origin.
 * Painted art is sized by height (capped by width); code-drawn chibis by a plain scale.
 */
export function livingPortrait(scene: Phaser.Scene, x: number, y: number, key: string, proceduralScale: number, paintedHeight: number, maxWidth = paintedHeight * 0.95): LivingSprite {
  const ls = new LivingSprite(scene, x, y, key, { strips: 36, sway: 5, flutter: 3, breathe: 0.01, speed: 0.8 });
  const s = isDropIn(key) ? Math.min(paintedHeight / ls.height, maxWidth / ls.width) : proceduralScale;
  ls.setScale(s);
  return ls;
}

/** A stage portrait: the character's idle video loop when one exists, else a LivingSprite. */
export interface StagePortrait {
  /** Tap target covering the figure. */
  hit: Phaser.GameObjects.Zone;
  /** Small reaction when tapped. */
  pose(): void;
  setDepth(d: number): StagePortrait;
}

export function stagePortrait(scene: Phaser.Scene, x: number, y: number, charId: string, key: string, proceduralScale: number, paintedHeight: number, maxWidth = paintedHeight * 0.95): StagePortrait {
  const still = livingPortrait(scene, x, y, key, proceduralScale, paintedHeight, maxWidth);
  const url = idleVideoUrl(charId);
  const api: StagePortrait = {
    hit: still.hit,
    pose: () => still.pose(14, 0.03, 160, 120),
    setDepth(d) {
      still.setDepth(d);
      video?.setDepth(d);
      return api;
    },
  };
  let video: Phaser.GameObjects.Video | undefined;
  if (!url) return api;
  // The still stays on screen until the loop's first frame arrives, then cross-fades out.
  video = scene.add.video(x, y).setOrigin(0.5, 1).setAlpha(0).setDepth(still.depth);
  const v = video;
  let shown = false;
  const reveal = () => {
    const w = v.video?.videoWidth ?? 0;
    const h = v.video?.videoHeight ?? 0;
    if (shown || !w || !h) return;
    shown = true;
    v.setDisplaySize(w, h).setScale(Math.min(paintedHeight / h, maxWidth / w));
    scene.tweens.add({ targets: v, alpha: 1, duration: 400 });
    scene.tweens.add({ targets: still, alpha: 0, duration: 400, onComplete: () => still.setVisible(false) });
  };
  v.on(Phaser.GameObjects.Events.VIDEO_CREATED, reveal);
  v.on(Phaser.GameObjects.Events.VIDEO_TEXTURE, reveal);
  v.on(Phaser.GameObjects.Events.VIDEO_PLAYING, reveal);
  v.loadURL(url, true);
  // Play the (ping-pong) loop once, then rest on its first frame — which matches the still —
  // for a few seconds before the next breath, so the idle never feels like a stuck GIF.
  v.play(false);
  v.on(Phaser.GameObjects.Events.VIDEO_COMPLETE, () => {
    scene.time.delayedCall(Phaser.Math.Between(2600, 4200), () => {
      if (v.active) v.play(false);
    });
  });
  api.pose = () => {
    if (!v.visible || v.alpha < 1) return still.pose(14, 0.03, 160, 120);
    scene.tweens.add({ targets: v, scaleY: v.scaleY * 1.015, scaleX: v.scaleX * 0.995, duration: 140, yoyo: true, ease: 'Sine.easeOut' });
  };
  return api;
}
