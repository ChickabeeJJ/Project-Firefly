import type { CharacterDef } from './types';

// The Luminaries. Stats are level-1 values; see progression for scaling.
export const CHARACTERS: CharacterDef[] = [
  {
    id: 'wren',
    name: 'Corvin Vesper',
    title: 'The Lantern Keeper',
    mood: 'star',
    rarity: 4,
    role: 'Striker',
    base: { hp: 960, atk: 138, def: 44 },
    verses: [
      {
        id: 'wren_strike', name: 'Lantern Swing', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.6 }],
        art: { motif: 'lantern', layout: 'burst', portrait: true },
      },
      {
        id: 'wren_kindle', name: 'Corvid Embers', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.0 },
          { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.45 },
        ],
        art: { motif: 'wings', layout: 'rays' },
      },
    ],
    finale: {
      id: 'wren_finale', name: 'Gilded Cage', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.4 },
        { kind: 'status', target: 'allEnemies', status: 'burn', turns: 2, power: 0.6 },
      ],
      art: { motif: 'lantern', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'grin',
      skin: '#f4d6c0', hair: '#9a3b22', hairStyle: 'bob', bangs: 'straight', eyes: '#c7772c',
      hat: 'newsboy', hatColor: '#5a4030', hatAccent: '#3c2a20',
      outfit: 'coat', coat: '#c89a3c', shirt: '#efe4cc', accent: '#b8382a', legs: '#4a3428', shoes: '#2a1d18',
      prop: 'match', scarf: true, freckles: true,
    },
    palette: { primary: '#7a52b0', secondary: '#d9b25a', ink: '#16101f' },
    quote: 'My crows carry every letter the dark tried to bury. Tonight, I deliver them.',
  },
  {
    id: 'odile',
    name: 'Seraphine Aube',
    title: 'The Winged Oracle',
    mood: 'moon',
    rarity: 4,
    role: 'Healer',
    base: { hp: 1010, atk: 112, def: 50 },
    verses: [
      {
        id: 'odile_tincture', name: 'Starlight Psalm', type: 'heal',
        effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.5 }],
        art: { motif: 'wings', layout: 'rings' },
      },
      {
        id: 'odile_lullaby', name: 'Hush of Feathers', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 0.9 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
        art: { motif: 'crescent', layout: 'spiral', portrait: true },
      },
    ],
    finale: {
      id: 'odile_finale', name: 'Celestial Choir', type: 'heal', finale: true,
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
    palette: { primary: '#2f4f9a', secondary: '#e0c070', ink: '#0e1426' },
    quote: 'Be still. The stars already saw you healed — I only remind them.',
  },
  {
    id: 'bastian',
    name: 'Columbine Rouge',
    title: 'The Cut-String Marionette',
    mood: 'sun',
    rarity: 3,
    role: 'Guardian',
    base: { hp: 1260, atk: 100, def: 70 },
    verses: [
      {
        id: 'bastian_brolly', name: 'Curtain of Ribbons', type: 'shield',
        effects: [{ kind: 'shield', target: 'allAllies', power: 0.75 }],
        art: { motif: 'swirl', layout: 'split' },
      },
      {
        id: 'bastian_bash', name: 'Pirouette Kick', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.3 },
          { kind: 'status', target: 'enemy', status: 'daze', turns: 1, chance: [0.25, 0.45, 0.75] },
        ],
        art: { motif: 'fist', layout: 'burst', portrait: true },
      },
    ],
    finale: {
      id: 'bastian_finale', name: 'Encore of Strings', type: 'shield', finale: true,
      effects: [
        { kind: 'shield', target: 'allAllies', power: 1.6 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'note', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'flat',
      skin: '#e8c5a8', hair: '#2b2622', hairStyle: 'short', bangs: 'side', eyes: '#4a6a7c',
      hat: 'bowler', hatColor: '#26242a', hatAccent: '#7a2a32',
      outfit: 'suit', coat: '#5b6170', shirt: '#e9e2d2', accent: '#8a2c35', legs: '#3d414c', shoes: '#1c1a1d',
      prop: 'umbrella', mustache: true,
    },
    palette: { primary: '#b8323a', secondary: '#e8c26a', ink: '#2a0e12' },
    quote: 'Someone cut my strings once. Now I hold everyone else’s.',
  },
  {
    id: 'marigold',
    name: 'Valerian Rosenthal',
    title: 'The Crimson Patron',
    mood: 'sun',
    rarity: 5,
    role: 'Support',
    base: { hp: 980, atk: 132, def: 46 },
    verses: [
      {
        id: 'marigold_swing', name: 'A Patron’s Toast', type: 'buff',
        effects: [{ kind: 'status', target: 'allAllies', status: 'might', turns: 2 }],
        art: { motif: 'candle', layout: 'rays', portrait: true },
      },
      {
        id: 'marigold_hot', name: 'Rain of Thorns', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.9 }],
        art: { motif: 'swirl', layout: 'burst' },
      },
    ],
    finale: {
      id: 'marigold_finale', name: 'Last Waltz of Roses', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.8 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'candle', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'happy', mouth: 'grin',
      skin: '#f6dcc6', hair: '#f0c862', hairStyle: 'wavy', bangs: 'curl', eyes: '#b5532f',
      hat: 'headband', hatColor: '#1e1a1a', hatAccent: '#d0392e',
      outfit: 'dress', coat: '#e2b443', shirt: '#f6e7b8', accent: '#1e1a1a', legs: '#f2d5bd', shoes: '#9b2b25',
      skirt: true, prop: 'feather',
    },
    palette: { primary: '#b01e2a', secondary: '#e2b45a', ink: '#1c080a' },
    quote: 'I funded every lamp in the Gloaming Theatre. I intend to see them lit again.',
  },
  {
    id: 'ichabod',
    name: 'Lucien Marée',
    title: 'The Tidecaller',
    mood: 'moon',
    rarity: 5,
    role: 'Striker',
    base: { hp: 920, atk: 150, def: 42 },
    verses: [
      {
        id: 'ichabod_sleight', name: 'Riptide', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.5 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
        art: { motif: 'swirl', layout: 'split', portrait: true },
      },
      {
        id: 'ichabod_flurry', name: 'Moonlit Rain', type: 'attack',
        effects: [{ kind: 'damage', target: 'randomEnemy', power: 0.6, hits: 3 }],
        art: { motif: 'rain', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'ichabod_finale', name: 'High Tide', type: 'attack', finale: true,
      effects: [{ kind: 'damage', target: 'enemy', power: 5.0 }],
      art: { motif: 'crescent', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smirk',
      skin: '#efd6c6', hair: '#1d1b24', hairStyle: 'slick', bangs: 'side', eyes: '#5ab0c4',
      hat: 'tophat', hatColor: '#1a1720', hatAccent: '#7d4bb3',
      outfit: 'tailcoat', coat: '#3c2b55', shirt: '#efe8dc', accent: '#b23a48', legs: '#211c2b', shoes: '#141118',
      monocle: true, prop: 'cards',
    },
    palette: { primary: '#2a4fb0', secondary: '#9ec8ee', ink: '#0a1230' },
    quote: 'The moon pulls the tide. Tonight, I pull the moon.',
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
    name: 'Ophelia Sablier',
    title: 'The Hourglass Countess',
    mood: 'sun',
    rarity: 5,
    role: 'Hexer',
    base: { hp: 940, atk: 126, def: 44 },
    verses: [
      {
        id: 'ottoline_omen', name: 'Sands of Regret', type: 'debuff',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 }],
        art: { motif: 'eye', layout: 'rings', portrait: true },
      },
      {
        id: 'ottoline_tarot', name: 'Checkmate', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.55 }],
        art: { motif: 'cards', layout: 'split' },
      },
    ],
    finale: {
      id: 'ottoline_finale', name: 'The Thirteenth Hour', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.2 },
        { kind: 'status', target: 'allEnemies', status: 'daze', turns: 1, chance: [0.5, 0.5, 0.5] },
      ],
      art: { motif: 'metronome', layout: 'spiral', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smirk',
      skin: '#ecd1c2', hair: '#2a1c2e', hairStyle: 'long', bangs: 'straight', eyes: '#c9a24a',
      hat: 'veil', hatColor: '#3e2550', hatAccent: '#c9a24a',
      outfit: 'dress', coat: '#5a3470', shirt: '#2a1c2e', accent: '#c9a24a', legs: '#2a1c2e', shoes: '#1a1220',
      skirt: true, prop: 'crystal',
    },
    palette: { primary: '#a8222e', secondary: '#e8d2b8', ink: '#1e0a0e' },
    quote: 'Every grain is a second someone wasted. I collect them. One day I will give them back.',
  },
  {
    id: 'augustin',
    name: 'Isidore Vellum',
    title: 'The Archivist of Ash',
    mood: 'moon',
    rarity: 5,
    role: 'Support',
    base: { hp: 1000, atk: 136, def: 50 },
    verses: [
      {
        id: 'augustin_accel', name: 'Marginalia', type: 'buff',
        effects: [{ kind: 'ardor', target: 'allAllies', amount: 1 }],
        art: { motif: 'newspaper', layout: 'rings', portrait: true },
      },
      {
        id: 'augustin_forte', name: 'Paper Cut', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.65 }],
        art: { motif: 'cards', layout: 'burst' },
      },
    ],
    finale: {
      id: 'augustin_finale', name: 'The Unwritten Page', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.6 },
        { kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 },
      ],
      art: { motif: 'newspaper', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#eed8c8', hair: '#e8e6e2', hairStyle: 'slick', bangs: 'parted', eyes: '#3c5a8c',
      outfit: 'tailcoat', coat: '#1d2030', shirt: '#f2efe8', accent: '#d8b04a', legs: '#171a26', shoes: '#0f1016',
      prop: 'baton', mustache: true,
    },
    palette: { primary: '#4a4a5e', secondary: '#e6d8b8', ink: '#141218' },
    quote: 'Everything the Dimming eats, I have already written down. It cannot unwrite me.',
  },
  {
    id: 'percival',
    name: 'Percival Quill',
    title: 'The Ink-Stained Reporter',
    mood: 'sun',
    rarity: 4,
    role: 'Hexer',
    base: { hp: 950, atk: 128, def: 46 },
    verses: [
      {
        id: 'percival_front', name: 'Front Page', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.1 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
        art: { motif: 'newspaper', layout: 'split', portrait: true },
      },
      {
        id: 'percival_flash', name: 'Flashbulb', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.35 },
          { kind: 'status', target: 'enemy', status: 'daze', turns: 1, chance: [0.3, 0.5, 0.8] },
        ],
        art: { motif: 'camera', layout: 'burst' },
      },
    ],
    finale: {
      id: 'percival_finale', name: 'Extra! Extra!', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.2 },
        { kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 },
      ],
      art: { motif: 'newspaper', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'smirk',
      skin: '#f0d4bc', hair: '#5a3a24', hairStyle: 'short', bangs: 'side', eyes: '#5a7a4a',
      hat: 'fedora', hatColor: '#6a6560', hatAccent: '#2a2622',
      outfit: 'vest', coat: '#5c5148', shirt: '#efe7d6', accent: '#3a5a8a', legs: '#3a3a40', shoes: '#1d1a18',
      glasses: true, prop: 'camera',
    },
    palette: { primary: '#d98a2b', secondary: '#f1ead8', ink: '#1e1a16' },
    quote: 'If the dark has a secret, I want it above the fold.',
  },
  {
    id: 'delphine',
    name: 'Delphine Moreau',
    title: 'The Midnight Violinist',
    mood: 'moon',
    rarity: 5,
    role: 'Striker',
    base: { hp: 930, atk: 152, def: 42 },
    verses: [
      {
        id: 'delphine_pizz', name: 'Pizzicato', type: 'attack',
        effects: [{ kind: 'damage', target: 'randomEnemy', power: 0.48, hits: 4 }],
        art: { motif: 'violin', layout: 'spiral', portrait: true },
      },
      {
        id: 'delphine_lament', name: 'Lament in D', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.6 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
        art: { motif: 'note', layout: 'rings' },
      },
    ],
    finale: {
      id: 'delphine_finale', name: 'Danse Macabre', type: 'mass', finale: true,
      effects: [{ kind: 'damage', target: 'allEnemies', power: 3.0 }],
      art: { motif: 'violin', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f2dccd', hair: '#1f2a3a', hairStyle: 'bob', bangs: 'straight', eyes: '#4aa3b8',
      hat: 'cloche', hatColor: '#1d3a42', hatAccent: '#c9a24a',
      outfit: 'dress', coat: '#1f4a52', shirt: '#0e1c22', accent: '#c9a24a', legs: '#1a1f26', shoes: '#0e1014',
      skirt: true, prop: 'violin',
    },
    palette: { primary: '#2a7f8a', secondary: '#e8c25a', ink: '#0c171c' },
    quote: 'Every string remembers the hand that played it last.',
  },
  {
    id: 'teddy',
    name: 'Aldric Verdane',
    title: 'The Astrolabe Warden',
    mood: 'star',
    rarity: 4,
    role: 'Guardian',
    base: { hp: 1240, atk: 104, def: 66 },
    verses: [
      {
        id: 'teddy_patch', name: 'Orrery Guard', type: 'shield',
        effects: [{ kind: 'shield', target: 'woundedAlly', power: 2.0 }],
        art: { motif: 'shield', layout: 'rings', portrait: true },
      },
      {
        id: 'teddy_spanner', name: 'Meridian Bash', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.45 }],
        art: { motif: 'metronome', layout: 'burst' },
      },
    ],
    finale: {
      id: 'teddy_finale', name: 'Celestial Bulwark', type: 'shield', finale: true,
      effects: [
        { kind: 'shield', target: 'allAllies', power: 1.4 },
        { kind: 'status', target: 'allAllies', status: 'regen', turns: 2, power: 0.3 },
      ],
      art: { motif: 'shield', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'grin',
      skin: '#e2b896', hair: '#c88a3a', hairStyle: 'curly', bangs: 'none', eyes: '#6a4a2a',
      hat: 'beret', hatColor: '#3a4a5a', hatAccent: '#2a3440',
      outfit: 'jacket', coat: '#4a6a7a', shirt: '#d8cdb4', accent: '#c96a2a', legs: '#3a4a5a', shoes: '#22201c',
      freckles: true, prop: 'wrench',
    },
    palette: { primary: '#2f7a5a', secondary: '#d6a45a', ink: '#0d1a14' },
    quote: 'I kept the Cathedral Clock for twenty years. I will keep you a little longer.',
  },
  {
    id: 'evangeline',
    name: 'Lady Evangeline Ash',
    title: 'The Parasol Heiress',
    mood: 'sun',
    rarity: 5,
    role: 'Healer',
    base: { hp: 1060, atk: 118, def: 54 },
    verses: [
      {
        id: 'evangeline_tea', name: 'Afternoon Tea', type: 'heal',
        effects: [
          { kind: 'heal', target: 'allAllies', power: 0.85 },
          { kind: 'status', target: 'allAllies', status: 'regen', turns: 2, power: 0.2 },
        ],
        art: { motif: 'teacup', layout: 'rays', portrait: true },
      },
      {
        id: 'evangeline_noblesse', name: 'Noblesse Oblige', type: 'buff',
        effects: [
          { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
          { kind: 'heal', target: 'woundedAlly', power: 0.6 },
        ],
        art: { motif: 'parasol', layout: 'split' },
      },
    ],
    finale: {
      id: 'evangeline_finale', name: 'Garden Party', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 2.0 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'parasol', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f6e2d4', hair: '#f2e2b8', hairStyle: 'wavy', bangs: 'parted', eyes: '#c26a5a',
      hat: 'cloche', hatColor: '#f2ead8', hatAccent: '#d86a7a',
      outfit: 'dress', coat: '#f0c8c4', shirt: '#fbf2ea', accent: '#d86a7a', legs: '#f6e2d4', shoes: '#c25a6a',
      skirt: true, prop: 'parasol',
    },
    palette: { primary: '#e88a98', secondary: '#f6e6b8', ink: '#2a1418' },
    quote: 'One must always dress for the end of the world. Tea?',
  },
  {
    id: 'kit',
    name: 'Sylvain Noct',
    title: 'The Wandering Orrerist',
    mood: 'moon',
    rarity: 4,
    role: 'Striker',
    base: { hp: 900, atk: 144, def: 40 },
    verses: [
      {
        id: 'kit_dash', name: 'Orbit Strike', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.3 },
          { kind: 'status', target: 'self', status: 'might', turns: 2 },
        ],
        art: { motif: 'telescope', layout: 'burst', portrait: true },
      },
      {
        id: 'kit_smoke', name: 'Eclipse Hour', type: 'debuff',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'weak', turns: 2 }],
        art: { motif: 'crescent', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'kit_finale', name: 'Grand Orrery', type: 'attack', finale: true,
      effects: [
        { kind: 'damage', target: 'enemy', power: 3.6 },
        { kind: 'fireflies', amount: 2 },
      ],
      art: { motif: 'meteor', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'open', mouth: 'smirk',
      skin: '#eccab4', hair: '#151418', hairStyle: 'short', bangs: 'side', eyes: '#d0a040',
      hat: 'beret', hatColor: '#2a2230', hatAccent: '#1a141e',
      outfit: 'vest', coat: '#2a2a34', shirt: '#3a3a48', accent: '#c94a4a', legs: '#222228', shoes: '#141218',
      scarf: true,
    },
    palette: { primary: '#22305a', secondary: '#d8c48a', ink: '#0a0e1a' },
    quote: 'My orrery still turns. Somewhere out there, the planets have not heard the night stopped.',
  },
  {
    id: 'hesper',
    name: 'Elias Astrée',
    title: 'The Star Cartographer',
    mood: 'star',
    rarity: 4,
    role: 'Support',
    base: { hp: 980, atk: 126, def: 48 },
    verses: [
      {
        id: 'hesper_guide', name: 'Charted Course', type: 'buff',
        effects: [
          { kind: 'light', amount: 2 },
          { kind: 'shield', target: 'self', power: 0.8 },
        ],
        art: { motif: 'telescope', layout: 'rings', portrait: true },
      },
      {
        id: 'hesper_starfall', name: 'Falling Meridian', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.82 }],
        art: { motif: 'meteor', layout: 'rays' },
      },
    ],
    finale: {
      id: 'hesper_finale', name: 'Map of Heaven', type: 'attack', finale: true,
      effects: [{ kind: 'damage', target: 'randomEnemy', power: 0.62, hits: 6 }],
      art: { motif: 'meteor', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#e6c8b0', hair: '#3a2a4a', hairStyle: 'long', bangs: 'straight', eyes: '#8a7ad8',
      outfit: 'robe', coat: '#2a2f5a', shirt: '#e8dcc0', accent: '#e2be6a', legs: '#2a2f5a', shoes: '#16182a',
      skirt: true, glasses: true, prop: 'telescope',
    },
    palette: { primary: '#2c3f86', secondary: '#e4d3a2', ink: '#0c1022' },
    quote: 'Every map of Vellmoor ends at midnight. I am drawing the one that ends at dawn.',
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
