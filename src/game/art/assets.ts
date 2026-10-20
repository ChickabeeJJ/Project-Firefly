import Phaser from 'phaser';

// Drop-in art (e.g. made with Higgsfield). Any image placed at
//   src/assets/art/<folder>/<id>.(png|jpg|jpeg|webp)
// is bundled at build time and replaces the procedural art for that id. Missing files simply
// fall back to the code-drawn art, so nothing 404s. See src/assets/art/README.md.

const FILES = import.meta.glob('../../assets/art/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// Idle loops: src/assets/art/idle/<id>.webm (VP9 with alpha). Played instead of the still portrait
// where the browser can decode transparent WebM; everywhere else the still art is used.
const IDLE = import.meta.glob('../../assets/art/idle/*.webm', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function idleSupported(): boolean {
  const ua = navigator.userAgent;
  // Safari plays VP9 but drops the alpha channel.
  if (/^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua)) return false;
  return document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
}

/** URL of a character's idle loop, or null when there is none or it cannot play here. */
export function idleVideoUrl(id: string): string | null {
  const hit = Object.entries(IDLE).find(([p]) => p.endsWith(`/${id}.webm`));
  return hit && idleSupported() ? hit[1] : null;
}

export type ArtFolder = 'characters' | 'heads' | 'battle' | 'enemies' | 'bg' | 'cards' | 'banners' | 'ui' | 'idle';

function keyFor(path: string): string | null {
  const m = path.match(/assets\/art\/([^/]+)\/([^/]+)\.(png|jpe?g|webp)$/i);
  return m ? `hf:${m[1]}/${m[2].toLowerCase()}` : null;
}

/** URL of one drop-in image, e.g. ('bg', 'loading'), or null. */
export function dropInUrl(folder: ArtFolder, id: string): string | null {
  const hit = Object.entries(FILES).find(([p]) => keyFor(p) === `hf:${folder}/${id}`);
  return hit ? hit[1] : null;
}

/**
 * Queue drop-in images and wait for them (no-op when nothing is left). Full-size character art
 * is the heaviest part of the game, so only the `characters` listed in `keepCharacters` load here;
 * the rest stream in afterwards (streamCharacterArt) while the player is on the title screen.
 */
export function loadDropInArt(scene: Phaser.Scene, onProgress?: (p: number) => void, keepCharacters?: string[]): Promise<void> {
  const deferred = (key: string) => LAZY_UI.test(key)
    || (key.startsWith('hf:characters/') && (keepCharacters ? !keepCharacters.includes(key.slice(14)) : LOW_MEMORY));
  const entries = Object.entries(FILES)
    .map(([path, url]) => [keyFor(path), url] as const)
    .filter((e): e is readonly [string, string] => !!e[0] && !scene.textures.exists(e[0]) && !deferred(e[0]));
  if (entries.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    for (const [key, url] of entries) scene.load.image(key, url);
    if (onProgress) scene.load.on(Phaser.Loader.Events.PROGRESS, onProgress);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      scene.load.off(Phaser.Loader.Events.PROGRESS);
      resolve();
    });
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => console.warn('[art] failed to load', f.key));
    scene.load.start();
  });
}

/**
 * Phones and tablets (iPad Safari above all) close a tab that holds too much decoded art, so on
 * them full character art is only ever loaded when it is about to be shown, and let go after.
 */
export const LOW_MEMORY: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return ios || /Android/i.test(navigator.userAgent) || (mem !== undefined && mem <= 4);
})();

/** Big, rarely shown screens (a character page's backdrop, a Finale's banner): loaded when wanted. */
const LAZY_UI = /^hf:ui\/(charbg|finale)_/;

/** Full-size character art that has been asked for, by texture key, while it decodes. */
const pending = new Map<string, Promise<void>>();

/** Scenes during which background loading holds off, so an upload never hitches a story or a fight. */
const QUIET_SCENES = ['Cinematic', 'Battle'];

function entryFor(key: string): readonly [string, string] | null {
  const hit = Object.entries(FILES).find(([p]) => keyFor(p) === key);
  return hit ? [key, hit[1]] : null;
}

/** Decodes one image off the main thread, then hands it to the GPU in a single step. */
function loadOne(game: Phaser.Game, key: string, url: string): Promise<void> {
  if (game.textures.exists(key)) return Promise.resolve();
  let p = pending.get(key);
  if (!p) {
    p = new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.decode().then(() => {
        if (!game.textures.exists(key)) game.textures.addImage(key, img);
      }).catch(() => undefined).finally(() => {
        pending.delete(key);
        resolve();
      });
    });
    pending.set(key, p);
  }
  return p;
}

/** Loads these characters' full art now (a story's speakers, a reveal). Resolves when all are in. */
export function needCharacterArt(game: Phaser.Game, ids: string[]): Promise<void> {
  return needArt(game, ids.map((id) => `hf:characters/${id}`));
}

/** Loads any drop-in textures by key ("hf:ui/charbg_tide") that are not in yet. */
export function needArt(game: Phaser.Game, keys: string[]): Promise<void> {
  return Promise.all(keys.map((key) => {
    const e = entryFor(key);
    return e ? loadOne(game, e[0], e[1]) : Promise.resolve();
  })).then(() => undefined);
}

/**
 * On low-memory devices, lets go of full character art and the big lazy screens that are not in
 * use. Call from a hub scene's create, when nothing from the previous scene is still drawn.
 */
export function trimArt(game: Phaser.Game, keepCharacters: string[]): void {
  if (!LOW_MEMORY) return;
  for (const key of game.textures.getTextureKeys()) {
    const char = key.startsWith('hf:characters/') && !keepCharacters.includes(key.slice(14));
    if (char || LAZY_UI.test(key)) game.textures.remove(key);
  }
}

/**
 * Loads the remaining full-size character art in the background, `first` ids before the rest,
 * independent of any scene (so changing scenes never cancels it). One at a time, decoded off the
 * main thread, and paused while a story or a battle is playing. Resolves when all are in.
 */
export function streamCharacterArt(game: Phaser.Game, first: string[] = []): Promise<void> {
  // Low-memory devices never hold everyone at once: art is fetched when it is about to be shown.
  if (LOW_MEMORY) return Promise.resolve();
  const todo = Object.entries(FILES)
    .map(([path, url]) => [keyFor(path), url] as const)
    .filter((e): e is readonly [string, string] => !!e[0] && e[0].startsWith('hf:characters/') && !game.textures.exists(e[0]))
    .sort(([a], [b]) => Number(!first.includes(a.slice(14))) - Number(!first.includes(b.slice(14))));
  const quiet = () => QUIET_SCENES.some((k) => game.scene.isActive(k));
  const rest = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return (async () => {
    for (const [key, url] of todo) {
      while (quiet()) await rest(500);
      await loadOne(game, key, url);
      await rest(120);
    }
  })();
}

export function dropIn(scene: Phaser.Scene, folder: ArtFolder, id: string): string | null {
  const key = `hf:${folder}/${id.toLowerCase()}`;
  return scene.textures.exists(key) ? key : null;
}

/** True for drop-in textures and the portraits derived from them ("hf:…", "hfp:…"). */
export function isDropIn(key: string): boolean {
  return key.startsWith('hf:') || key.startsWith('hfp:');
}

/**
 * Per-character height for painted art that is framed differently from the rest of the cast: a
 * full-length standing figure fitted to the same height as seated or knee-up art reads as a giant.
 */
const ART_HEIGHT: Record<string, number> = {
  cassian: 0.84, lazare: 0.84, lys: 0.84, kit: 0.86, nell: 0.86, rook: 0.86, hesper: 0.88, teddy: 0.88, sorrel: 0.9,
  raphael: 0.84, severin: 0.9, emile: 0.9, cendrine: 0.9, nine: 0.74, tock: 0.8, folio: 0.74,
};

/** Height factor for a character texture key (hf:characters/<id>, hf:battle/<id>, hfp:<id>…). */
export function artScale(key: string): number {
  const id = key.replace(/^hfp?:(?:characters\/|battle\/)?/, '').split(/[^a-z]/)[0];
  return ART_HEIGHT[id] ?? 1;
}

/** Code-drawn portraits are chibi (short); painted key art is tall, so each gets its own size. */
export function fitPortrait(img: Phaser.GameObjects.Image, proceduralScale: number, paintedHeight: number, maxWidth = paintedHeight * 0.95): Phaser.GameObjects.Image {
  if (isDropIn(img.texture.key)) img.setScale(Math.min(paintedHeight / img.height, maxWidth / img.width) * artScale(img.texture.key));
  else img.setScale(proceduralScale);
  return img;
}

export function dropInCount(): number {
  return Object.keys(FILES).length;
}
