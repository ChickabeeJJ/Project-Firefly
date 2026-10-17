// Visual constants. Role-based palette (see docs/visual-style-guide.md).

export const W = 1920;
export const H = 1080;

export const FONT_DISPLAY = 'Cinzel, Georgia, serif';
export const FONT_BODY = 'Spectral, Georgia, serif';

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
  // Interaction accent (lantern amber) and rewards (gold)
  amber: 0xc9652f,
  amberLight: 0xe58a4c,
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
} as const;

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
  amber: '#c9652f',
  amberLight: '#e58a4c',
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
} as const;

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
