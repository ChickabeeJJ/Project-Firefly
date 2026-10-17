import Phaser from 'phaser';
import { loadDropInArt } from '../art/assets';
import { registerBaseArt } from '../art/registry';
import { audio } from '../audio/AudioController';
import { saves } from '../persistence/SaveService';
import { platform } from '../platform/PlatformAdapter';

async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  const faces = ['400 32px Cinzel', '700 32px Cinzel', '400 32px Spectral', 'italic 400 32px Spectral', '700 32px Spectral', 'italic 700 32px Spectral'];
  await Promise.race([
    Promise.all(faces.map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}

/** Minimal startup: platform, fonts, procedural art, save. New players go straight into a battle. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create(): Promise<void> {
    await platform.init();
    platform.loadingStart();
    await loadFonts();
    await loadDropInArt(this);
    registerBaseArt(this);
    const save = saves.load();
    audio.setVolumes(save.settings.music, save.settings.sfx);
    audio.setPlatformMuted(platform.muted);
    platform.onMuteChange((m) => audio.setPlatformMuted(m));
    platform.loadingStop();
    document.getElementById('boot')?.remove();

    const params = new URLSearchParams(location.search);
    const devScene = import.meta.env.DEV ? params.get('scene') : null;
    if (devScene) {
      this.scene.start(devScene, { stageId: params.get('stage') ?? '1-1' });
      return;
    }
    if (saves.isNewPlayer) this.scene.start('Battle', { stageId: '1-1' });
    else this.scene.start('Lobby');
  }
}
