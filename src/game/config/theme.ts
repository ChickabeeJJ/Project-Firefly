// Visual constants. Role-based palette (see docs/visual-style-guide.md).

export const W = 1920;
export const H = 1080;

export const FONT_DISPLAY = 'Cinzel, Georgia, serif';
export const FONT_BODY = 'Spectral, Georgia, serif';
/** Period typeface for letters and handwritten notes. */
export const FONT_LETTER = "'IM Fell English', Spectral, Georgia, serif";

export const C = {
  // Deep background / structural shadow
  void: 0x0c0e11,
  ink: 0x15171c,
  inkSoft: 0x1f232a,
  // Stage materials
  slate: 0x3b4746,
  slateLight: 0x5f706e,
  // Paper UI
  paper: 0xefe6d2,
  paperShade: 0xd8cab0,
  paperLine: 0xb9a888,
  // Interaction accent (set by the chosen theme; the names predate themes) and rewards (gold)
  amber: 0x56735a,
  amberLight: 0x86a07e,
  accentDeep: 0x34503b,
  accentDark: 0x22372a,
  accentStar: 0xb8cf8a,
  accentPale: 0xdce8c8,
  gold: 0xe2be6a,
  goldDeep: 0xb08a3a,
  // Signature: firefly light
  firefly: 0xdcef72,
  fireflyDeep: 0x9fbf3a,
  // States
  danger: 0xc8433a,
  success: 0x7fb069,
  heal: 0x8fe0a0,
  shield: 0xcfe2f0,
  muted: 0x8a8578,
  // Moods
  sun: 0xe8a33d,
  moon: 0x8fa7d6,
  star: 0xb886e0,
};

/** CSS versions for canvas drawing and Phaser text. */
export const CSS = {
  void: '#0c0e11',
  ink: '#15171c',
  inkSoft: '#1f232a',
  paper: '#efe6d2',
  paperShade: '#d8cab0',
  paperText: '#2a241c',
  paperSub: '#6b5f4c',
  cream: '#f3ead6',
  creamDim: '#c9bda4',
  amber: '#a9c49a',
  amberLight: '#c4d8b0',
  accentInk: '#46694c',
  accentStar: '#b8cf8a',
  gold: '#e2be6a',
  goldLight: '#f3dc9c',
  firefly: '#dcef72',
  danger: '#e0584c',
  heal: '#9be8ad',
  shield: '#d6e8f5',
  muted: '#8a8578',
  sun: '#e8a33d',
  moon: '#8fa7d6',
  star: '#b886e0',
  outline: '#1b1518',
};

/** Accent presets the player can choose in Settings. Applied before any scene draws. */
export interface ThemeDef {
  name: string;
  /** fill, light, deep, dark, star (tints), pale */
  fill: number; light: number; deep: number; dark: number; star: number; pale: number;
  /** text on dark, light text on dark, text on paper */
  text: string; textLight: string; ink: string;
}

export const THEMES: Record<string, ThemeDef> = {
  verdigris: { name: 'Verdigris', fill: 0x56735a, light: 0x86a07e, deep: 0x34503b, dark: 0x22372a, star: 0xb8cf8a, pale: 0xdce8c8, text: '#a9c49a', textLight: '#c4d8b0', ink: '#46694c' },
  amber: { name: 'Lantern Amber', fill: 0xc9652f, light: 0xe58a4c, deep: 0x9a3a1a, dark: 0x5a1e0a, star: 0xf26b3a, pale: 0xffd27a, text: '#e0864c', textLight: '#f0a870', ink: '#b8501e' },
  claret: { name: 'Claret', fill: 0x8a3444, light: 0xb4606c, deep: 0x5e1e2a, dark: 0x3a1018, star: 0xe0828e, pale: 0xf2c4c8, text: '#d8909a', textLight: '#ecb4ba', ink: '#8a2a3a' },
  midnight: { name: 'Midnight Blue', fill: 0x3e5a86, light: 0x6c8cbc, deep: 0x26406a, dark: 0x162844, star: 0x92b4e6, pale: 0xcadcf4, text: '#9ab8e6', textLight: '#bcd2f2', ink: '#34588a' },
  brass: { name: 'Old Brass', fill: 0x96773a, light: 0xc4a258, deep: 0x6a5224, dark: 0x3e3014, star: 0xf0ca6c, pale: 0xf4e2b0, text: '#e0c078', textLight: '#eed6a0', ink: '#7a5a20' },
};

export let THEME_ID = 'verdigris';

export function applyTheme(id: string): void {
  const t = THEMES[id] ?? THEMES.verdigris;
  THEME_ID = THEMES[id] ? id : 'verdigris';
  Object.assign(C, { amber: t.fill, amberLight: t.light, accentDeep: t.deep, accentDark: t.dark, accentStar: t.star, accentPale: t.pale });
  Object.assign(CSS, { amber: t.text, amberLight: t.textLight, accentInk: t.ink, accentStar: '#' + t.star.toString(16).padStart(6, '0') });
}

export const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

export const MOOD_COLOR = { sun: C.sun, moon: C.moon, star: C.star } as const;
export const MOOD_CSS = { sun: CSS.sun, moon: CSS.moon, star: CSS.star } as const;
export const MOOD_NAME = { sun: 'Sun', moon: 'Moon', star: 'Star' } as const;

export const RARITY_CSS = { 3: '#a9b4c2', 4: '#b98ae0', 5: '#f0c25a' } as const;
export const RARITY_COLOR = { 3: 0xa9b4c2, 4: 0xb98ae0, 5: 0xf0c25a } as const;

export const TYPE_CSS: Record<string, string> = {
  attack: '#e0584c',
  mass: '#ef8a4a',
  heal: '#7fd39a',
  shield: '#8fc3e8',
  buff: '#e2be6a',
  debuff: '#b886e0',
};
