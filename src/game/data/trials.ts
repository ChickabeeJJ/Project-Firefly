import type { StageDef } from './types';

// Resource and Insight trials, after the reference's "Resource" and "Insight" tabs: repeatable
// stages that drop growth materials. Each family is a short ladder of difficulty levels; a level
// opens once the previous one is cleared and the story has reached the listed stage.

export interface TrialFamily {
  id: string;
  mode: 'resource' | 'insight';
  name: string;
  /** Place name pinned to the card's photograph. */
  code: string;
  item: string;
  blurb: string;
  bg: StageDef['bg'];
  /** Enemy pool (ids) used for the waves. */
  pool: string[];
  boss: string;
}

export const TRIAL_FAMILIES: TrialFamily[] = [
  {
    id: 'ember', mode: 'resource', name: 'Ember Analysis', code: 'Corvid Lane', item: 'dust', bg: 'street',
    blurb: 'Sift the ash of burnt-out lamps on Corvid Lane. Whatever still glows is Wick Dust.',
    pool: ['mothling', 'usher', 'hound', 'lampeater'], boss: 'lampeater',
  },
  {
    id: 'mint', mode: 'resource', name: 'The Brass Mint', code: 'Under the Clock', item: 'sovereign', bg: 'clocktower',
    blurb: 'The old mint under the clock still strikes thirteen-hour coins. The Dimmed guard the presses.',
    pool: ['cogspider', 'pendulum', 'mannequin', 'chimewisp'], boss: 'pendulum',
  },
  {
    id: 'hollow', mode: 'insight', name: 'Moth Hollow', code: 'Corvid Lane', item: 'moth', bg: 'street',
    blurb: 'Where the moths sleep by day, their shed scales drift like snow. Star Luminaries kindle with them.',
    pool: ['mothling', 'lampeater', 'usher'], boss: 'lampeater',
  },
  {
    id: 'wings', mode: 'insight', name: 'Velvet Wings', code: 'The Gloaming', item: 'velvet', bg: 'theatre',
    blurb: 'Backstage at the Gloaming, the seats are unpicking themselves thread by thread. Sun Luminaries kindle with it.',
    pool: ['widow', 'mannequin', 'hound'], boss: 'widow',
  },
  {
    id: 'pools', mode: 'insight', name: 'Tide Pools', code: 'The Breakwater', item: 'tide', bg: 'docks',
    blurb: 'Sea glass glitters in pools the tide forgot. Moon Luminaries kindle with it.',
    pool: ['gullwraith', 'siren', 'stevedore'], boss: 'siren',
  },
  {
    id: 'works', mode: 'insight', name: 'Spring Works', code: 'The Clock Tower', item: 'spring', bg: 'clocktower',
    blurb: 'The clock’s spare mainsprings, still wound tight with stolen hours. Every Luminary needs them for their higher Kindles.',
    pool: ['cogspider', 'chimewisp', 'pendulum'], boss: 'chimewisp',
  },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
/** Story stage gating each difficulty level, per mode. */
const GATES: Record<string, string[]> = {
  ember: ['1-3', '1-6', '2-3', '2-6', '3-4', '4-2'],
  mint: ['1-5', '1-8', '2-5', '2-8', '3-6', '4-4'],
  hollow: ['1-3', '1-7', '2-4', '3-2'],
  wings: ['1-4', '1-8', '2-5', '3-3'],
  pools: ['1-5', '2-2', '2-6', '3-4'],
  works: ['2-3', '2-8', '3-6', '4-4'],
};
const LEVELS = [5, 12, 19, 26, 32, 38];

function waves(f: TrialFamily, lv: number): string[][] {
  const p = f.pool;
  const a = (i: number) => p[(lv + i) % p.length];
  const w: string[][] = [[a(0), a(1)], [a(2), a(0), a(1)].slice(0, lv >= 3 ? 3 : 2)];
  if (lv >= 4) w.push([a(1), f.boss]);
  return w;
}

function drops(f: TrialFamily, lv: number): Record<string, number> {
  if (f.item === 'dust') return { dust: [2400, 4800, 8000, 12000, 17000, 23000][lv - 1] };
  if (f.item === 'sovereign') return { sovereign: [1200, 2400, 4000, 6000, 8500, 11500][lv - 1] };
  return { [f.item]: [2, 3, 4, 6][lv - 1], sovereign: 400 * lv };
}

export const TRIALS: StageDef[] = TRIAL_FAMILIES.flatMap((f) =>
  GATES[f.id].map((gate, i): StageDef => {
    const lv = i + 1;
    return {
      id: `t-${f.id}-${lv}`,
      chapter: 0,
      index: lv,
      name: `${f.name} ${ROMAN[i]}`,
      level: LEVELS[i],
      waves: waves(f, lv),
      roundLimit: 15,
      starRounds: 8 + lv,
      bg: f.bg,
      mode: f.mode,
      family: f.id,
      drops: drops(f, lv),
      requires: gate,
    };
  }),
);

export function trialsOf(familyId: string): StageDef[] {
  return TRIALS.filter((t) => t.family === familyId);
}
