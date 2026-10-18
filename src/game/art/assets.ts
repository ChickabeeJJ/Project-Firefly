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

/** Queue every drop-in image and wait for them (no-op when the folder is empty). */
export function loadDropInArt(scene: Phaser.Scene, onProgress?: (p: number) => void): Promise<void> {
  const entries = Object.entries(FILES)
    .map(([path, url]) => [keyFor(path), url] as const)
    .filter((e): e is readonly [string, string] => !!e[0] && !scene.textures.exists(e[0]));
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

export function dropIn(scene: Phaser.Scene, folder: ArtFolder, id: string): string | null {
  const key = `hf:${folder}/${id.toLowerCase()}`;
  return scene.textures.exists(key) ? key : null;
}

/** True for drop-in textures and the portraits derived from them ("hf:…", "hfp:…"). */
export function isDropIn(key: string): boolean {
  return key.startsWith('hf:') || key.startsWith('hfp:');
}

/** Code-drawn portraits are chibi (short); painted key art is tall, so each gets its own size. */
export function fitPortrait(img: Phaser.GameObjects.Image, proceduralScale: number, paintedHeight: number, maxWidth = paintedHeight * 0.95): Phaser.GameObjects.Image {
  if (isDropIn(img.texture.key)) img.setScale(Math.min(paintedHeight / img.height, maxWidth / img.width));
  else img.setScale(proceduralScale);
  return img;
}

export function dropInCount(): number {
  return Object.keys(FILES).length;
}
