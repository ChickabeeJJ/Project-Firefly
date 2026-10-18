import Phaser from 'phaser';
import { dropIn, idleVideoUrl, isDropIn } from '../art/assets';

// Brings still character art to life without extra frames.
//
// WebGL: a per-figure post-process shader deforms the art smoothly (no strips, no seams). The
// figure is treated in regions: the face and torso stay rigid, the chest breathes, the whole body
// sways a hair's breadth from the feet up, and only the outer edges (hair, capes, ribbons,
// sleeves) drift, slowly, like cloth in a draught. Canvas: a gentle breathing scale only.
// `lean` and `squash` are public so battle code can tween them for attacks, hits and casts.

export interface LivingOpts {
  /** Horizontal sway at the top of the figure, in texture px. */
  sway?: number;
  /** Drift of hair/cloth at the edges, in texture px. */
  flutter?: number;
  /** Chest breathing, as a fraction (0.01 = 1 %). */
  breathe?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Kept for old call sites; unused. */
  strips?: number;
}

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec4 uBounds;   // figure box in render-target uv (x, y of the feet-left corner, w, h)
uniform vec4 uMotion;   // sway, drift, breathe, lean (fractions of figure height/width)
uniform float uSquash;
varying vec2 outTexCoord;
void main() {
  vec2 uv = outTexCoord;
  vec2 p = (uv - uBounds.xy) / uBounds.zw;           // 0..1, y up from the feet
  float u = clamp(p.y, 0.0, 1.2);
  float t = uTime;
  vec2 d = vec2(0.0);
  // Whole-body sway and action lean, rooted at the feet.
  float sway = (sin(t * 0.9) * 0.65 + sin(t * 0.37 + 1.3) * 0.35) * uMotion.x + uMotion.w;
  d.x += sway * u * u;
  // Breathing: a slow rise of everything above the hips, a little more at the shoulders.
  float br = sin(t * 1.55) * 0.5 + 0.5;
  float chest = exp(-pow((p.y - 0.66) / 0.14, 2.0));
  d.y += (uMotion.z * br * smoothstep(0.35, 0.8, u) + uSquash * u) ;
  d.x += (p.x - 0.5) * uMotion.z * 1.6 * br * chest;
  // Hair, capes and ribbons: the outer edges drift; the core (face, torso) never does.
  float edge = smoothstep(0.14, 0.46, abs(p.x - 0.5));
  float crown = smoothstep(0.78, 1.0, u) * smoothstep(0.08, 0.3, abs(p.x - 0.5));
  float w = max(edge * smoothstep(0.08, 0.45, u), crown);
  vec2 drift = vec2(sin(t * 1.15 + p.y * 2.6 + p.x * 1.7), 0.45 * cos(t * 0.95 + p.y * 2.1 - p.x * 1.3));
  d += drift * uMotion.y * w;
  vec2 src = uv - d * uBounds.zw;
  gl_FragColor = texture2D(uMainSampler, src);
}`;

/** Per-figure post pipeline; LivingSprite writes its uniforms every frame. */
export class LivingFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  time = 0;
  bounds = [0, 0, 1, 1];
  motion = [0, 0, 0, 0];
  squash = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: 'LivingFX', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set1f('uTime', this.time);
    this.set4f('uBounds', this.bounds[0], this.bounds[1], this.bounds[2], this.bounds[3]);
    this.set4f('uMotion', this.motion[0], this.motion[1], this.motion[2], this.motion[3]);
    this.set1f('uSquash', this.squash);
  }
}

export class LivingSprite extends Phaser.GameObjects.Container {
  private readonly img: Phaser.GameObjects.Image;
  private readonly fx: LivingFX | null = null;
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
    this.o = { strips: 0, sway: 4, flutter: 3, breathe: 0.004, speed: 1, ...opts };
    this.img = scene.add.image(0, 0, key).setOrigin(0.5, 1);
    this.texW = this.img.width;
    this.texH = this.img.height;
    this.add(this.img);
    if (scene.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      const r = scene.renderer;
      if (!r.pipelines.getPostPipeline('LivingFX')) r.pipelines.addPostPipeline('LivingFX', LivingFX);
      this.img.setPostPipeline('LivingFX');
      this.fx = this.img.getPostPipeline('LivingFX') as LivingFX;
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
    if (!this.fx) {
      // Canvas fallback: breathing only.
      this.img.scaleY = 1 + this.squash + Math.sin(t * 1.55) * 0.003;
      this.img.x = this.lean * 0.3;
      return;
    }
    const b = this.img.getBounds();
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    // Render targets are y-up: the box origin is the figure's bottom-left corner.
    this.fx.bounds = [b.x / sw, 1 - (b.y + b.height) / sh, b.width / sw, b.height / sh];
    this.fx.time = t;
    const wFrac = 1 / this.texW;
    this.fx.motion = [this.o.sway * wFrac, this.o.flutter * wFrac, this.o.breathe, this.lean * wFrac];
    this.fx.squash = this.squash * 0.5;
  }

  setTintFill(color: number): this {
    this.img.setTintFill(color);
    return this;
  }

  setTint(color: number): this {
    this.img.setTint(color);
    return this;
  }

  clearTint(): this {
    this.img.clearTint();
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
  const ls = new LivingSprite(scene, x, y, key, { sway: 4, flutter: 5, breathe: 0.0035, speed: 0.8 });
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
