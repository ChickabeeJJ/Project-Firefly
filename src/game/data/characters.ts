import type { CharacterDef } from './types';

// The Luminaries. Stats are level-1 values; see progression for scaling.
export const CHARACTERS: CharacterDef[] = [
  {
    id: 'wren',
    name: 'Wren Ashcombe',
    title: 'The Match-Seller',
    mood: 'sun',
    rarity: 4,
    role: 'Striker',
    base: { hp: 960, atk: 138, def: 44 },
    verses: [
      {
        id: 'wren_strike', name: 'Strike a Match', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.6 }],
        art: { motif: 'match', layout: 'burst', portrait: true },
      },
      {
        id: 'wren_kindle', name: 'Kindling', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.0 },
          { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.45 },
        ],
        art: { motif: 'flame', layout: 'rays' },
      },
    ],
    finale: {
      id: 'wren_finale', name: 'Bonfire Overture', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.4 },
        { kind: 'status', target: 'allEnemies', status: 'burn', turns: 2, power: 0.6 },
      ],
      art: { motif: 'bonfire', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'grin',
      skin: '#f4d6c0', hair: '#9a3b22', hairStyle: 'bob', bangs: 'straight', eyes: '#c7772c',
      hat: 'newsboy', hatColor: '#5a4030', hatAccent: '#3c2a20',
      outfit: 'coat', coat: '#c89a3c', shirt: '#efe4cc', accent: '#b8382a', legs: '#4a3428', shoes: '#2a1d18',
      prop: 'match', scarf: true, freckles: true,
    },
    palette: { primary: '#e2672f', secondary: '#f4c34f', ink: '#2a1612' },
    quote: 'Every street lamp in Vellmoor started as one small flame.',
  },
  {
    id: 'odile',
    name: 'Odile Vance',
    title: 'The Night Physician',
    mood: 'moon',
    rarity: 4,
    role: 'Healer',
    base: { hp: 1010, atk: 112, def: 50 },
    verses: [
      {
        id: 'odile_tincture', name: 'Silver Tincture', type: 'heal',
        effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.5 }],
        art: { motif: 'vial', layout: 'rings' },
      },
      {
        id: 'odile_lullaby', name: 'Lullaby Dose', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 0.9 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
        art: { motif: 'crescent', layout: 'spiral', portrait: true },
      },
    ],
    finale: {
      id: 'odile_finale', name: 'Night Ward', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 1.6 },
        { kind: 'status', target: 'allAllies', status: 'regen', turns: 2, power: 0.35 },
      ],
      art: { motif: 'crescent', layout: 'rings', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f1dccd', hair: '#c9ccd6', hairStyle: 'long', bangs: 'parted', eyes: '#7c63b8',
      outfit: 'labcoat', coat: '#ecebe6', shirt: '#2f3f4a', accent: '#3f9a96', legs: '#2c2f38', shoes: '#1d1d22',
      glasses: true, scarf: true, prop: 'book',
    },
    palette: { primary: '#3fa29b', secondary: '#d7e7e2', ink: '#14232a' },
    quote: 'Hold still. Light mends faster than you would think.',
  },
  {
    id: 'bastian',
    name: 'Bastian Hollis',
    title: 'The Umbrella Man',
    mood: 'star',
    rarity: 3,
    role: 'Guardian',
    base: { hp: 1260, atk: 100, def: 70 },
    verses: [
      {
        id: 'bastian_brolly', name: 'Under My Brolly', type: 'shield',
        effects: [{ kind: 'shield', target: 'allAllies', power: 0.75 }],
        art: { motif: 'umbrella', layout: 'split' },
      },
      {
        id: 'bastian_bash', name: 'Brolly Bash', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.3 },
          { kind: 'status', target: 'enemy', status: 'daze', turns: 1, chance: [0.25, 0.45, 0.75] },
        ],
        art: { motif: 'umbrella', layout: 'burst', portrait: true },
      },
    ],
    finale: {
      id: 'bastian_finale', name: 'Rain Check', type: 'shield', finale: true,
      effects: [
        { kind: 'shield', target: 'allAllies', power: 1.6 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'rain', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'flat',
      skin: '#e8c5a8', hair: '#2b2622', hairStyle: 'short', bangs: 'side', eyes: '#4a6a7c',
      hat: 'bowler', hatColor: '#26242a', hatAccent: '#7a2a32',
      outfit: 'suit', coat: '#5b6170', shirt: '#e9e2d2', accent: '#8a2c35', legs: '#3d414c', shoes: '#1c1a1d',
      prop: 'umbrella', mustache: true,
    },
    palette: { primary: '#6f7fa6', secondary: '#e9d9a8', ink: '#181b26' },
    quote: 'Rain or Dimming, nobody gets wet on my watch.',
  },
  {
    id: 'marigold',
    name: 'Marigold Pell',
    title: 'The Gilded Voice',
    mood: 'sun',
    rarity: 5,
    role: 'Support',
    base: { hp: 980, atk: 132, def: 46 },
    verses: [
      {
        id: 'marigold_swing', name: 'Swing Time', type: 'buff',
        effects: [{ kind: 'status', target: 'allAllies', status: 'might', turns: 2 }],
        art: { motif: 'note', layout: 'rays', portrait: true },
      },
      {
        id: 'marigold_hot', name: 'Hot Number', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.9 }],
        art: { motif: 'sunburst', layout: 'burst' },
      },
    ],
    finale: {
      id: 'marigold_finale', name: 'Grand Crescendo', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.8 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'note', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'happy', mouth: 'grin',
      skin: '#f6dcc6', hair: '#f0c862', hairStyle: 'wavy', bangs: 'curl', eyes: '#b5532f',
      hat: 'headband', hatColor: '#1e1a1a', hatAccent: '#d0392e',
      outfit: 'dress', coat: '#e2b443', shirt: '#f6e7b8', accent: '#1e1a1a', legs: '#f2d5bd', shoes: '#9b2b25',
      skirt: true, prop: 'feather',
    },
    palette: { primary: '#f2b62f', secondary: '#d63c34', ink: '#2b1410' },
    quote: 'Hit the high note and the whole city lights up.',
  },
  {
    id: 'ichabod',
    name: 'Ichabod Lark',
    title: 'The Vanishing Man',
    mood: 'moon',
    rarity: 5,
    role: 'Striker',
    base: { hp: 920, atk: 150, def: 42 },
    verses: [
      {
        id: 'ichabod_sleight', name: 'Sleight of Hand', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.5 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
        art: { motif: 'cards', layout: 'split', portrait: true },
      },
      {
        id: 'ichabod_flurry', name: 'Card Flurry', type: 'attack',
        effects: [{ kind: 'damage', target: 'randomEnemy', power: 0.6, hits: 3 }],
        art: { motif: 'cards', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'ichabod_finale', name: 'The Prestige', type: 'attack', finale: true,
      effects: [{ kind: 'damage', target: 'enemy', power: 5.0 }],
      art: { motif: 'tophat', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smirk',
      skin: '#efd6c6', hair: '#1d1b24', hairStyle: 'slick', bangs: 'side', eyes: '#5ab0c4',
      hat: 'tophat', hatColor: '#1a1720', hatAccent: '#7d4bb3',
      outfit: 'tailcoat', coat: '#3c2b55', shirt: '#efe8dc', accent: '#b23a48', legs: '#211c2b', shoes: '#141118',
      monocle: true, prop: 'cards',
    },
    palette: { primary: '#7a4cc0', secondary: '#55c2d4', ink: '#140f1f' },
    quote: 'Watch closely. The trick is that the dark was never there.',
  },
  {
    id: 'clementine',
    name: 'Sister Clementine',
    title: 'Keeper of the Vigil',
    mood: 'star',
    rarity: 4,
    role: 'Healer',
    base: { hp: 1080, atk: 108, def: 56 },
    verses: [
      {
        id: 'clementine_vigil', name: 'Vigil Candle', type: 'heal',
        effects: [{ kind: 'heal', target: 'allAllies', power: 0.75 }],
        art: { motif: 'candle', layout: 'rays', portrait: true },
      },
      {
        id: 'clementine_sanctuary', name: 'Sanctuary', type: 'shield',
        effects: [{ kind: 'shield', target: 'woundedAlly', power: 1.9 }],
        art: { motif: 'shield', layout: 'rings' },
      },
    ],
    finale: {
      id: 'clementine_finale', name: 'Lumen Mass', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 1.5 },
        { kind: 'shield', target: 'allAllies', power: 0.8 },
      ],
      art: { motif: 'lantern', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f3dccb', hair: '#6b4a34', hairStyle: 'short', bangs: 'parted', eyes: '#6f8f5a',
      hat: 'coif', hatColor: '#f1ece2', hatAccent: '#20222e',
      outfit: 'robe', coat: '#262a3c', shirt: '#f1ece2', accent: '#d9a441', legs: '#262a3c', shoes: '#16171f',
      skirt: true, prop: 'lantern',
    },
    palette: { primary: '#d9a441', secondary: '#f3ead6', ink: '#1b1c28' },
    quote: 'A single candle is a sermon the dark cannot answer.',
  },
  {
    id: 'rook',
    name: 'Rook Delacroix',
    title: 'The Dockside Champion',
    mood: 'sun',
    rarity: 3,
    role: 'Striker',
    base: { hp: 1120, atk: 128, def: 52 },
    verses: [
      {
        id: 'rook_onetwo', name: 'One-Two', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 0.82, hits: 2 }],
        art: { motif: 'fist', layout: 'burst', portrait: true },
      },
      {
        id: 'rook_haymaker', name: 'Haymaker', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.9 }],
        art: { motif: 'glove', layout: 'rays' },
      },
    ],
    finale: {
      id: 'rook_finale', name: 'Knockout', type: 'attack', finale: true,
      effects: [
        { kind: 'damage', target: 'enemy', power: 4.2 },
        { kind: 'status', target: 'enemy', status: 'daze', turns: 1 },
      ],
      art: { motif: 'glove', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'grin',
      skin: '#8a5a3c', hair: '#1c1714', hairStyle: 'short', bangs: 'none', eyes: '#3a2a20',
      hat: 'flatcap', hatColor: '#6c6a64', hatAccent: '#4a4844',
      outfit: 'vest', coat: '#4d3b30', shirt: '#ece4d2', accent: '#c23b2f', legs: '#3a3a44', shoes: '#1a1715',
      prop: 'gloves',
    },
    palette: { primary: '#d24735', secondary: '#f0d9a6', ink: '#1f1412' },
    quote: 'The Dimming hits hard. I hit harder.',
  },
  {
    id: 'nell',
    name: 'Nell Fairweather',
    title: 'The Night Flyer',
    mood: 'moon',
    rarity: 3,
    role: 'Striker',
    base: { hp: 990, atk: 124, def: 46 },
    verses: [
      {
        id: 'nell_strafe', name: 'Strafing Run', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.78 }],
        art: { motif: 'wings', layout: 'split', portrait: true },
      },
      {
        id: 'nell_tailwind', name: 'Tailwind', type: 'buff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.3 },
          { kind: 'status', target: 'self', status: 'might', turns: 2 },
        ],
        art: { motif: 'swirl', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'nell_finale', name: 'Barnstormer', type: 'mass', finale: true,
      effects: [{ kind: 'damage', target: 'allEnemies', power: 2.3 }],
      art: { motif: 'wings', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'grin',
      skin: '#f2d2bc', hair: '#c4622e', hairStyle: 'short', bangs: 'side', eyes: '#3f7d6a',
      hat: 'aviator', hatColor: '#7a4f30', hatAccent: '#9fc4c8',
      outfit: 'jacket', coat: '#835a3a', shirt: '#e8e0cc', accent: '#f1ede4', legs: '#4c4a3e', shoes: '#2a211a',
      scarf: true, freckles: true, prop: 'goggles',
    },
    palette: { primary: '#4f8fb3', secondary: '#e9c27a', ink: '#132029' },
    quote: 'Above the fog, the stars still work.',
  },
  {
    id: 'ottoline',
    name: 'Ottoline Grey',
    title: 'The Veiled Seer',
    mood: 'star',
    rarity: 4,
    role: 'Hexer',
    base: { hp: 940, atk: 126, def: 44 },
    verses: [
      {
        id: 'ottoline_omen', name: 'Ill Omen', type: 'debuff',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 }],
        art: { motif: 'eye', layout: 'rings', portrait: true },
      },
      {
        id: 'ottoline_tarot', name: 'Tarot Cut', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.55 }],
        art: { motif: 'tarot', layout: 'split' },
      },
    ],
    finale: {
      id: 'ottoline_finale', name: 'Crystal Eclipse', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.2 },
        { kind: 'status', target: 'allEnemies', status: 'daze', turns: 1, chance: [0.5, 0.5, 0.5] },
      ],
      art: { motif: 'crystal', layout: 'spiral', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smirk',
      skin: '#ecd1c2', hair: '#2a1c2e', hairStyle: 'long', bangs: 'straight', eyes: '#c9a24a',
      hat: 'veil', hatColor: '#3e2550', hatAccent: '#c9a24a',
      outfit: 'dress', coat: '#5a3470', shirt: '#2a1c2e', accent: '#c9a24a', legs: '#2a1c2e', shoes: '#1a1220',
      skirt: true, prop: 'crystal',
    },
    palette: { primary: '#8e4fb0', secondary: '#e7c45c', ink: '#1a0f22' },
    quote: 'Your future is bright. I checked.',
  },
  {
    id: 'augustin',
    name: 'Augustin Bellweather',
    title: 'The Midnight Conductor',
    mood: 'moon',
    rarity: 5,
    role: 'Support',
    base: { hp: 1000, atk: 136, def: 50 },
    verses: [
      {
        id: 'augustin_accel', name: 'Accelerando', type: 'buff',
        effects: [{ kind: 'ardor', target: 'allAllies', amount: 1 }],
        art: { motif: 'metronome', layout: 'rings', portrait: true },
      },
      {
        id: 'augustin_forte', name: 'Fortissimo', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.65 }],
        art: { motif: 'baton', layout: 'burst' },
      },
    ],
    finale: {
      id: 'augustin_finale', name: 'Coda', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.6 },
        { kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 },
      ],
      art: { motif: 'baton', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#eed8c8', hair: '#e8e6e2', hairStyle: 'slick', bangs: 'parted', eyes: '#3c5a8c',
      outfit: 'tailcoat', coat: '#1d2030', shirt: '#f2efe8', accent: '#d8b04a', legs: '#171a26', shoes: '#0f1016',
      prop: 'baton', mustache: true,
    },
    palette: { primary: '#2f4f8f', secondary: '#e8c25a', ink: '#0e1220' },
    quote: 'On my downbeat, the night begins to listen.',
  },
];

export const STARTER_TEAM = ['wren', 'odile', 'bastian'];

const byId = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string): CharacterDef {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown character ${id}`);
  return c;
}

export function findVerse(verseId: string): { char: CharacterDef; verse: CharacterDef['finale'] } {
  for (const c of CHARACTERS) {
    for (const v of [...c.verses, c.finale]) if (v.id === verseId) return { char: c, verse: v };
  }
  throw new Error(`Unknown verse ${verseId}`);
}
