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

export type ArtFolder = 'characters' | 'heads' | 'battle' | 'enemies' | 'bg' | 'cards' | 'banners' | 'ui';

function keyFor(path: string): string | null {
  const m = path.match(/assets\/art\/([^/]+)\/([^/]+)\.(png|jpe?g|webp)$/i);
  return m ? `hf:${m[1]}/${m[2].toLowerCase()}` : null;
}

/** Queue every drop-in image and wait for them (no-op when the folder is empty). */
export function loadDropInArt(scene: Phaser.Scene): Promise<void> {
  const entries = Object.entries(FILES)
    .map(([path, url]) => [keyFor(path), url] as const)
    .filter((e): e is readonly [string, string] => !!e[0]);
  if (entries.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    for (const [key, url] of entries) scene.load.image(key, url);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
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
export function fitPortrait(img: Phaser.GameObjects.Image, proceduralScale: number, paintedHeight: number): Phaser.GameObjects.Image {
  if (isDropIn(img.texture.key)) img.setScale(paintedHeight / img.height);
  else img.setScale(proceduralScale);
  return img;
}

export function dropInCount(): number {
  return Object.keys(FILES).length;
}
