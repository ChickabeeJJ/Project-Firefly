import Phaser from 'phaser';
import { dropIn, idleVideoUrl, isDropIn } from '../art/assets';

// Brings still character art to life without extra frames.
//
// WebGL: the art is drawn as a vertical Rope — one seamless strip of connected quads — whose
// spine is bent a little each frame. The feet stay planted, the body sways a hair's breadth from
// the hips up, and the shoulders rise and fall with a slow breath. No render targets, no seams,
// and it costs a few dozen vertices per figure. Canvas: a plain image with a gentle breath.
// `lean` and `squash` are public so battle code can tween them for attacks, hits and casts.

export interface LivingOpts {
  /** Horizontal sway at the top of the figure, in texture px. */
  sway?: number;
  /** Kept for old call sites; unused. */
  flutter?: number;
  /** Breath: how far the shoulders rise, as a fraction of the figure's height. */
  breathe?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Spine points (more = smoother bends). */
  strips?: number;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class LivingSprite extends Phaser.GameObjects.Container {
  private readonly rope: Phaser.GameObjects.Rope | null = null;
  private readonly img: Phaser.GameObjects.Image | null = null;
  private readonly spine: { x: number; y: number }[] = [];
  private readonly texW: number;
  private readonly texH: number;
  private readonly o: Required<LivingOpts>;
  private readonly phase = Math.random() * 100;
  private clock = 0;
  /** Extra lean at the top of the figure (texture px, + = right). Tween it for actions. */
  lean = 0;
  /** Extra vertical stretch (+) or squash (−), e.g. 0.05. Tween it for actions. */
  squash = 0;
  /** Invisible hit box covering the figure (containers have no pixel hit test). */
  readonly hit: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, opts: LivingOpts = {}) {
    super(scene, x, y);
    this.o = { strips: 28, sway: 3, flutter: 0, breathe: 0.0035, speed: 1, ...opts };
    const frame = scene.textures.getFrame(key);
    this.texW = frame.width;
    this.texH = frame.height;
    if (scene.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      const n = Math.max(4, this.o.strips);
      for (let i = 0; i < n; i++) this.spine.push({ x: 0, y: -this.texH + (i * this.texH) / (n - 1) });
      this.rope = scene.add.rope(0, 0, key, undefined, this.spine as Phaser.Types.Math.Vector2Like[], false);
      this.add(this.rope);
    } else {
      this.img = scene.add.image(0, 0, key).setOrigin(0.5, 1);
      this.add(this.img);
    }
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
    const breath = Math.sin(t * 1.55) * 0.5 + 0.5;
    if (!this.rope) {
      this.img!.scaleY = 1 + this.squash + breath * this.o.breathe;
      this.img!.x = this.lean * 0.3;
      return;
    }
    const sway = (Math.sin(t * 0.9) * 0.65 + Math.sin(t * 0.37 + 1.3) * 0.35) * this.o.sway;
    const n = this.spine.length;
    const H = this.texH;
    for (let i = 0; i < n; i++) {
      const u = 1 - i / (n - 1); // height above the feet, 0..1
      const rise = breath * this.o.breathe * H * smooth(0.3, 0.75, u);
      this.spine[i].x = sway * u * u + this.lean * Math.pow(u, 1.6);
      this.spine[i].y = -u * H * (1 + this.squash) - rise;
    }
    this.rope.setDirty();
  }

  setTintFill(color: number): this {
    if (this.rope) {
      this.rope.setColors(color);
      this.rope.tintFill = true;
    } else this.img!.setTintFill(color);
    return this;
  }

  setTint(color: number): this {
    if (this.rope) {
      this.rope.tintFill = false;
      this.rope.setColors(color);
    } else this.img!.setTint(color);
    return this;
  }

  clearTint(): this {
    if (this.rope) {
      this.rope.tintFill = false;
      this.rope.setColors(0xffffff);
    } else this.img!.clearTint();
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
  const ls = new LivingSprite(scene, x, y, key, { sway: 3, breathe: 0.003, speed: 0.8 });
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
  const url = idleVideoUrl(charId);
  const posterKey = url ? dropIn(scene, 'idle', `${charId}_poster`) : null;
  if (!url || !posterKey) {
    const still = livingPortrait(scene, x, y, key, proceduralScale, paintedHeight, maxWidth);
    // Settle the figure into the room's lamplight: a little dimmer and warmer than the raw art.
    still.setTint(0xd6cbbd);
    const api: StagePortrait = {
      hit: still.hit,
      pose: () => still.pose(4, 0.006, 200, 140),
      setDepth(d) {
        still.setDepth(d);
        return api;
      },
    };
    return api;
  }
  // Idle-loop characters start on the loop's own first frame (the poster), so when the video
  // takes over there is nothing to see change: same pixels, same size, same place.
  const poster = scene.add.image(x, y, posterKey).setOrigin(0.5, 1);
  const k = Math.min(paintedHeight / poster.height, maxWidth / poster.width);
  poster.setScale(k);
  const hit = scene.add.zone(x, y - poster.displayHeight / 2, poster.displayWidth * 0.6, poster.displayHeight * 0.9);
  const v = scene.add.video(x, y).setOrigin(0.5, 1).setAlpha(0);
  const api: StagePortrait = {
    hit,
    pose: () => {
      const target = v.alpha >= 1 ? v : poster;
      const sy = target.scaleY;
      scene.tweens.add({ targets: target, scaleY: sy * 1.004, y: y - 2, duration: 200, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => target.setScale(target.scaleX, sy).setY(y) });
    },
    setDepth(d) {
      poster.setDepth(d);
      v.setDepth(d + 0.01);
      hit.setDepth(d + 0.02);
      return api;
    },
  };
  let shown = false;
  const reveal = () => {
    const w = v.video?.videoWidth ?? 0;
    const h = v.video?.videoHeight ?? 0;
    if (shown || !w || !h || v.video!.currentTime <= 0) return;
    shown = true;
    v.setDisplaySize(w, h).setScale(k * (poster.width / w));
    scene.tweens.add({ targets: v, alpha: 1, duration: 700, ease: 'Sine.easeInOut', onComplete: () => poster.setVisible(false) });
  };
  v.on(Phaser.GameObjects.Events.VIDEO_TEXTURE, reveal);
  v.on(Phaser.GameObjects.Events.VIDEO_PLAYING, () => scene.time.delayedCall(60, reveal));
  v.loadURL(url, true);
  // Play the (ping-pong) loop once, then rest on its first frame for a few seconds before the
  // next breath, so the idle never feels like a stuck GIF.
  v.play(false);
  v.on(Phaser.GameObjects.Events.VIDEO_COMPLETE, () => {
    reveal();
    scene.time.delayedCall(Phaser.Math.Between(2600, 4200), () => {
      if (v.active) v.play(false);
    });
  });
  return api;
}
