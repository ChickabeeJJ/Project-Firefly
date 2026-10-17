import Phaser from 'phaser';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/spectral/latin-400.css';
import '@fontsource/spectral/latin-400-italic.css';
import '@fontsource/spectral/latin-700.css';
import '@fontsource/spectral/latin-700-italic.css';
import { H, W } from './game/config/theme';
import { audio } from './game/audio/AudioController';
import { BootScene } from './game/scenes/BootScene';
import { LobbyScene } from './game/scenes/LobbyScene';
import { StoryScene } from './game/scenes/StoryScene';
import { FormationScene } from './game/scenes/FormationScene';
import { BattleScene } from './game/scenes/BattleScene';
import { PauseScene } from './game/scenes/PauseScene';
import { ResultScene } from './game/scenes/ResultScene';
import { SummonScene } from './game/scenes/SummonScene';
import { RosterScene } from './game/scenes/RosterScene';

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
  scene: [BootScene, LobbyScene, StoryScene, FormationScene, BattleScene, PauseScene, ResultScene, SummonScene, RosterScene],
});

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
