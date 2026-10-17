import type { StageDef } from './types';

export const CHAPTERS = [
  { id: 1, name: 'The Dimming', subtitle: 'Corvid Lane, after dusk' },
  { id: 2, name: 'The Velvet Curtain', subtitle: 'The Royal Gloaming Theatre' },
  { id: 3, name: 'The Drowned Docks', subtitle: 'Vellmoor harbour, low tide' },
  { id: 4, name: 'The Clock Without Hands', subtitle: 'Inside the Cathedral Clock' },
];

export const STAGES: StageDef[] = [
  {
    id: '1-1', chapter: 1, index: 1, name: 'First Light (Tutorial)', level: 1, bg: 'street', tutorial: true,
    waves: [['mothling'], ['mothling', 'mothling']], roundLimit: 15, starRounds: 6,
    outro: 'The first lamp sputters back to life. Somewhere, a firefly answers.',
  },
  {
    id: '1-2', chapter: 1, index: 2, name: "The Usher's Rounds", level: 2, bg: 'street',
    waves: [['mothling', 'usher'], ['usher']], roundLimit: 15, starRounds: 6,
    intro: [
      { speaker: 'Wren', portrait: 'wren', text: 'That usher is walking the lane like it owns a ticket to it.' },
      { speaker: 'Bastian', portrait: 'bastian', text: 'Watch the card above its head. It always shows its hand before it plays it.' },
    ],
    outro: 'An empty lantern rolls into the gutter, still warm.',
  },
  {
    id: '1-3', chapter: 1, index: 3, name: 'Moths at the Window', level: 3, bg: 'street',
    waves: [['mothling', 'mothling', 'mothling'], ['usher', 'mothling']], roundLimit: 15, starRounds: 7,
    intro: [
      { speaker: 'Odile', portrait: 'odile', text: 'They swarm the brightest window first. Keep the light moving.' },
    ],
    outro: 'Curtains twitch along the lane. The neighbours are watching the light come back.',
  },
  {
    id: '1-4', chapter: 1, index: 4, name: 'Clockwork in the Fog', level: 4, bg: 'street',
    waves: [['mannequin'], ['mothling', 'mannequin']], roundLimit: 15, starRounds: 7,
    intro: [
      { speaker: 'Bastian', portrait: 'bastian', text: 'A mannequin from Whitlock\'s window. It winds itself up before it swings.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Then we strike while it is still winding.' },
    ],
    outro: 'A brass key ticks to a stop on the cobbles.',
  },
  {
    id: '1-5', chapter: 1, index: 5, name: 'Ink in the Gutters', level: 5, bg: 'street',
    waves: [['hound', 'hound'], ['hound', 'usher', 'mothling']], roundLimit: 15, starRounds: 8,
    intro: [{ speaker: 'Odile', portrait: 'odile', text: 'Their bites burn. I can mend it, but do not let it pile up.' }],
    outro: 'The ink runs back into the drains, leaving pale footprints.',
  },
  {
    id: '1-6', chapter: 1, index: 6, name: 'Something Eats the Light', level: 6, bg: 'street', rule: 'fireflyBloom',
    waves: [['lampeater', 'mothling'], ['lampeater', 'usher']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Wren', portrait: 'wren', text: 'The fireflies are thick tonight. And so is whatever is eating them.' },
      { speaker: 'Bastian', portrait: 'bastian', text: 'Light the Lantern before that moth swallows our fireflies.' },
    ],
    outro: 'A cloud of freed fireflies drifts up past the rooftops.',
  },
  {
    id: '1-7', chapter: 1, index: 7, name: 'The Theatre Doors', level: 7, bg: 'street',
    waves: [['usher', 'mannequin', 'usher'], ['hound', 'lampeater', 'hound']], roundLimit: 15, starRounds: 9,
    intro: [{ speaker: 'Odile', portrait: 'odile', text: 'The Dimming pours out of the Gloaming Theatre. The doors are open.' }],
    outro: 'Behind the doors, a single spotlight waits on an empty stage.',
  },
  {
    id: '1-8', chapter: 1, index: 8, name: 'The Curtain-Caller', level: 8, bg: 'street', boss: true,
    waves: [['usher', 'usher'], ['curtaincaller']], roundLimit: 18, starRounds: 10,
    intro: [
      { speaker: '???', text: 'Ladies and gentlemen, the show is over. Lights, please... out.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Not tonight. Tonight we are the encore.' },
    ],
    outro: 'The curtain falls on its caller. Corvid Lane is lit from end to end.',
  },
  {
    id: '2-1', chapter: 2, index: 1, name: 'Stalls of Ash', level: 10, bg: 'theatre',
    waves: [['widow', 'mothling'], ['usher', 'usher', 'widow']], roundLimit: 15, starRounds: 8,
    intro: [{ speaker: 'Odile', portrait: 'odile', text: 'Every seat is full. None of them are breathing.' }],
    outro: 'The front stalls empty, one quiet seat at a time.',
  },
  {
    id: '2-2', chapter: 2, index: 2, name: "The Prompter's Box", level: 11, bg: 'theatre',
    waves: [['mannequin', 'widow'], ['hound', 'hound', 'hound']], roundLimit: 15, starRounds: 8,
    outro: 'In the prompter\'s box, a script with every line crossed out.',
  },
  {
    id: '2-3', chapter: 2, index: 3, name: 'Dressing Room Mirrors', level: 12, bg: 'theatre', rule: 'restlessDim',
    waves: [['widow', 'widow'], ['lampeater', 'mannequin']], roundLimit: 15, starRounds: 9,
    intro: [{ speaker: 'Wren', portrait: 'wren', text: 'They are angry before we even walk in. Finales will come fast.' }],
    outro: 'The mirrors clear. For a moment, they show the theatre as it was.',
  },
  {
    id: '2-4', chapter: 2, index: 4, name: 'The Orchestra Pit', level: 13, bg: 'theatre',
    waves: [['hound', 'lampeater', 'hound'], ['mannequin', 'widow']], roundLimit: 15, starRounds: 9,
    outro: 'A cello lies on its side, one string still humming.',
  },
  {
    id: '2-5', chapter: 2, index: 5, name: 'The Fly Gallery', level: 14, bg: 'theatre', rule: 'fireflyBloom',
    waves: [['mothling', 'mothling', 'mothling'], ['lampeater', 'lampeater'], ['widow', 'usher', 'widow']],
    roundLimit: 18, starRounds: 11,
    outro: 'High above the stage, the ropes creak with fireflies.',
  },
  {
    id: '2-6', chapter: 2, index: 6, name: 'Velvet Ropes', level: 15, bg: 'theatre',
    waves: [['mannequin', 'mannequin'], ['widow', 'hound', 'widow']], roundLimit: 15, starRounds: 9,
    outro: 'The velvet ropes fall slack. The way to the stage is open.',
  },
  {
    id: '2-7', chapter: 2, index: 7, name: 'Last Rehearsal', level: 16, bg: 'theatre', rule: 'restlessDim',
    waves: [['usher', 'widow', 'usher'], ['lampeater', 'mannequin']], roundLimit: 15, starRounds: 10,
    intro: [{ speaker: 'Bastian', portrait: 'bastian', text: 'Whoever runs this theatre is rehearsing our ending.' }],
    outro: 'From the wings, a voice laughs like a curtain tearing.',
  },
  {
    id: '2-8', chapter: 2, index: 8, name: 'Madame Gloam', level: 18, bg: 'theatre', boss: true,
    waves: [['widow', 'widow'], ['gloam']], roundLimit: 20, starRounds: 12,
    intro: [
      { speaker: 'Madame Gloam', text: 'Such bright little things. I shall wear your light as a brooch.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Light the Lantern. Everything we have, all at once.' },
    ],
    outro: 'The Gloaming Theatre\'s chandelier blazes. Vellmoor will sleep with the lights on tonight.',
  },
  // Chapter 3 — The Drowned Docks
  {
    id: '3-1', chapter: 3, index: 1, name: 'Low Tide', level: 20, bg: 'docks',
    waves: [['gullwraith', 'gullwraith'], ['stevedore', 'gullwraith']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Nell', portrait: 'nell', text: 'The harbour lights went out first. Every ship out there is sailing blind.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Then we light the way home, one pier at a time.' },
    ],
    outro: 'A trawler sounds its horn somewhere in the fog. Someone saw the light.',
  },
  {
    id: '3-2', chapter: 3, index: 2, name: 'The Fish Market', level: 21, bg: 'docks',
    waves: [['siren', 'gullwraith'], ['stevedore', 'stevedore']], roundLimit: 15, starRounds: 9,
    intro: [{ speaker: 'Odile', portrait: 'odile', text: 'Cover your ears if that song starts. It knows your name.' }],
    outro: 'The market stalls drip with fog, and nothing sings any more.',
  },
  {
    id: '3-3', chapter: 3, index: 3, name: 'Crane Yard', level: 22, bg: 'docks',
    waves: [['stevedore', 'gullwraith'], ['lampeater', 'siren']], roundLimit: 15, starRounds: 9,
    outro: 'A crane swings loose, its hook pointing at the lighthouse.',
  },
  {
    id: '3-4', chapter: 3, index: 4, name: 'Customs House', level: 23, bg: 'docks', rule: 'fireflyBloom',
    waves: [['siren', 'siren'], ['gullwraith', 'lampeater', 'gullwraith']], roundLimit: 15, starRounds: 9,
    intro: [{ speaker: 'Bastian', portrait: 'bastian', text: 'Crates of confiscated fireflies. Someone has been hoarding the light.' }],
    outro: 'The crates burst open. The fog lights up green for a mile.',
  },
  {
    id: '3-5', chapter: 3, index: 5, name: 'The Sunken Pier', level: 24, bg: 'docks',
    waves: [['stevedore', 'gullwraith'], ['siren', 'gullwraith']], roundLimit: 15, starRounds: 10,
    outro: 'Beneath the planks, the water is full of drowned lanterns.',
  },
  {
    id: '3-6', chapter: 3, index: 6, name: 'Salt and Rust', level: 25, bg: 'docks', rule: 'restlessDim',
    waves: [['gullwraith', 'gullwraith', 'gullwraith'], ['stevedore', 'siren']], roundLimit: 15, starRounds: 10,
    outro: 'Rust flakes off the cranes like old paint off a memory.',
  },
  {
    id: '3-7', chapter: 3, index: 7, name: 'The Breakwater', level: 26, bg: 'docks',
    waves: [['siren', 'lampeater'], ['stevedore', 'gullwraith']], roundLimit: 16, starRounds: 11,
    intro: [{ speaker: 'Nell', portrait: 'nell', text: 'The lighthouse is shining. But it is shining black.' }],
    outro: 'At the end of the breakwater, a door creaks open on its own.',
  },
  {
    id: '3-8', chapter: 3, index: 8, name: 'Keeper Brine', level: 28, bg: 'docks', boss: true,
    waves: [['siren', 'siren'], ['keeper']], roundLimit: 20, starRounds: 12,
    intro: [
      { speaker: 'Keeper Brine', text: 'Ships kept crashing on my rocks, so I taught the light to hide them. Kinder, isn\'t it?' },
      { speaker: 'Wren', portrait: 'wren', text: 'Turn the lamp around, keeper. Or we will do it for you.' },
    ],
    outro: 'The lighthouse beam swings back out to sea. Somewhere, a ship turns for home.',
  },

  // Chapter 4 — The Clock Without Hands
  {
    id: '4-1', chapter: 4, index: 1, name: 'The Bell Tower Stairs', level: 30, bg: 'clocktower',
    waves: [['cogspider', 'cogspider'], ['chimewisp', 'pendulum']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Augustin', portrait: 'augustin', text: 'The cathedral clock has stopped. That is why the night will not end.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Then we climb up and wind it ourselves.' },
    ],
    outro: 'The stairs creak in a rhythm that is almost, but not quite, a tick.',
  },
  {
    id: '4-2', chapter: 4, index: 2, name: 'Escapement', level: 31, bg: 'clocktower',
    waves: [['pendulum', 'chimewisp'], ['cogspider', 'cogspider', 'cogspider']], roundLimit: 15, starRounds: 9,
    outro: 'A great gear shudders, catches, and turns one notch.',
  },
  {
    id: '4-3', chapter: 4, index: 3, name: 'The Carillon', level: 32, bg: 'clocktower', rule: 'restlessDim',
    waves: [['chimewisp', 'chimewisp', 'chimewisp'], ['pendulum', 'siren']], roundLimit: 15, starRounds: 10,
    intro: [{ speaker: 'Delphine', portrait: 'delphine', text: 'The bells are out of tune. Let me show them the right note.' }],
    outro: 'One bell rings true, and the fog outside thins a little.',
  },
  {
    id: '4-4', chapter: 4, index: 4, name: 'Mainspring', level: 33, bg: 'clocktower',
    waves: [['cogspider', 'pendulum'], ['mannequin', 'chimewisp']], roundLimit: 15, starRounds: 10,
    outro: 'The mainspring is wound tight with stolen hours.',
  },
  {
    id: '4-5', chapter: 4, index: 5, name: 'Gallery of Faces', level: 34, bg: 'clocktower', rule: 'fireflyBloom',
    waves: [['widow', 'chimewisp'], ['lampeater', 'lampeater'], ['pendulum', 'pendulum']], roundLimit: 18, starRounds: 12,
    outro: 'Every clock face in the gallery shows a different, wrong time.',
  },
  {
    id: '4-6', chapter: 4, index: 6, name: 'The Stopped Minute', level: 35, bg: 'clocktower',
    waves: [['pendulum', 'cogspider'], ['siren', 'chimewisp']], roundLimit: 15, starRounds: 11,
    outro: 'Dust hangs in the air, unmoving, waiting for the next second.',
  },
  {
    id: '4-7', chapter: 4, index: 7, name: 'The Clock Face', level: 36, bg: 'clocktower', rule: 'restlessDim',
    waves: [['pendulum', 'chimewisp'], ['curtaincaller']], roundLimit: 18, starRounds: 12,
    intro: [{ speaker: 'Bastian', portrait: 'bastian', text: 'Him again? The Dimming really does love an encore.' }],
    outro: 'Behind the clock face, a throne made of hour hands.',
  },
  {
    id: '4-8', chapter: 4, index: 8, name: 'The Hourless King', level: 38, bg: 'clocktower', boss: true,
    waves: [['chimewisp', 'cogspider'], ['hourless']], roundLimit: 22, starRounds: 14,
    intro: [
      { speaker: 'The Hourless King', text: 'Morning is a cruelty. I have abolished it. You may thank me.' },
      { speaker: 'Wren', portrait: 'wren', text: 'Everyone, light the Lantern. Let us show him what a sunrise looks like.' },
    ],
    outro: 'The cathedral clock strikes six. For the first time in a long while, Vellmoor sees the dawn.',
  },

];

const byId = new Map(STAGES.map((s) => [s.id, s]));

export function getStage(id: string): StageDef {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}

export function nextStageId(id: string): string | null {
  const i = STAGES.findIndex((s) => s.id === id);
  return i >= 0 && i + 1 < STAGES.length ? STAGES[i + 1].id : null;
}
