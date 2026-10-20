import Phaser from 'phaser';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/spectral/latin-400.css';
import '@fontsource/spectral/latin-400-italic.css';
import '@fontsource/spectral/latin-700.css';
import '@fontsource/spectral/latin-700-italic.css';
import '@fontsource/im-fell-english/latin-400.css';
import '@fontsource/im-fell-english/latin-400-italic.css';
import { LOW_MEMORY } from './game/art/assets';
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
  // Phones and tablets skip the multisampled framebuffer: a lot of GPU memory for little visible gain in 2D.
  render: { antialias: true, antialiasGL: !LOW_MEMORY, pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  input: { activePointers: 2 },
  // Real-time pacing on slow devices: no start-up delta clamp, tolerate frames up to 333 ms.
  fps: { target: 60, min: 3, panicMax: 0 },
  disableContextMenu: true,
  scene: [BootScene, LobbyScene, MenuScene, CinematicScene, ShopScene, StoryScene, FormationScene, BattleScene, PauseScene, ResultScene, SummonScene, RosterScene, NightScene],
});

// Screens wider (or taller) than 16:9 frame the stage with a blurred, darkened copy of the
// loading painting (index.html #backdrop). It is a static image: reading the game's frame back from
// the GPU to echo it would stall rendering and cost memory every time, which tablets cannot spare.

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
  void import('./game/persistence/SaveService').then((m) => ((window as unknown as { __saves: unknown }).__saves = m.saves));
}
