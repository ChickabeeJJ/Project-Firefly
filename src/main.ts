import Phaser from 'phaser';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/spectral/latin-400.css';
import '@fontsource/spectral/latin-400-italic.css';
import '@fontsource/spectral/latin-700.css';
import '@fontsource/spectral/latin-700-italic.css';
import '@fontsource/im-fell-english/latin-400.css';
import '@fontsource/im-fell-english/latin-400-italic.css';
import { H, W } from './game/config/theme';
import { audio } from './game/audio/AudioController';
import { BootScene } from './game/scenes/BootScene';
import { LobbyScene } from './game/scenes/LobbyScene';
import { MenuScene } from './game/scenes/MenuScene';
import { CinematicScene } from './game/scenes/CinematicScene';
import { ShopScene } from './game/scenes/ShopScene';
import { StoryScene } from './game/scenes/StoryScene';
import { FormationScene } from './game/scenes/FormationScene';
import { BattleScene } from './game/scenes/BattleScene';
import { PauseScene } from './game/scenes/PauseScene';
import { ResultScene } from './game/scenes/ResultScene';
import { SummonScene } from './game/scenes/SummonScene';
import { RosterScene } from './game/scenes/RosterScene';
import { NightScene } from './game/scenes/NightScene';

// Keys the game uses must never scroll the host page (CrazyGames requirement).
window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();
}, { passive: false });
window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

// Browsers only allow audio after a user gesture.
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0c0e11',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  input: { activePointers: 2 },
  // Real-time pacing on slow devices: no start-up delta clamp, tolerate frames up to 333 ms.
  fps: { target: 60, min: 3, panicMax: 0 },
  disableContextMenu: true,
  scene: [BootScene, LobbyScene, MenuScene, CinematicScene, ShopScene, StoryScene, FormationScene, BattleScene, PauseScene, ResultScene, SummonScene, RosterScene, NightScene],
});

// When the screen is wider (or taller) than 16:9, paint the bars with a blurred snapshot of the scene.
const backdrop = document.getElementById('backdrop');
let snapTimer = 0;
const refreshBackdrop = () => {
  const r = innerWidth / innerHeight;
  if (!backdrop || Math.abs(r - W / H) < 0.04) return;
  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(() => {
    game.renderer.snapshot((img) => {
      const c = document.createElement('canvas');
      c.width = 192;
      c.height = 108;
      c.getContext('2d')!.drawImage(img as HTMLImageElement, 0, 0, 192, 108);
      backdrop.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.7)})`;
    });
  }, 900);
};
game.events.once(Phaser.Core.Events.READY, () => {
  for (const s of game.scene.scenes) s.events.on(Phaser.Scenes.Events.CREATE, refreshBackdrop);
});
window.addEventListener('resize', refreshBackdrop);
// Overlays come and go within a scene, so re-take the echo now and then (cheap: a 192 px copy).
window.setInterval(refreshBackdrop, 12000);

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
  void import('./game/persistence/SaveService').then((m) => ((window as unknown as { __saves: unknown }).__saves = m.saves));
}
