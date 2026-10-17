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
];

const byId = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const e = byId.get(id);
  if (!e) throw new Error(`Unknown enemy ${id}`);
  return e;
}
