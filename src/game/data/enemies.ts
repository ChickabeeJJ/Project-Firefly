import type { EnemyDef } from './types';

// The Dimfolk. Patterns repeat so players can learn and plan around them.
export const ENEMIES: EnemyDef[] = [
  {
    id: 'mothling', name: 'Mothling', mood: 'star', kind: 'mothling',
    base: { hp: 520, atk: 72, def: 30 },
    moves: [
      { id: 'flutter', name: 'Flutter', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.0 }] },
      {
        id: 'dust', name: 'Wing Dust', intent: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 0.5 },
          { kind: 'status', target: 'enemy', status: 'weak', turns: 2 },
        ],
      },
    ],
    pattern: ['flutter', 'flutter', 'dust'],
    finale: { id: 'swarm', name: 'Swarm', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.3 }] },
    blurb: 'Drawn to any light, it gnaws until the flame gutters.',
  },
  {
    id: 'usher', name: 'Hollow Usher', mood: 'moon', kind: 'usher',
    base: { hp: 760, atk: 84, def: 45 },
    moves: [
      { id: 'swing', name: 'Lantern Swing', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.2 }] },
      { id: 'guard', name: 'Usher the Crowd', intent: 'shield', effects: [{ kind: 'shield', target: 'allAllies', power: 0.6 }] },
    ],
    pattern: ['swing', 'guard', 'swing'],
    finale: { id: 'lastcall', name: 'Last Call', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 2.6 }] },
    blurb: 'A faceless usher who still shows the lost to their seats.',
  },
  {
    id: 'mannequin', name: 'Clockwork Mannequin', mood: 'sun', kind: 'mannequin',
    base: { hp: 1120, atk: 92, def: 80 },
    moves: [
      { id: 'windup', name: 'Wind Up', intent: 'buff', effects: [{ kind: 'status', target: 'self', status: 'might', turns: 2 }] },
      { id: 'blow', name: 'Clockwork Blow', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.55 }] },
    ],
    pattern: ['windup', 'blow', 'blow'],
    finale: { id: 'snap', name: 'Spring Snap', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 3.0 }] },
    blurb: 'A shop-window dummy that learned to walk after closing time.',
  },
  {
    id: 'hound', name: 'Ink Hound', mood: 'sun', kind: 'hound',
    base: { hp: 680, atk: 98, def: 34 },
    moves: [
      {
        id: 'inkbite', name: 'Ink Bite', intent: 'attack',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.0 },
          { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.3 },
        ],
      },
      { id: 'howl', name: 'Gutter Howl', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 0.6 }] },
    ],
    pattern: ['inkbite', 'inkbite', 'howl'],
    finale: {
      id: 'blacktide', name: 'Black Tide', intent: 'mass',
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 1.5 },
        { kind: 'status', target: 'allEnemies', status: 'burn', turns: 2, power: 0.3 },
      ],
    },
    blurb: 'Spilled from an overturned inkwell, it hunts by scent of paper.',
  },
  {
    id: 'widow', name: 'Velvet Widow', mood: 'moon', kind: 'widow',
    base: { hp: 900, atk: 102, def: 50 },
    moves: [
      { id: 'lament', name: 'Lament', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 0.8 }] },
      {
        id: 'veil', name: 'Mourning Veil', intent: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 0.6 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
      },
      { id: 'mend', name: 'Black Lace Mend', intent: 'heal', effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.3 }] },
    ],
    pattern: ['lament', 'veil', 'mend'],
    finale: {
      id: 'requiem', name: 'Requiem', intent: 'mass',
      effects: [
        { kind: 'damage', target: 'allEnemies', power: 1.7 },
        { kind: 'status', target: 'allEnemies', status: 'weak', turns: 2 },
      ],
    },
    blurb: 'She waits in the dress circle for a performance that ended in 1899.',
  },
  {
    id: 'lampeater', name: 'Lamp-Eater', mood: 'star', kind: 'lampeater',
    base: { hp: 960, atk: 88, def: 55 },
    moves: [
      { id: 'gnaw', name: 'Gnaw', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.3 }] },
      {
        id: 'snuff', name: 'Snuff', intent: 'snuff',
        effects: [{ kind: 'snuff', amount: 2 }, { kind: 'heal', target: 'self', power: 1.0 }],
      },
    ],
    pattern: ['gnaw', 'snuff', 'gnaw'],
    finale: {
      id: 'swallow', name: 'Swallow the Light', intent: 'mass',
      effects: [{ kind: 'damage', target: 'allEnemies', power: 1.4 }, { kind: 'snuff', amount: 5 }],
    },
    blurb: 'A great moth with a gas mantle for a heart. It feeds on fireflies.',
  },
  {
    id: 'curtaincaller', name: 'The Curtain-Caller', mood: 'moon', kind: 'curtaincaller', boss: true,
    base: { hp: 3000, atk: 112, def: 66 },
    moves: [
      {
        id: 'spotlight', name: 'Spotlight', intent: 'debuff',
        effects: [
          { kind: 'damage', target: 'enemy', power: 1.8 },
          { kind: 'status', target: 'enemy', status: 'frail', turns: 2 },
        ],
      },
      { id: 'encore', name: 'Encore', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 0.85 }] },
      {
        id: 'intermission', name: 'Intermission', intent: 'shield',
        effects: [
          { kind: 'shield', target: 'self', power: 1.6 },
          { kind: 'status', target: 'self', status: 'might', turns: 2 },
        ],
      },
    ],
    pattern: ['spotlight', 'encore', 'intermission', 'encore'],
    finale: { id: 'finalcurtain', name: 'Final Curtain', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 2.2 }] },
    blurb: 'It calls every light back behind the curtain. None return.',
  },
  {
    id: 'gloam', name: 'Madame Gloam', mood: 'star', kind: 'gloam', boss: true,
    base: { hp: 3500, atk: 118, def: 70 },
    moves: [
      { id: 'eclipse', name: 'Eclipse', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.0 }] },
      {
        id: 'gloamveil', name: 'Gloam Veil', intent: 'debuff',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'weak', turns: 2 }, { kind: 'snuff', amount: 2 }],
      },
      { id: 'grasp', name: 'Velvet Grasp', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 2.0 }] },
    ],
    pattern: ['grasp', 'eclipse', 'gloamveil', 'eclipse'],
    finale: {
      id: 'totaleclipse', name: 'Total Eclipse', intent: 'mass',
      effects: [{ kind: 'damage', target: 'allEnemies', power: 2.5 }, { kind: 'snuff', amount: 5 }],
    },
    blurb: 'Mistress of the Dimming. Where her hem passes, the gaslight forgets itself.',
  },
  {
    id: 'gullwraith', name: 'Gull Wraith', mood: 'moon', kind: 'gullwraith',
    base: { hp: 600, atk: 86, def: 32 },
    moves: [
      { id: 'dive', name: 'Diving Shriek', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.15 }] },
      {
        id: 'scatter', name: 'Salt Scatter', intent: 'debuff',
        effects: [{ kind: 'damage', target: 'allEnemies', power: 0.4 }, { kind: 'status', target: 'allEnemies', status: 'weak', turns: 1 }],
      },
    ],
    pattern: ['dive', 'scatter', 'dive'],
    finale: { id: 'squall', name: 'Squall', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.4 }] },
    blurb: 'Gulls that followed a ship into the fog and came back as something hungrier.',
  },
  {
    id: 'stevedore', name: 'Rust Stevedore', mood: 'sun', kind: 'stevedore',
    base: { hp: 1240, atk: 96, def: 78 },
    moves: [
      { id: 'brace', name: 'Brace the Line', intent: 'shield', effects: [{ kind: 'shield', target: 'allAllies', power: 0.7 }] },
      { id: 'hook', name: 'Cargo Hook', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.6 }] },
    ],
    pattern: ['brace', 'hook', 'hook'],
    finale: { id: 'anchor', name: 'Drop Anchor', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 3.0 }] },
    blurb: 'A dock worker of riveted iron, still unloading a cargo nobody ordered.',
  },
  {
    id: 'siren', name: 'Fog Siren', mood: 'star', kind: 'siren',
    base: { hp: 880, atk: 104, def: 46 },
    moves: [
      {
        id: 'lure', name: 'Luring Song', intent: 'debuff',
        effects: [{ kind: 'damage', target: 'enemy', power: 0.7 }, { kind: 'status', target: 'enemy', status: 'frail', turns: 2 }],
      },
      { id: 'tide', name: 'Undertow', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 0.85 }] },
      { id: 'ebb', name: 'Ebb and Mend', intent: 'heal', effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.2 }] },
    ],
    pattern: ['lure', 'tide', 'ebb'],
    finale: {
      id: 'drown', name: 'Drowning Chorus', intent: 'mass',
      effects: [{ kind: 'damage', target: 'allEnemies', power: 1.7 }, { kind: 'status', target: 'allEnemies', status: 'frail', turns: 2 }],
    },
    blurb: 'Her voice sounds exactly like someone you lost. Do not answer it.',
  },
  {
    id: 'keeper', name: 'Keeper Brine', mood: 'moon', kind: 'keeper', boss: true,
    base: { hp: 3700, atk: 120, def: 72 },
    moves: [
      { id: 'beam', name: 'Black Beam', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 2.0 }] },
      { id: 'foghorn', name: 'Foghorn', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 0.95 }] },
      {
        id: 'lensdark', name: 'Darken the Lens', intent: 'snuff',
        effects: [{ kind: 'snuff', amount: 3 }, { kind: 'status', target: 'self', status: 'might', turns: 2 }],
      },
    ],
    pattern: ['beam', 'foghorn', 'lensdark', 'foghorn'],
    finale: {
      id: 'lightsout', name: 'Lighthouse Out', intent: 'mass',
      effects: [{ kind: 'damage', target: 'allEnemies', power: 2.4 }, { kind: 'snuff', amount: 5 }],
    },
    blurb: 'The lighthouse keeper turned his lamp around. Now it shines darkness out to sea.',
  },
  {
    id: 'cogspider', name: 'Cog Spider', mood: 'sun', kind: 'cogspider',
    base: { hp: 720, atk: 94, def: 50 },
    moves: [
      { id: 'nibble', name: 'Gear Nibble', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 0.6, hits: 2 }] },
      {
        id: 'spark', name: 'Spark Web', intent: 'debuff',
        effects: [{ kind: 'damage', target: 'enemy', power: 0.6 }, { kind: 'status', target: 'enemy', status: 'burn', turns: 2, power: 0.35 }],
      },
    ],
    pattern: ['nibble', 'spark', 'nibble'],
    finale: { id: 'shred', name: 'Shredding Wheel', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 0.8, hits: 4 }] },
    blurb: 'It spins its webs from mainsprings and catches seconds instead of flies.',
  },
  {
    id: 'pendulum', name: 'Pendulum Knight', mood: 'star', kind: 'pendulum',
    base: { hp: 1180, atk: 104, def: 74 },
    moves: [
      { id: 'tick', name: 'Tick', intent: 'buff', effects: [{ kind: 'status', target: 'self', status: 'might', turns: 2 }] },
      { id: 'tock', name: 'Tock', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.8 }] },
    ],
    pattern: ['tick', 'tock'],
    finale: { id: 'midnightstroke', name: 'Midnight Stroke', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.8 }] },
    blurb: 'A suit of armour that swings exactly once per second, forever.',
  },
  {
    id: 'chimewisp', name: 'Chime Wisp', mood: 'moon', kind: 'chimewisp',
    base: { hp: 640, atk: 84, def: 36 },
    moves: [
      { id: 'toll', name: 'Toll', intent: 'heal', effects: [{ kind: 'heal', target: 'woundedAlly', power: 1.1 }] },
      { id: 'hush', name: 'Hush the Light', intent: 'snuff', effects: [{ kind: 'snuff', amount: 1 }, { kind: 'damage', target: 'enemy', power: 0.8 }] },
    ],
    pattern: ['hush', 'toll'],
    finale: { id: 'knell', name: 'Death Knell', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.3 }] },
    blurb: 'A loose note from a broken carillon, drifting about looking for a bell.',
  },
  {
    id: 'hourless', name: 'The Hourless King', mood: 'star', kind: 'hourless', boss: true,
    base: { hp: 3500, atk: 120, def: 74 },
    moves: [
      { id: 'stopclock', name: 'Stop the Clock', intent: 'debuff', effects: [{ kind: 'status', target: 'allEnemies', status: 'weak', turns: 2 }, { kind: 'snuff', amount: 2 }] },
      { id: 'secondhand', name: 'Second Hand', intent: 'attack', effects: [{ kind: 'damage', target: 'enemy', power: 1.0, hits: 2 }] },
      { id: 'quarter', name: 'Quarter Chime', intent: 'mass', effects: [{ kind: 'damage', target: 'allEnemies', power: 1.0 }] },
      { id: 'rewind', name: 'Wind Back', intent: 'heal', effects: [{ kind: 'heal', target: 'self', power: 1.6 }, { kind: 'status', target: 'self', status: 'might', turns: 2 }] },
    ],
    pattern: ['secondhand', 'quarter', 'stopclock', 'quarter', 'rewind'],
    finale: {
      id: 'eternity', name: 'Eternal Midnight', intent: 'mass',
      effects: [{ kind: 'damage', target: 'allEnemies', power: 2.6 }, { kind: 'snuff', amount: 5 }],
    },
    blurb: 'He tore the hands from the city clock so that night would never have to end.',
  },
];

const byId = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const e = byId.get(id);
  if (!e) throw new Error(`Unknown enemy ${id}`);
  return e;
}
