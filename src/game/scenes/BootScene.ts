import Phaser from 'phaser';
import { STARTER_TEAM } from '../data/characters';
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



/** Startup: loading screen over the painted lighthouse, then a title card that waits for a tap. */
export class BootScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Image;

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

    const t0 = performance.now();
    // The lobby's leader loads now at full size; the rest of the troupe streams in after.
    // The team (who also carry the opening story) loads at full size now; everyone else waits
    // until the player is actually playing, so the first download stays small.
    const team = [...new Set([...saves.load().team, ...STARTER_TEAM])];
    await loadDropInArt(this, (p) => this.progress(p * 0.85), team);
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
    platform.onFirstGameplay(() => void streamCharacterArt(this.game, team));
    // Returning players may browse menus for a while first: stream after a minute regardless.
    this.game.events.once(Phaser.Core.Events.STEP, () => window.setTimeout(() => void streamCharacterArt(this.game, team), 60000));
    // Ads take the screen: hold the game and its sound until they hand it back.
    platform.onAd((playing) => {
      if (playing) {
        audio.suspend();
        this.game.pause();
      } else {
        this.game.resume();
        audio.resume();
      }
    });
    platform.loadingStop();

    const params = new URLSearchParams(location.search);
    const devScene = import.meta.env.DEV ? params.get('scene') : null;
    if (devScene) {
      this.dropLoadingScreen();
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

  /**
   * The loading screen itself is the page's own markup (index.html #boot), on screen from the very
   * first paint; the game only feeds its progress line. Underneath, the same painting waits for
   * the title card.
   */
  private buildLoading(): void {
    this.cameras.main.setBackgroundColor('#06070a');
    if (this.textures.exists('hf:bg/loading')) this.backdrop = this.cover('hf:bg/loading');
  }

  private progress(p: number, msg?: string): void {
    const bar = document.querySelector<HTMLElement>('#boot .bar i');
    if (bar) bar.style.width = `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`;
    const status = document.querySelector<HTMLElement>('#boot .status');
    if (msg && status) status.textContent = msg;
  }

  /** Fades the page's loading screen away, revealing the game beneath it. */
  private dropLoadingScreen(): void {
    const boot = document.getElementById('boot');
    if (!boot) return;
    boot.style.opacity = '0';
    window.setTimeout(() => boot.remove(), 700);
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
    this.dropLoadingScreen();
    if (this.backdrop) {
      const s = this.backdrop.scale;
      this.tweens.add({ targets: this.backdrop, scale: s * 1.06, duration: 30000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }
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
