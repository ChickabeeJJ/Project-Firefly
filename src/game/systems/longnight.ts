import { track } from './tasks';
import type { BattleMods } from '../battle/engine';
import { Rng } from '../battle/rng';
import { registerStage } from '../data/stages';
import type { StageDef } from '../data/types';
import type { SaveData } from '../persistence/schema';
import { effectiveLevel, grant, type ItemId } from './growth';

// THE LONG NIGHT — a climb up the Cathedral Clock, one hour at a time, to dawn.
//
// A run is thirteen hours. Each hour offers two or three doors (a branching map, chosen by the
// player): skirmishes, Omen fights (harder, better spoils), Sanctuaries, Curio cabinets and
// Letters (small story choices). Wounds carry from fight to fight; wins earn Embers (spent in
// the run) and a choice of Keepsakes (relics that bend the rules of battle). The Thirteenth
// Hour holds the Hourless King. Every run is a fresh seed; how high you climb sets the reward.

export const HOURS = 13;

export type NodeKind = 'skirmish' | 'omen' | 'sanctuary' | 'curio' | 'letter' | 'boss';

export interface NightNode {
  id: string;
  hour: number;
  /** Row on the map, 0..2. */
  lane: number;
  kind: NodeKind;
  /** Node ids reachable in the next hour. */
  next: string[];
  /** Battle nodes: enemy waves. */
  waves?: string[][];
  /** Omen fights carry one Omen (an enemy boon). */
  omen?: string;
  /** Letter nodes: which letter. */
  letter?: string;
}

export interface NightRun {
  seed: number;
  team: string[];
  /** Character id -> HP fraction (0 = fallen). */
  hp: Record<string, number>;
  nodes: NightNode[];
  /** Node ids visited, in order. */
  path: string[];
  keepsakes: string[];
  embers: number;
  /** Set while a reward or event is waiting to be resolved on the map. */
  pending?: { kind: 'spoils'; choices: string[]; embers: number } | { kind: 'event'; node: string };
  /** Battle level for hour 1 (scaled to the team when the run starts). */
  baseLevel: number;
  /** Times the Last Letter keepsake has already been spent. */
  revived?: boolean;
  /** What happened on the way up; decides which ending dawn brings. */
  stats?: { omens: number; letters: number; fell: boolean; sanctuaries: number };
}

export interface NightRecord {
  run: NightRun | null;
  best: number;
  clears: number;
  runs: number;
  /** Milestone hours whose first-reach bonus has been paid. */
  milestones: number[];
  /** Ending badges earned (ids of ENDINGS). */
  badges: string[];
}

export const freshNight = (): NightRecord => ({ run: null, best: 0, clears: 0, runs: 0, milestones: [], badges: [] });

// ------------------------------------------------------------------ the story of each hour

/** A short scene for each landing of the clock, read as you stand before its door. */
export const HOUR_TALES: string[] = [
  'The cathedral door is unlocked. It has been unlocked for a year; nobody has wanted to go in. The first stair smells of candle-smoke and wet stone, and somewhere above, the great clock ticks — once — and waits.',
  'Hymn-boards line the second landing, their numbers peeled away. Something has been sitting in the pews, listening to a sermon nobody is giving. It turns its head as your lantern finds it.',
  'The bell-ringers’ ropes hang here, frayed to threads. A child’s chalk drawing on the wall shows a clock with thirteen hours and a smiling sun. The sun has been scribbled out, carefully, many times.',
  'Here the stairs narrow and the windows begin. Through the cracked glass you can see Vellmoor laid out below — every street dark but one: the lane you came from, where a single lamp still burns.',
  'The fifth landing is a choir loft. Sheet music lies everywhere, every page the same aria, every page ending a bar too soon. Mireille would know the piece. She would know where it is meant to end.',
  'A chapel on the stair, the size of a cupboard, with a votive still burning in it. Someone has been climbing ahead of you, lighting candles as they go. The wax is still soft.',
  'Halfway. The clock’s workings begin here: brass wheels taller than doors, turning so slowly you cannot see them move — only hear them. Every tooth that passes is a minute stolen from someone below.',
  'A clockmaker’s bench, tools laid out as if he stepped away a moment ago. A half-finished hand lies on the cloth. Its inscription reads: for the thirteenth hour. Do not fit.',
  'The pendulum chamber. The great weight swings past close enough to stir your hair, and with every swing the shadows on the wall lean in, as though the room itself were holding its breath.',
  'Ten hours climbed. Your legs ache in a way that feels like a year. The fireflies in your lantern have gone quiet, gathered close around the wick, the way people gather near a door before bad news.',
  'The dial room. You stand behind the clock’s great face and see the city through its numbers, backwards. The minute hand is a bridge of iron overhead. Something is walking along it.',
  'The last landing below the bells. A single chair, turned to face the stair. On it, a pocket watch, open, running — thirteen hours on its face — and a note in a careful hand: nearly there.',
  'The top of the clock. No more stairs. The thirteenth hour stands where the bells should be, wearing a crown of stopped hands, and it has been expecting you since midnight a year ago.',
];

/** A line for what kind of door it is, added under the hour's scene. */
export const KIND_TALES: Record<NodeKind, string> = {
  skirmish: 'Shapes move on the landing ahead. The Dimmed have heard your footsteps.',
  omen: 'The air here is wrong — too cold, too still. Whatever waits behind this door has been fed.',
  sanctuary: 'A warm light spills from a side chapel. For a little while, nothing can follow you in.',
  curio: 'A cabinet of curiosities stands against the wall, its little drawers labelled in copperplate.',
  letter: 'An envelope has been pinned to the bannister, addressed to whoever climbs.',
  boss: 'The bells are silent. The king is not.',
};

// ------------------------------------------------------------------ endings and badges

export interface Ending {
  id: string;
  name: string;
  /** How it is earned (shown on the badge before it is won). */
  hint: string;
  /** Painted badge (ui/badge_*). */
  badge: string;
  epilogue: string[];
}

export const ENDINGS: Ending[] = [
  {
    id: 'ember', name: 'The Burning Clock', badge: 'badge_ember', hint: 'Reach dawn having fought through three Omens.',
    epilogue: [
      'You did not climb the clock so much as set it alight. Every Omen you walked into burned a little brighter for having met you.',
      'When the king fell, the gears were still glowing red. Vellmoor woke to a tower lit from inside like a lantern, and for a whole day nobody could look directly at it.',
    ],
  },
  {
    id: 'tide', name: 'The Quiet Tide', badge: 'badge_tide', hint: 'Reach dawn without a single Luminary falling.',
    epilogue: [
      'Not one of you fell. You came up the stair the way the tide comes up a beach: unhurried, unbroken, impossible to turn back.',
      'At dawn the troupe stood together under the bells and found they had nothing to say. They did not need to. Somewhere below, the harbour began, very softly, to move again.',
    ],
  },
  {
    id: 'verdant', name: 'The Kept Promise', badge: 'badge_verdant', hint: 'Reach dawn having answered two Letters on the stair.',
    epilogue: [
      'You stopped for the letters. Of course you did — a letter is a road that runs one way, and ends at just one door.',
      'At dawn you carried them down with you. By noon every one had been delivered, and in nineteen kitchens on Corvid Lane, somebody remembered a name.',
    ],
  },
  {
    id: 'dawn', name: 'Dawn', badge: 'badge_dawn', hint: 'Reach the top of the clock and defeat the Hourless King.',
    epilogue: [
      'The thirteenth hour struck — and then, for the first time in a year, the first.',
      'It was not a grand sunrise. It was grey, and wet, and a little late. Every person in Vellmoor stood in the street to watch it anyway.',
    ],
  },
  {
    id: 'dusk', name: 'The Long Dark', badge: 'badge_dusk', hint: 'Fall in the night after climbing past the seventh hour.',
    epilogue: [
      'The light went out somewhere above the halfway mark. But it went out higher than anyone had carried it before.',
      'The next night, someone found your footprints on the stair and followed them up. That is how it works with lamps: the second one is always easier to light.',
    ],
  },
];

export const ending = (id: string): Ending => ENDINGS.find((e) => e.id === id) ?? ENDINGS[3];

/** Which endings a finished run earns; the first is the one told. */
export function endingsFor(run: NightRun | null, cleared: boolean, hours: number): string[] {
  const st = run?.stats ?? { omens: 0, letters: 0, fell: true, sanctuaries: 0 };
  if (!cleared) return hours >= 7 ? ['dusk'] : [];
  const out: string[] = [];
  if (st.omens >= 3) out.push('ember');
  if (!st.fell) out.push('tide');
  if (st.letters >= 2) out.push('verdant');
  out.push('dawn');
  return out;
}

// ------------------------------------------------------------------ Keepsakes

export interface Keepsake {
  id: string;
  name: string;
  blurb: string;
  /** Texture key of the painted icon (hf:ui/...). */
  icon: string;
  rare?: boolean;
  mods?: BattleMods;
}

export const KEEPSAKES: Keepsake[] = [
  { id: 'brooch', name: 'Moth-Wing Brooch', icon: 'hf:ui/motif_orb', blurb: '+10% critical chance.', mods: { crit: 0.1 } },
  { id: 'spectacles', name: 'Brass Spectacles', icon: 'hf:ui/motif_compass', blurb: 'Luminaries deal 12% more damage.', mods: { allyAtk: 1.12 } },
  { id: 'veil', name: 'Mourning Veil', icon: 'hf:ui/stat_def', blurb: 'Luminaries have 20% more defence.', mods: { allyDef: 1.2 } },
  { id: 'corset', name: 'Iron Corset', icon: 'hf:ui/stat_hp', blurb: 'Luminaries have 15% more maximum HP.', mods: { allyHp: 1.15 } },
  { id: 'wick', name: 'Second Wick', icon: 'hf:ui/motif_fire', blurb: 'One extra firefly lights a Verse each round.', mods: { lights: 1 } },
  { id: 'jar', name: 'Jar of Fireflies', icon: 'hf:ui/obj_lantern', blurb: 'Every battle begins with 3 fireflies in the Lantern.', mods: { fireflies: 3 } },
  { id: 'overture', name: 'Overture', icon: 'hf:ui/motif_metronome', blurb: 'Luminaries begin each battle with 2 Ardor.', mods: { ardor: 2 } },
  { id: 'flask', name: 'Rainwater Flask', icon: 'hf:ui/obj_potion', blurb: 'Clearing a wave heals the troupe 12%.', mods: { waveHeal: 0.12 } },
  { id: 'lullaby', name: 'Music Box', icon: 'hf:ui/obj_watch', blurb: 'The Dimmed hit 10% softer.', mods: { enemyAtk: 0.9 } },
  { id: 'key', name: "Clockmaker's Key", icon: 'hf:ui/motif_key', blurb: 'The Dimmed have 10% less HP.', mods: { enemyHp: 0.9 } },
  { id: 'lily', name: 'Pressed Lily', icon: 'hf:ui/obj_lily', blurb: 'After every battle, the troupe heals 15%.' },
  { id: 'satchel', name: "Postman's Satchel", icon: 'hf:ui/obj_letters', blurb: 'Every battle pays 50% more Embers.' },
  { id: 'umbrella', name: 'Black Umbrella', icon: 'hf:ui/motif_umbrella', blurb: 'Omens no longer strengthen the Dimmed.' },
  { id: 'hourglass', name: 'Reversed Hourglass', icon: 'hf:ui/motif_hourglass', rare: true, blurb: 'Luminaries deal 25% more damage and begin with 1 Ardor.', mods: { allyAtk: 1.25, ardor: 1 } },
  { id: 'crystal', name: 'Heart of Glass', icon: 'hf:ui/obj_crystal', rare: true, blurb: '+25% maximum HP and +15% defence.', mods: { allyHp: 1.25, allyDef: 1.15 } },
  { id: 'dove', name: 'Homing Dove', icon: 'hf:ui/motif_dove', rare: true, blurb: 'Once per night, a fallen Luminary returns at half HP after a battle.' },
  { id: 'quill', name: "Archivist's Quill", icon: 'hf:ui/obj_quill', rare: true, blurb: 'Two extra fireflies each round; the Lantern starts with 2.', mods: { lights: 2, fireflies: 2 } },
];

export const keepsake = (id: string): Keepsake => KEEPSAKES.find((k) => k.id === id) ?? KEEPSAKES[0];

// ------------------------------------------------------------------ Omens

export interface Omen {
  id: string;
  name: string;
  blurb: string;
  mods: BattleMods;
}

export const OMENS: Omen[] = [
  { id: 'feast', name: 'The Feast', blurb: 'The Dimmed have 30% more HP.', mods: { enemyHp: 1.3 } },
  { id: 'teeth', name: 'Bared Teeth', blurb: 'The Dimmed hit 25% harder.', mods: { enemyAtk: 1.25 } },
  { id: 'restless', name: 'Restless', blurb: 'The Dimmed begin with 3 Ardor — Finales come early.', mods: { enemyArdor: 3 } },
];

export const omen = (id: string): Omen => OMENS.find((o) => o.id === id) ?? OMENS[0];

// ------------------------------------------------------------------ Letters

export interface LetterChoice {
  label: string;
  /** What the choice does, in a few words. */
  effect: string;
  /** Applied to the run when chosen; returns a line for the outcome. */
  apply: (run: NightRun, rng: Rng) => string;
}

export interface Letter {
  id: string;
  title: string;
  text: string;
  sign: string;
  choices: LetterChoice[];
}

const hurtAll = (run: NightRun, f: number) => {
  for (const id of run.team) if (run.hp[id] > 0) run.hp[id] = Math.max(0.05, run.hp[id] - f);
};
const healAll = (run: NightRun, f: number) => {
  for (const id of run.team) if (run.hp[id] > 0) run.hp[id] = Math.min(1, run.hp[id] + f);
};

export const LETTERS: Letter[] = [
  {
    id: 'window', title: 'A Lamp in the Window', sign: '— 19 Corvid Lane',
    text: 'If you are climbing, look for a window on the fourth landing with a candle in it. I have kept it lit for a year. I cannot keep it lit much longer. Please — carry it the rest of the way.',
    choices: [
      { label: 'Carry the candle', effect: 'Troupe loses 15% HP · gain a rare Keepsake', apply: (r, rng) => {
        hurtAll(r, 0.15);
        const k = draftKeepsakes(r, rng, 1, true)[0];
        if (k) r.keepsakes.push(k);
        return k ? `The flame is small and stubborn. ${keepsake(k).name} joins you.` : 'The flame is small and stubborn.';
      } },
      { label: 'Leave it burning', effect: 'Troupe heals 20%', apply: (r) => {
        healAll(r, 0.2);
        return 'You let it be. Somehow its light follows you up the stairs.';
      } },
    ],
  },
  {
    id: 'debt', title: 'An Unpaid Debt', sign: '— the Brass Mint',
    text: 'Forty Sovereigns owed since the night the clock stopped. The man who owed them is upstairs, hollow. Take them from his coat, or let a dead debt die.',
    choices: [
      { label: 'Collect', effect: '+60 Embers', apply: (r) => {
        r.embers += 60;
        return 'The coins are warm. You try not to think about why.';
      } },
      { label: 'Forgive it', effect: 'Troupe heals 30%', apply: (r) => {
        healAll(r, 0.3);
        return 'A weight you did not know you carried is set down.';
      } },
    ],
  },
  {
    id: 'mirror', title: 'Dressing Room Mirror', sign: '— unsigned, in lipstick',
    text: 'The mirror on this landing shows you as you were before the Dimming. Look long enough and it will show you stronger. Look too long and it keeps something.',
    choices: [
      { label: 'Look long', effect: 'Troupe loses 25% HP · damage +12% (Keepsake)', apply: (r) => {
        hurtAll(r, 0.25);
        r.keepsakes.push('spectacles');
        return 'Your reflection smiles a moment after you do.';
      } },
      { label: 'Look away', effect: 'Nothing happens', apply: () => 'You keep your eyes on the stairs.' },
    ],
  },
  {
    id: 'crows', title: 'Sexton’s Errand', sign: '— a crow, by way of explanation',
    text: 'A crow with one white feather drops a note: a shortcut through the bell-loft, if you do not mind the noise. The Dimmed will hear you coming. You will be upstairs sooner.',
    choices: [
      { label: 'Take the shortcut', effect: '+40 Embers · next fight is an Omen fight', apply: (r) => {
        r.embers += 40;
        const now = r.path.length ? r.nodes.find((n) => n.id === r.path[r.path.length - 1]) : undefined;
        for (const id of now?.next ?? []) {
          const n = r.nodes.find((x) => x.id === id);
          if (n && (n.kind === 'skirmish')) {
            n.kind = 'omen';
            n.omen = 'teeth';
          }
        }
        return 'The bells ring as you pass. Every Dimmed on the next landing is awake.';
      } },
      { label: 'Feed the crow', effect: 'Troupe heals 15%', apply: (r) => {
        healAll(r, 0.15);
        return 'Sexton accepts the crust with immense condescension.';
      } },
    ],
  },
  {
    id: 'clockmaker', title: 'The Clockmaker’s Note', sign: '— A. Vire',
    text: 'To whoever finds this: the clock can be slowed, not stopped. Wind the small key on this landing back three turns and the next hour will pass more gently. It will cost you something to turn.',
    choices: [
      { label: 'Turn the key', effect: '−40 Embers · Keepsake: Clockmaker’s Key', apply: (r) => {
        if (r.embers < 40) return 'The key will not turn for you yet. (Not enough Embers.)';
        r.embers -= 40;
        r.keepsakes.push('key');
        return 'Three turns. Somewhere above, the great hand shudders.';
      } },
      { label: 'Pocket the note', effect: '+25 Embers', apply: (r) => {
        r.embers += 25;
        return 'Some things are worth keeping simply because they were written.';
      } },
    ],
  },
];

export const letter = (id: string): Letter => LETTERS.find((l) => l.id === id) ?? LETTERS[0];

// ------------------------------------------------------------------ the map

const BANDS: { bg: StageDef['bg']; pool: string[] }[] = [
  { bg: 'street', pool: ['mothling', 'usher', 'hound', 'lampeater'] },
  { bg: 'theatre', pool: ['mannequin', 'widow', 'usher', 'hound'] },
  { bg: 'docks', pool: ['gullwraith', 'siren', 'stevedore', 'lampeater'] },
  { bg: 'clocktower', pool: ['cogspider', 'pendulum', 'chimewisp', 'mannequin'] },
];
const ELITES = ['curtaincaller', 'gloam', 'keeper'];

export function bandFor(hour: number): (typeof BANDS)[number] {
  return BANDS[Math.min(3, Math.floor((hour - 1) / 3.25))];
}

function waves(rng: Rng, hour: number, kind: NodeKind): string[][] {
  if (kind === 'boss') return [['chimewisp', 'pendulum', 'cogspider'], ['hourless']];
  const p = bandFor(hour).pool;
  const two = () => [rng.pick(p), rng.pick(p)];
  const three = () => [rng.pick(p), rng.pick(p), rng.pick(p)];
  if (kind === 'omen') return hour >= 7 ? [three(), [rng.pick(p), rng.pick(ELITES)]] : [two(), three()];
  return hour <= 2 ? [two()] : hour <= 6 ? [two(), two()] : [two(), three()];
}

/** Builds the branching map: three lanes, two or three doors an hour, every door reachable. */
export function buildMap(rng: Rng): NightNode[] {
  const nodes: NightNode[] = [];
  const rows: NightNode[][] = [];
  const letters = [...LETTERS.map((l) => l.id)].sort(() => rng.next() - 0.5);
  for (let h = 1; h <= HOURS; h++) {
    const lanes = h === HOURS ? [1] : h === 1 ? [0, 2] : rng.chance(0.55) ? [0, 1, 2] : rng.pick([[0, 2], [0, 1], [1, 2]]);
    const row = lanes.map((lane) => {
      let kind: NodeKind;
      if (h === HOURS) kind = 'boss';
      else if (h === 1) kind = 'skirmish';
      else if (h === 6 || h === 12) kind = lane === 1 || lanes.length === 2 && lane === lanes[1] ? 'sanctuary' : rng.chance(0.5) ? 'skirmish' : 'omen';
      else {
        const r = rng.next();
        kind = r < 0.42 ? 'skirmish' : r < 0.62 && h >= 3 ? 'omen' : r < 0.74 ? 'letter' : r < 0.88 && h >= 3 ? 'curio' : 'skirmish';
      }
      const n: NightNode = { id: `n${h}_${lane}`, hour: h, lane, kind, next: [] };
      if (kind === 'skirmish' || kind === 'omen' || kind === 'boss') n.waves = waves(rng, h, kind);
      if (kind === 'omen') n.omen = rng.pick(OMENS).id;
      if (kind === 'letter') n.letter = letters.length ? letters.pop()! : 'debt';
      return n;
    });
    rows.push(row);
    nodes.push(...row);
  }
  // Wire each node to the nearest doors above it; make sure every door has a way in.
  for (let h = 0; h < rows.length - 1; h++) {
    const up = rows[h + 1];
    for (const n of rows[h]) {
      const near = up.filter((u) => Math.abs(u.lane - n.lane) <= 1);
      const pool = near.length ? near : [up.reduce((a, b) => (Math.abs(a.lane - n.lane) <= Math.abs(b.lane - n.lane) ? a : b))];
      n.next = pool.map((u) => u.id);
    }
    for (const u of up) {
      if (!rows[h].some((n) => n.next.includes(u.id))) {
        const from = rows[h].reduce((a, b) => (Math.abs(a.lane - u.lane) <= Math.abs(b.lane - u.lane) ? a : b));
        from.next.push(u.id);
      }
    }
  }
  return nodes;
}

// ------------------------------------------------------------------ the run

export function startRun(save: SaveData, seed: number): NightRun {
  const team = save.team.filter((id) => save.roster[id]);
  const lv = team.reduce((a, id) => a + effectiveLevel(save.roster[id]), 0) / Math.max(1, team.length);
  const rng = new Rng(seed);
  const run: NightRun = {
    seed, team, hp: Object.fromEntries(team.map((id) => [id, 1])), nodes: buildMap(rng), path: [], keepsakes: [], embers: 0,
    stats: { omens: 0, letters: 0, fell: false, sanctuaries: 0 },
    baseLevel: Math.max(1, Math.round(lv - 3)),
  };
  save.night.run = run;
  save.night.runs++;
  return run;
}

export const nodeById = (run: NightRun, id: string): NightNode | undefined => run.nodes.find((n) => n.id === id);
export const currentNode = (run: NightRun): NightNode | undefined => nodeById(run, run.path[run.path.length - 1] ?? '');
export const hourReached = (run: NightRun): number => currentNode(run)?.hour ?? 0;

/** Doors the player may take now. */
export function reachable(run: NightRun): NightNode[] {
  const cur = currentNode(run);
  if (!cur) return run.nodes.filter((n) => n.hour === 1);
  return cur.next.map((id) => nodeById(run, id)!).filter(Boolean);
}

export function aliveTeam(run: NightRun): string[] {
  return run.team.filter((id) => run.hp[id] > 0);
}

/** Combined battle modifiers from Keepsakes (and an Omen, unless the Umbrella shelters you). */
export function runMods(run: NightRun, node?: NightNode): BattleMods {
  const m: Required<BattleMods> = { allyAtk: 1, allyDef: 1, allyHp: 1, enemyAtk: 1, enemyHp: 1, crit: 0, lights: 0, fireflies: 0, ardor: 0, enemyArdor: 0, waveHeal: 0 };
  const add = (b: BattleMods) => {
    for (const k of ['allyAtk', 'allyDef', 'allyHp', 'enemyAtk', 'enemyHp'] as const) if (b[k] !== undefined) m[k] *= b[k]!;
    for (const k of ['crit', 'lights', 'fireflies', 'ardor', 'enemyArdor', 'waveHeal'] as const) if (b[k] !== undefined) m[k] += b[k]!;
  };
  for (const id of run.keepsakes) {
    const k = keepsake(id);
    if (k.mods) add(k.mods);
  }
  if (node?.omen && !run.keepsakes.includes('umbrella')) add(omen(node.omen).mods);
  return m;
}

/** The battle stage for a node, registered so the battle scene can load it by id. */
export function stageFor(run: NightRun, node: NightNode): StageDef {
  const band = bandFor(node.hour);
  const level = run.baseLevel + Math.round(node.hour * 0.9) + (node.kind === 'omen' ? 2 : node.kind === 'boss' ? 4 : 0);
  const def: StageDef = {
    id: `night-${node.id}`, chapter: 0, index: node.hour, name: node.kind === 'boss' ? 'The Thirteenth Hour' : `The ${ordinal(node.hour)} Hour`,
    level, waves: node.waves ?? [['mothling']], roundLimit: 18, starRounds: 99, bg: band.bg, boss: node.kind === 'boss',
  };
  registerStage(def);
  return def;
}

export function ordinal(h: number): string {
  return ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth'][h - 1] ?? `${h}th`;
}

/** Keepsake choices: commons and (with luck, or `rare`) a rare, never ones already owned. */
export function draftKeepsakes(run: NightRun, rng: Rng, n: number, rare = false): string[] {
  const owned = new Set(run.keepsakes);
  const pool = KEEPSAKES.filter((k) => !owned.has(k.id) && (rare ? k.rare : true));
  const out: string[] = [];
  while (out.length < n && pool.length) {
    const weights = pool.map((k) => (k.rare ? (rare ? 1 : 0.35) : 1));
    let r = rng.next() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0].id);
  }
  return out;
}

/** A battle came back: carry wounds, pay Embers, offer Keepsakes. Returns false when the run ends. */
export function afterBattle(run: NightRun, node: NightNode, won: boolean, hp: Record<string, number>): boolean {
  for (const id of run.team) run.hp[id] = Math.max(0, Math.min(1, hp[id] ?? 0));
  run.stats ??= { omens: 0, letters: 0, fell: false, sanctuaries: 0 };
  if (run.team.some((id) => run.hp[id] <= 0)) run.stats.fell = true;
  if (!won) return false;
  if (node.kind === 'omen') run.stats.omens++;
  if (run.keepsakes.includes('lily')) for (const id of run.team) if (run.hp[id] > 0) run.hp[id] = Math.min(1, run.hp[id] + 0.15);
  if (run.keepsakes.includes('dove') && !run.revived) {
    const fallen = run.team.find((id) => run.hp[id] <= 0);
    if (fallen) {
      run.hp[fallen] = 0.5;
      run.revived = true;
    }
  }
  if (node.kind === 'boss') return true;
  const rng = new Rng(run.seed ^ (node.hour * 7919 + node.lane * 31));
  const base = node.kind === 'omen' ? 45 : 25;
  const embers = Math.round((base + node.hour * 2) * (run.keepsakes.includes('satchel') ? 1.5 : 1));
  run.embers += embers;
  run.pending = { kind: 'spoils', choices: draftKeepsakes(run, rng, 3, node.kind === 'omen'), embers };
  return true;
}

/** Curio prices. */
export const CURIO = { keepsake: 70, rareKeepsake: 120, mend: 30 };

/** Rewards for a run that reached `hours` (13 = dawn). */
export function runRewards(hours: number, cleared: boolean): { glimmer: number; items: Partial<Record<ItemId, number>> } {
  const items: Partial<Record<ItemId, number>> = { dust: hours * 1400, sovereign: hours * 650 };
  if (hours >= 5) items.moth = 1 + Math.floor(hours / 6);
  if (hours >= 8) items.velvet = 1 + Math.floor(hours / 9);
  if (hours >= 10) items.spring = 1 + (cleared ? 1 : 0);
  return { glimmer: hours * 8 + (cleared ? 120 : 0), items };
}

/** First time ever reaching these hours pays a one-off Glimmer bonus. */
export const MILESTONES: Record<number, number> = { 4: 60, 8: 100, 13: 200 };

/** Ends the run: pays rewards and milestones, records the best. */
export function endRun(save: SaveData, cleared: boolean, abandoned = false): { hours: number; glimmer: number; items: Partial<Record<ItemId, number>>; bonus: number; record: boolean; endings: string[]; newBadges: string[] } {
  const run = save.night.run;
  // A lost fight does not count its hour; walking away after a finished hour does.
  const hours = run ? (cleared ? HOURS : Math.max(0, hourReached(run) - (abandoned && !run.pending ? 0 : 1))) : 0;
  const r = runRewards(hours, cleared);
  let bonus = 0;
  for (const [h, g] of Object.entries(MILESTONES)) {
    if (hours >= +h && !save.night.milestones.includes(+h)) {
      save.night.milestones.push(+h);
      bonus += g;
    }
  }
  if (hours) track(save, 'night', hours);
  const record = hours > save.night.best;
  save.night.best = Math.max(save.night.best, hours);
  if (cleared) save.night.clears++;
  save.glimmer += r.glimmer + bonus;
  grant(save, r.items);
  const endings = endingsFor(run, cleared, hours);
  const newBadges = endings.filter((e) => !save.night.badges.includes(e));
  save.night.badges.push(...newBadges);
  // Each badge's first earning pays a little Glimmer.
  save.glimmer += newBadges.length * 30;
  bonus += newBadges.length * 30;
  save.night.run = null;
  return { hours, glimmer: r.glimmer, items: r.items, bonus, record, endings, newBadges };
}

export function sanitizeNight(raw: unknown): NightRecord {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const n = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);
  const run = o.run && typeof o.run === 'object' && Array.isArray((o.run as NightRun).nodes) && Array.isArray((o.run as NightRun).team) ? (o.run as NightRun) : null;
  return {
    run, best: n(o.best, HOURS), clears: n(o.clears, 1e6), runs: n(o.runs, 1e6),
    milestones: Array.isArray(o.milestones) ? (o.milestones as unknown[]).filter((x): x is number => typeof x === 'number') : [],
    badges: Array.isArray(o.badges) ? (o.badges as unknown[]).filter((x): x is string => typeof x === 'string' && ENDINGS.some((e) => e.id === x)) : [],
  };
}
