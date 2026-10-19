import Phaser from 'phaser';
import { dropInUrl, loadDropInArt, streamCharacterArt } from '../art/assets';
import { registerBaseArt } from '../art/registry';
import { audio } from '../audio/AudioController';
import { applyTheme, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { platform } from '../platform/PlatformAdapter';
import { startPrologue } from '../systems/storyFlow';
import { text } from '../ui/kit';

async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  const faces = ['400 32px Cinzel', '700 32px Cinzel', '400 32px Spectral', 'italic 400 32px Spectral', '700 32px Spectral', 'italic 700 32px Spectral', "400 32px 'IM Fell English'", "italic 400 32px 'IM Fell English'"];
  await Promise.race([
    Promise.all(faces.map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}

/** Lore cards shown while loading, in the manner of the reference's loading screens. */
const LORE: { title: string; text: string }[] = [
  { title: 'Project Firefly', text: 'A secret scheme pencilled on the back of an envelope no one has opened: every time somebody is forgotten, a firefly goes up. Catch them all, and keep them safe until the morning can find them.' },
  { title: 'The Thirteenth Stroke', text: 'At midnight on the last night of 1929 the Cathedral Clock struck twelve, and then once more. There is no thirteenth hour. That night, Vellmoor found one.' },
  { title: 'The Dimming', text: 'What the fog swallows, the world forgets: faces, names, whole streets. Even the letters people wrote to one another fade to blank paper.' },
  { title: 'Luminaries', text: 'A few people remembered too fiercely to be forgotten. Their memories still glow — enough to light a lantern, or to burn a hole in the dark.' },
  { title: 'Corvid Lane', text: 'Every street lamp in Vellmoor had a name, and every name had a lamp. On Corvid Lane the crows still fly their old postal routes, carrying letters no one remembers sending.' },
  { title: 'The Lighthouse', text: 'Out on the breakwater the old lighthouse still burns. Since midnight its beam has turned around. It shines darkness out to sea, and the tide has not come in.' },
  { title: 'Wick Dust', text: 'Ash from a wick that burned through the Dimming still remembers being light. Feed it to a Luminary and they grow brighter.' },
];

const VERSION = 'Project Firefly · V1.0';

/** Startup: loading screen over the painted lighthouse, then a title card that waits for a tap. */
export class BootScene extends Phaser.Scene {
  private bar?: Phaser.GameObjects.Rectangle;
  private barGlow?: Phaser.GameObjects.Image;
  private status?: Phaser.GameObjects.Text;
  private lore: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Boot');
  }

  preload(): void {
    const url = dropInUrl('bg', 'loading');
    if (url) this.load.image('hf:bg/loading', url);
  }

  async create(): Promise<void> {
    await platform.init();
    platform.loadingStart();
    await loadFonts();
    this.buildLoading();
    // The page's copy of the painting stays until the game's has faded in over it: one loading screen.
    const boot = document.getElementById('boot');
    if (boot) {
      this.time.delayedCall(900, () => (boot.style.opacity = '0'));
      this.time.delayedCall(1600, () => boot.remove());
    }

    const t0 = performance.now();
    // The lobby's leader loads now at full size; the rest of the troupe streams in after.
    const team = saves.load().team;
    await loadDropInArt(this, (p) => this.progress(p * 0.85), [team[0]]);
    const t1 = performance.now();
    this.progress(0.9, 'Lighting the lamps …');
    await new Promise((r) => this.time.delayedCall(30, r));
    applyTheme(saves.load().settings.theme);
    registerBaseArt(this);
    if (import.meta.env.DEV) console.info(`[boot] art loaded ${Math.round(t1 - t0)} ms, registered ${Math.round(performance.now() - t1)} ms`);
    const save = saves.load();
    audio.setVolumes(save.settings.music, save.settings.sfx);
    audio.setPlatformMuted(platform.muted);
    platform.onMuteChange((m) => audio.setPlatformMuted(m));
    this.progress(1, 'The lamps are lit.');
    void streamCharacterArt(this.game, team);
    platform.loadingStop();

    const params = new URLSearchParams(location.search);
    const devScene = import.meta.env.DEV ? params.get('scene') : null;
    if (devScene) {
      this.scene.start(devScene, { stageId: params.get('stage') ?? '1-1' });
      return;
    }
    this.time.delayedCall(350, () => this.showTitle());
  }

  private cover(key: string): Phaser.GameObjects.Image {
    const img = this.add.image(W / 2, H / 2, key);
    img.setScale(Math.max(W / img.width, H / img.height));
    return img;
  }

  private buildLoading(): void {
    this.cameras.main.setBackgroundColor('#06070a');
    if (this.textures.exists('hf:bg/loading')) {
      const bg = this.cover('hf:bg/loading').setAlpha(0);
      const s = bg.scale;
      this.tweens.add({ targets: bg, alpha: 1, duration: 900 });
      this.tweens.add({ targets: bg, scale: s * 1.06, duration: 30000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }
    // Bottom fade for the lore text, as in the reference.
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.88, 0.88);
    g.fillRect(0, H - 420, W, 420);
    text(this, 34, 26, VERSION, { size: 20, color: CSS.creamDim }).setAlpha(0.7);
    const lore = LORE[Math.floor(Math.random() * LORE.length)];
    const t = text(this, 120, H - 270, lore.title, { size: 40, color: CSS.cream, spacing: 1, shadow: true });
    const rl = this.add.rectangle(120, H - 222, Math.max(420, t.width + 60), 1, 0xe8dcc0, 0.45).setOrigin(0, 0.5);
    const lt = text(this, 120, H - 200, lore.text, { size: 26, color: CSS.cream, wrap: 1400, lineSpacing: 6, shadow: true }).setAlpha(0.92);
    this.lore = [t, rl, lt];
    // Thin progress line across the bottom, with a soft glowing head.
    this.add.rectangle(0, H - 70, W, 2, 0xe8dcc0, 0.18).setOrigin(0, 0.5);
    this.bar = this.add.rectangle(0, H - 70, 1, 2, 0xf2e2c0, 0.95).setOrigin(0, 0.5);
    this.barGlow = this.add.image(0, H - 70, 'fx:glow').setTint(0xffe6b0).setDisplaySize(60, 18).setAlpha(0.8);
    if (!this.textures.exists('fx:glow')) this.barGlow.setVisible(false);
    this.status = text(this, W / 2, H - 38, 'Trimming the wicks · please wait …', { size: 20, color: CSS.creamDim }).setOrigin(0.5);
  }

  private progress(p: number, msg?: string): void {
    const w = Math.max(1, W * p);
    if (this.bar) this.tweens.add({ targets: this.bar, width: w, duration: 220, ease: 'Sine.easeOut' });
    if (this.barGlow) this.tweens.add({ targets: this.barGlow, x: w, duration: 220, ease: 'Sine.easeOut' });
    if (msg) this.status?.setText(msg);
  }

  /** Title card: the game's name over the backdrop; the first tap also unlocks audio. */
  private showTitle(): void {
    const ui = this.add.container(0, 0).setAlpha(0);
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.38);
    const glow = this.add.image(W / 2, H / 2 - 70, 'fx:glow').setTint(0xffd27a).setDisplaySize(1500, 520).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    const sub = text(this, W / 2, H / 2 - 210, 'P R O J E C T', { size: 40, font: 'display', color: '#e8d6b0', spacing: 10, shadow: true }).setOrigin(0.5);
    const name = text(this, W / 2, H / 2 - 80, 'FIREFLY', { size: 170, font: 'display', color: '#f4ead4', spacing: 18, shadow: true }).setOrigin(0.5);
    const rule = this.add.rectangle(W / 2, H / 2 + 40, 520, 1, 0xe8dcc0, 0.6).setScale(0, 1);
    const tag = text(this, W / 2, H / 2 + 80, 'Vellmoor · the night without end', { size: 26, italic: true, color: CSS.creamDim }).setOrigin(0.5);
    const start = text(this, W / 2, H - 150, 'S T A R T', { size: 30, font: 'display', color: CSS.cream, spacing: 6, shadow: true }).setOrigin(0.5);
    ui.add([veil, glow, name, sub, rule, tag, start]);
    this.tweens.add({ targets: [this.bar, this.barGlow, this.status, ...this.lore], alpha: 0, duration: 500 });
    this.tweens.add({ targets: ui, alpha: 1, duration: 1100, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: rule, scaleX: 1, duration: 1200, delay: 400, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: start, alpha: 0.35, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1200 });
    this.tweens.add({ targets: glow, alpha: 0.28, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    let gone = false;
    this.input.once('pointerup', () => {
      if (gone) return;
      gone = true;
      audio.unlock();
      audio.sfx('tap');
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (saves.isNewPlayer) startPrologue(this);
        else this.scene.start('Lobby');
      });
    });
  }
}
