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
    name: 'Clémence Vigil',
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
    palette: { primary: '#5a6a9a', secondary: '#eef0f6', ink: '#12162a' },
    quote: 'Sit with me a while. The moths only come to a lamp that is kept.',
  },
  {
    id: 'rook',
    name: 'Ambroise Morrow',
    title: 'The Midnight Envoy',
    mood: 'star',
    rarity: 4,
    role: 'Hexer',
    base: { hp: 1010, atk: 132, def: 48 },
    verses: [
      {
        id: 'rook_onetwo', name: 'Open Hand', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.05 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
        art: { motif: 'camera', layout: 'split', portrait: true },
      },
      {
        id: 'rook_haymaker', name: 'Sealed Terms', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 1.75 }],
        art: { motif: 'note', layout: 'rays' },
      },
    ],
    finale: {
      id: 'rook_finale', name: 'Terms of Surrender', type: 'attack', finale: true,
      effects: [
        { kind: 'damage', target: 'enemy', power: 4.0 },
        { kind: 'status', target: 'enemy', status: 'daze', turns: 1 },
      ],
      art: { motif: 'camera', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f0dccc', hair: '#22242c', hairStyle: 'long', bangs: 'side', eyes: '#8a8e98',
      outfit: 'tailcoat', coat: '#16161c', shirt: '#ece4d4', accent: '#3a4a8a', legs: '#121218', shoes: '#0c0c10',
    },
    palette: { primary: '#2e3550', secondary: '#ece4d4', ink: '#0e0e14' },
    quote: 'Every war ends at a table. I simply arrive early, and bring my own chair.',
  },
  {
    id: 'nell',
    name: 'Mireille Brume',
    title: 'The Blue Hour',
    mood: 'moon',
    rarity: 4,
    role: 'Striker',
    base: { hp: 990, atk: 136, def: 44 },
    verses: [
      {
        id: 'nell_strafe', name: 'Nocturne in Blue', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.8 }],
        art: { motif: 'crescent', layout: 'split', portrait: true },
      },
      {
        id: 'nell_tailwind', name: 'Hush', type: 'buff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.3 },
          { kind: 'status', target: 'self', status: 'might', turns: 2 },
        ],
        art: { motif: 'wings', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'nell_finale', name: 'L’Heure Bleue', type: 'mass', finale: true,
      effects: [{ kind: 'damage', target: 'allEnemies', power: 2.35 }],
      art: { motif: 'crescent', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f4e0d4', hair: '#2a2420', hairStyle: 'long', bangs: 'side', eyes: '#9aa4c8',
      outfit: 'dress', coat: '#1c2240', shirt: '#eceaf2', accent: '#4a68b8', legs: '#141830', shoes: '#10121e',
    },
    palette: { primary: '#3a4f8f', secondary: '#eceaf2', ink: '#0e1224' },
    quote: 'Between the last of the dusk and the first of the dark, there is an hour that belongs to no one. I live there.',
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
    name: 'Perrine Lys',
    title: 'The Pressed Lily',
    mood: 'sun',
    rarity: 4,
    role: 'Hexer',
    base: { hp: 950, atk: 128, def: 46 },
    verses: [
      {
        id: 'percival_front', name: 'Pressed Page', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.1 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
        art: { motif: 'newspaper', layout: 'split', portrait: true },
      },
      {
        id: 'percival_flash', name: 'Lily Pin', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.35 },
          { kind: 'status', target: 'enemy', status: 'daze', turns: 1, chance: [0.3, 0.5, 0.8] },
        ],
        art: { motif: 'cards', layout: 'burst' },
      },
    ],
    finale: {
      id: 'percival_finale', name: 'Herbarium of Hours', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.2 },
        { kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 },
      ],
      art: { motif: 'newspaper', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f4dccb', hair: '#cfc6b8', hairStyle: 'short', bangs: 'side', eyes: '#a8763c',
      outfit: 'vest', coat: '#4a3024', shirt: '#f1e7d4', accent: '#c9a050', legs: '#3a2a20', shoes: '#241812',
    },
    palette: { primary: '#7a4e30', secondary: '#f1e7d4', ink: '#1e1612' },
    quote: 'Hold still. I only press the moments worth keeping — and you, I think, are one.',
  },
  {
    id: 'cassian',
    name: 'Cassian Vire',
    title: 'The Clockmaker’s Heir',
    mood: 'sun',
    rarity: 5,
    role: 'Striker',
    base: { hp: 940, atk: 154, def: 44 },
    verses: [
      {
        id: 'cassian_wind', name: 'Wound Spring', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 0.9, hits: 2 }],
        art: { motif: 'cards', layout: 'split', portrait: true },
      },
      {
        id: 'cassian_strike', name: 'Strike the Hour', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.6 },
          { kind: 'status', target: 'self', status: 'might', turns: 2 },
        ],
        art: { motif: 'meteor', layout: 'burst' },
      },
    ],
    finale: {
      id: 'cassian_finale', name: 'The Thirteenth Stroke', type: 'mass', finale: true,
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 2.6 },
        { kind: 'status', target: 'allEnemies', status: 'daze', turns: 1, chance: [0.3, 0.5, 0.8] },
      ],
      art: { motif: 'cards', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f2dccc', hair: '#cfcac4', hairStyle: 'short', bangs: 'side', eyes: '#a85a40',
      outfit: 'tailcoat', coat: '#e6e0d6', shirt: '#2a2626', accent: '#8a1e22', legs: '#24222a', shoes: '#1a1416',
    },
    palette: { primary: '#8a1e22', secondary: '#e6e0d6', ink: '#1a1214' },
    quote: 'My father built the clock that struck thirteen. I have come to make it strike twelve again.',
  },
  {
    id: 'sorrel',
    name: 'Aurélien Glycine',
    title: 'The Wisteria Poet',
    mood: 'star',
    rarity: 4,
    role: 'Support',
    base: { hp: 1000, atk: 122, def: 52 },
    verses: [
      {
        id: 'sorrel_couplet', name: 'Idle Couplet', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.0 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
        art: { motif: 'note', layout: 'split', portrait: true },
      },
      {
        id: 'sorrel_muse', name: 'Borrowed Muse', type: 'buff',
        effects: [
          { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
          { kind: 'heal', target: 'woundedAlly', power: 0.6 },
        ],
        art: { motif: 'wings', layout: 'spiral' },
      },
    ],
    finale: {
      id: 'sorrel_finale', name: 'Wisteria Requiem', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 1.3 },
        { kind: 'status', target: 'allAllies', status: 'regen', turns: 2, power: 0.25 },
      ],
      art: { motif: 'note', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f2dccc', hair: '#d8d4cc', hairStyle: 'long', bangs: 'side', eyes: '#8a6ab8',
      outfit: 'robe', coat: '#ece6dc', shirt: '#f4efe6', accent: '#6a5498', legs: '#e8e2d8', shoes: '#1a1416',
    },
    palette: { primary: '#6a5498', secondary: '#ece6dc', ink: '#1a1424' },
    quote: 'I write a line, and the dark forgets what it was about to do. It is not courage. It is punctuation.',
  },
  {
    id: 'lazare',
    name: 'Dante Carmin',
    title: 'The Last Encore',
    mood: 'moon',
    rarity: 3,
    role: 'Striker',
    base: { hp: 960, atk: 126, def: 44 },
    verses: [
      {
        id: 'lazare_riposte', name: 'Riposte', type: 'attack',
        effects: [{ kind: 'damage', target: 'enemy', power: 0.85, hits: 2 }],
        art: { motif: 'glove', layout: 'burst', portrait: true },
      },
      {
        id: 'lazare_bow', name: 'Curtain Bow', type: 'mass',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.75 }],
        art: { motif: 'meteor', layout: 'rays' },
      },
    ],
    finale: {
      id: 'lazare_finale', name: 'Standing Ovation', type: 'attack', finale: true,
      effects: [
        { kind: 'damage', target: 'enemy', power: 4.0 },
        { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.3 },
      ],
      art: { motif: 'meteor', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#eed6c6', hair: '#2a1c1c', hairStyle: 'long', bangs: 'side', eyes: '#a83a32',
      outfit: 'coat', coat: '#1c1618', shirt: '#2a2224', accent: '#9a2a2a', legs: '#1a1618', shoes: '#0e0c0c',
    },
    palette: { primary: '#8a2228', secondary: '#e6d6c6', ink: '#140c0e' },
    quote: 'Every night is my last performance. So far the audience keeps asking for one more.',
  },
  {
    id: 'lys',
    name: 'Odette Verveine',
    title: 'The Green Room Herbalist',
    mood: 'star',
    rarity: 3,
    role: 'Healer',
    base: { hp: 1080, atk: 96, def: 56 },
    verses: [
      {
        id: 'lys_poultice', name: 'Bitter Poultice', type: 'heal',
        effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.0 }],
        art: { motif: 'crystal', layout: 'split', portrait: true },
      },
      {
        id: 'lys_thorn', name: 'Nettle Thorn', type: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 0.9 },
          { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.25 },
        ],
        art: { motif: 'swirl', layout: 'burst' },
      },
    ],
    finale: {
      id: 'lys_finale', name: 'Greenhouse in Winter', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 1.1 },
        { kind: 'shield', target: 'allAllies', power: 0.6 },
      ],
      art: { motif: 'crystal', layout: 'rays', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f2dccc', hair: '#cfc8c0', hairStyle: 'bun', bangs: 'side', eyes: '#7a9a8a',
      outfit: 'dress', coat: '#2e3a30', shirt: '#ece8de', accent: '#4a6a4e', legs: '#1a1e1a', shoes: '#141614',
    },
    palette: { primary: '#3e5a44', secondary: '#ece8de', ink: '#101410' },
    quote: 'Chamomile for the nerves, nettle for the Dimmed. Hold still, this will sting rather less than they do.',
  },
  {
    id: 'delphine',
    name: 'Fae Nivelle',
    title: 'The Lantern Wyrm',
    mood: 'moon',
    rarity: 5,
    role: 'Striker',
    base: { hp: 930, atk: 152, def: 42 },
    verses: [
      {
        id: 'delphine_pizz', name: 'Star in a Cage', type: 'attack',
        effects: [{ kind: 'damage', target: 'randomEnemy', power: 0.48, hits: 4 }],
        art: { motif: 'lantern', layout: 'spiral', portrait: true },
      },
      {
        id: 'delphine_lament', name: 'Wyrmfrost', type: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.6 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
        art: { motif: 'crystal', layout: 'rings' },
      },
    ],
    finale: {
      id: 'delphine_finale', name: 'Hoard of Lights', type: 'mass', finale: true,
      effects: [{ kind: 'damage', target: 'allEnemies', power: 3.0 }],
      art: { motif: 'lantern', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'flat',
      skin: '#f2dccd', hair: '#e8ecf4', hairStyle: 'long', bangs: 'straight', eyes: '#4aa3b8',
      hat: 'cloche', hatColor: '#1d3a42', hatAccent: '#c9a24a',
      outfit: 'dress', coat: '#1f4a52', shirt: '#0e1c22', accent: '#c9a24a', legs: '#1a1f26', shoes: '#0e1014',
      skirt: true, prop: 'lantern',
    },
    palette: { primary: '#2f4f9a', secondary: '#eef2fa', ink: '#0e1428' },
    quote: 'Dragons hoard what shines. I only ever wanted one small light that would not leave.',
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
    name: 'Aveline Halcyon',
    title: 'The Caged Dove',
    mood: 'moon',
    rarity: 5,
    role: 'Healer',
    base: { hp: 1060, atk: 118, def: 54 },
    verses: [
      {
        id: 'evangeline_tea', name: 'Homing Dove', type: 'heal',
        effects: [
          { kind: 'heal', target: 'allAllies', power: 0.85 },
          { kind: 'status', target: 'allAllies', status: 'regen', turns: 2, power: 0.2 },
        ],
        art: { motif: 'wings', layout: 'rays', portrait: true },
      },
      {
        id: 'evangeline_noblesse', name: 'Open the Cage', type: 'buff',
        effects: [
          { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
          { kind: 'heal', target: 'woundedAlly', power: 0.6 },
        ],
        art: { motif: 'rain', layout: 'split' },
      },
    ],
    finale: {
      id: 'evangeline_finale', name: 'A Thousand Wings', type: 'heal', finale: true,
      effects: [
        { kind: 'heal', target: 'allAllies', power: 2.0 },
        { kind: 'status', target: 'allAllies', status: 'might', turns: 2 },
      ],
      art: { motif: 'wings', layout: 'burst', portrait: true },
    },
    look: {
      eyeStyle: 'soft', mouth: 'smile',
      skin: '#f6e2d4', hair: '#d8dce4', hairStyle: 'long', bangs: 'parted', eyes: '#6a8ac8',
      hat: 'cloche', hatColor: '#eef2f8', hatAccent: '#2a4a8a',
      outfit: 'dress', coat: '#2a4a8a', shirt: '#f4f6fa', accent: '#c8a24a', legs: '#f6e2d4', shoes: '#c8a24a',
      skirt: true, prop: 'feather',
    },
    palette: { primary: '#3a5a9a', secondary: '#e8eef6', ink: '#121a2c' },
    quote: 'Every dove I set free carries a name home. Tell me yours, so I don’t lose it.',
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
