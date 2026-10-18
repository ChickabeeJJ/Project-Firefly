import { SAGAS } from './saga';
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
    outro: 'The first lamp on Corvid Lane sputters back to life. In its light, a name reappears on a doorplate that had gone blank.',
  },
  {
    id: '1-2', chapter: 1, index: 2, name: "The Usher's Rounds", level: 2, bg: 'street',
    waves: [['mothling', 'usher'], ['usher']], roundLimit: 15, starRounds: 6,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'That usher walks the lane leading people away. Nobody it guides ever comes back.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Watch the sign above its head. The Dimmed always show what they mean to do — they were made from things that were never allowed to surprise anyone.' },
    ],
    outro: 'The usher crumbles to an empty uniform. In its pocket: a ticket for the Gloaming Theatre’s New Year Gala, 31 December 1929.',
  },
  {
    id: '1-3', chapter: 1, index: 3, name: 'Moths at the Window', level: 3, bg: 'street',
    waves: [['mothling', 'mothling', 'mothling'], ['usher', 'mothling']], roundLimit: 15, starRounds: 7,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'Mothlings. Forgotten candles, still hungry for a flame. They swarm whichever window shines brightest.' },
      { speaker: 'Columbine', portrait: 'bastian', text: 'Then we shine brighter than any window.' },
    ],
    outro: 'Curtains twitch along the lane. Behind one, someone whispers a neighbour’s name — and remembers it.',
  },
  {
    id: '1-4', chapter: 1, index: 4, name: 'Clockwork in the Fog', level: 4, bg: 'street',
    waves: [['mannequin'], ['mothling', 'mannequin']], roundLimit: 15, starRounds: 7,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'That doll in Whitlock’s window… it looks like me.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'It isn’t you. It is what the Dimming makes when it finds something left waiting to be loved.' },
      { speaker: 'Columbine', portrait: 'bastian', text: '…Then let’s set it free.' },
    ],
    outro: 'A brass winding key ticks to a stop on the cobbles. Columbine pockets it without knowing why.',
  },
  {
    id: '1-5', chapter: 1, index: 5, name: 'Ink in the Gutters', level: 5, bg: 'street',
    waves: [['hound', 'hound'], ['hound', 'usher', 'mothling']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Corvin', portrait: 'wren', text: 'Ink Hounds. Every letter the Dimming erased — the ink had to go somewhere.' },
      { speaker: 'Seraphine', portrait: 'odile', text: 'Their bites burn. I will mend what I can. Do not let the wounds pile up.' },
    ],
    outro: 'The ink runs back into the gutters. On the wet stones, half a sentence glistens: “…the clockmaker’s daughter…”',
  },
  {
    id: '1-6', chapter: 1, index: 6, name: 'Something Eats the Light', level: 6, bg: 'street', rule: 'fireflyBloom',
    waves: [['lampeater', 'mothling'], ['lampeater', 'usher']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'The fireflies are thick tonight. They are the last sparks of people who are still remembered — drawn to the Lantern like letters to an address.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'And something is eating them. Light the Lantern before it swallows them all.' },
    ],
    outro: 'A cloud of freed fireflies drifts above the rooftops. For a moment, the frozen sky has a new star.',
  },
  {
    id: '1-7', chapter: 1, index: 7, name: 'The Theatre Doors', level: 7, bg: 'street',
    waves: [['usher', 'mannequin', 'usher'], ['hound', 'lampeater', 'hound']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'The Dimming is pouring out of the Gloaming Theatre. Its doors have been open since midnight.' },
      { speaker: 'Columbine', portrait: 'bastian', text: 'There is music inside. A waltz. I know this waltz.' },
    ],
    outro: 'Behind the doors, a single spotlight waits on an empty stage. Someone has been calling for an encore all year.',
  },
  {
    id: '1-8', chapter: 1, index: 8, name: 'The Curtain-Caller', level: 8, bg: 'street', boss: true,
    waves: [['usher', 'usher'], ['curtaincaller']], roundLimit: 18, starRounds: 10,
    intro: [
      { speaker: 'The Curtain-Caller', text: 'Ladies and gentlemen… the show is over. Lights, please. Out.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'The show isn’t over. Somebody stopped the clock before the final act.' },
      { speaker: 'Columbine', portrait: 'bastian', text: 'Encore.' },
    ],
    outro: 'The curtain falls on its caller. High on the theatre balcony, a woman wrapped in violet smoke applauds — slowly.',
  },
  {
    id: '2-1', chapter: 2, index: 1, name: 'Stalls of Ash', level: 10, bg: 'theatre',
    waves: [['widow', 'mothling'], ['usher', 'usher', 'widow']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'Every seat is full. None of them are moving… no. They breathe. They have only forgotten how to leave.' },
    ],
    outro: 'The front stalls empty, one quiet seat at a time. People stumble into the foyer, blinking, asking what year it is.',
  },
  {
    id: '2-2', chapter: 2, index: 2, name: "The Prompter's Box", level: 11, bg: 'theatre',
    waves: [['mannequin', 'widow'], ['hound', 'hound', 'hound']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Valerian', portrait: 'marigold', text: 'The prompter fed Gloria her lines for twenty years. Now the Dimming feeds them to her instead.' },
    ],
    outro: 'In the prompter’s box, a script with every line crossed out — except one, underlined twice: “Remember my name.”',
  },
  {
    id: '2-3', chapter: 2, index: 3, name: 'Dressing Room Mirrors', level: 12, bg: 'theatre', rule: 'restlessDim',
    waves: [['widow', 'widow'], ['lampeater', 'mannequin']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Corvin', portrait: 'wren', text: 'They are angry before we even walk in. Finales will come fast. Be ready.' },
    ],
    outro: 'The dressing-room mirrors clear. For a heartbeat they show the theatre as it was: full, golden, and laughing.',
  },
  {
    id: '2-4', chapter: 2, index: 4, name: 'The Orchestra Pit', level: 13, bg: 'theatre',
    waves: [['hound', 'lampeater', 'hound'], ['mannequin', 'widow']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'This waltz again… I have danced to it. I know I have. But my legs were never my own.' },
    ],
    outro: 'A cello lies on its side in the pit, one string still humming the waltz that would not end.',
  },
  {
    id: '2-5', chapter: 2, index: 5, name: 'The Fly Gallery', level: 14, bg: 'theatre', rule: 'fireflyBloom',
    waves: [['mothling', 'mothling', 'mothling'], ['lampeater', 'lampeater'], ['widow', 'usher', 'widow']],
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'The ropes are strung with fireflies — someone hung them up here like stage lights.' },
    ],
    outro: 'High above the stage the ropes creak. Every firefly freed is someone in the audience remembering their own name.',
    roundLimit: 18, starRounds: 11,
  },
  {
    id: '2-6', chapter: 2, index: 6, name: 'Velvet Ropes', level: 15, bg: 'theatre',
    waves: [['mannequin', 'mannequin'], ['widow', 'hound', 'widow']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Valerian', portrait: 'marigold', text: 'Beyond these ropes, the stage. She will not know me. Do not let that stop you.' },
    ],
    outro: 'The velvet ropes fall slack. A spotlight swings round to find them.',
  },
  {
    id: '2-7', chapter: 2, index: 7, name: 'Last Rehearsal', level: 16, bg: 'theatre', rule: 'restlessDim',
    waves: [['usher', 'widow'], ['lampeater', 'mannequin']], roundLimit: 15, starRounds: 10,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'Someone is rehearsing our ending. I can hear them counting the beats.' },
    ],
    outro: 'From the wings, a voice laughs like a curtain tearing.',
  },
  {
    id: '2-8', chapter: 2, index: 8, name: 'Madame Gloam', level: 18, bg: 'theatre', boss: true,
    waves: [['widow', 'widow'], ['gloam']], roundLimit: 20, starRounds: 12,
    intro: [
      { speaker: 'Madame Gloam', text: 'Such bright little things. I shall stitch your light into my hem with all the others.' },
      { speaker: 'Valerian', portrait: 'marigold', text: 'Gloria. Gloria Ambre. Do you remember the roses I sent after your first opening night?' },
      { speaker: 'Madame Gloam', text: '…That name. Who gave you that name?' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Everyone — light the Lantern. Let her hear it.' },
    ],
    outro: 'Madame Gloam unravels into violet thread. Fading, she whispers to Columbine: “You have his eyes. The clockmaker’s. He is waiting for you at the top of the world.”',
  },
  // Chapter 3 — The Drowned Docks
  {
    id: '3-1', chapter: 3, index: 1, name: 'Low Tide', level: 20, bg: 'docks',
    waves: [['gullwraith', 'gullwraith'], ['stevedore', 'gullwraith']], roundLimit: 15, starRounds: 8,
    intro: [
      { speaker: 'Lucien', portrait: 'ichabod', text: 'The harbour lights went out first. Every ship out there is sailing blind.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Then we light the way home, one pier at a time.' },
    ],
    outro: 'A trawler sounds its horn somewhere in the fog. Someone saw the light.',
  },
  {
    id: '3-2', chapter: 3, index: 2, name: 'The Fish Market', level: 21, bg: 'docks',
    waves: [['siren', 'gullwraith'], ['stevedore', 'stevedore']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'Cover your ears if that song starts. It knows your name.' },
      { speaker: 'Lucien', portrait: 'ichabod', text: 'The sirens sing in the voices of the drowned. Don’t answer — whatever they say.' },
    ],
    outro: 'The market stalls drip with fog, and nothing sings any more.',
  },
  {
    id: '3-3', chapter: 3, index: 3, name: 'Crane Yard', level: 22, bg: 'docks',
    waves: [['stevedore', 'gullwraith'], ['lampeater', 'siren']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Lucien', portrait: 'ichabod', text: 'Keeper Brine taught me to read the tide tables. He loved this sea more than anything. Whatever is out there now isn’t him.' },
    ],
    outro: 'A crane swings loose, its hook pointing at the lighthouse.',
  },
  {
    id: '3-4', chapter: 3, index: 4, name: 'Customs House', level: 23, bg: 'docks', rule: 'fireflyBloom',
    waves: [['siren', 'siren'], ['gullwraith', 'lampeater', 'gullwraith']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'Crates of confiscated fireflies. Someone has been hoarding the light.' },
      { speaker: 'Lucien', portrait: 'ichabod', text: 'Stamped and sealed by order of… “A. Vire, Master Clockmaker”?' },
    ],
    outro: 'The crates burst open. The fog glows green for a mile — and every ledger in the customs house bears the same signature.',
  },
  {
    id: '3-5', chapter: 3, index: 5, name: 'The Sunken Pier', level: 24, bg: 'docks',
    waves: [['stevedore', 'gullwraith'], ['siren', 'gullwraith']], roundLimit: 15, starRounds: 10,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'Beneath the planks… lanterns. Thousands of them, drowned.' },
    ],
    outro: 'The drowned lanterns flicker, one by one, like eyes opening.',
  },
  {
    id: '3-6', chapter: 3, index: 6, name: 'Salt and Rust', level: 25, bg: 'docks', rule: 'restlessDim',
    waves: [['gullwraith', 'gullwraith', 'gullwraith'], ['stevedore', 'siren']], roundLimit: 15, starRounds: 10,
    intro: [
      { speaker: 'Corvin', portrait: 'wren', text: 'They are getting desperate. Brine is close.' },
    ],
    outro: 'Rust flakes off the cranes like old paint off a memory.',
  },
  {
    id: '3-7', chapter: 3, index: 7, name: 'The Breakwater', level: 26, bg: 'docks',
    waves: [['siren', 'lampeater'], ['stevedore', 'gullwraith']], roundLimit: 16, starRounds: 11,
    intro: [
      { speaker: 'Lucien', portrait: 'ichabod', text: 'The lighthouse is shining. But it is shining black.' },
    ],
    outro: 'At the end of the breakwater, the lighthouse door creaks open on its own.',
  },
  {
    id: '3-8', chapter: 3, index: 8, name: 'Keeper Brine', level: 28, bg: 'docks', boss: true,
    waves: [['siren', 'siren'], ['keeper']], roundLimit: 20, starRounds: 12,
    intro: [
      { speaker: 'Keeper Brine', text: 'Ships kept breaking on my rocks in the dark, so I taught the light to hide them. Kinder, isn’t it? Nothing sails. Nothing sinks.' },
      { speaker: 'Lucien', portrait: 'ichabod', text: 'Keeper, it’s me. Lucien. You taught me the tides.' },
      { speaker: 'Keeper Brine', text: 'There are no tides, boy. The clockmaker bought them. He paid me in a night that never ends.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Turn the lamp around, keeper. Or we will do it for you.' },
    ],
    outro: 'The lighthouse beam swings back out to sea. Far out in the dark, a ship turns for home.',
  },

  // Chapter 4 — The Clock Without Hands
  {
    id: '4-1', chapter: 4, index: 1, name: 'The Bell Tower Stairs', level: 30, bg: 'clocktower',
    waves: [['cogspider', 'cogspider'], ['chimewisp', 'pendulum']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Aldric', portrait: 'teddy', text: 'Mind the stairs. They count. Every step is a second he stole.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Then we take them back, one step at a time.' },
    ],
    outro: 'The stairs creak in a rhythm that is almost, but not quite, a tick.',
  },
  {
    id: '4-2', chapter: 4, index: 2, name: 'Escapement', level: 31, bg: 'clocktower',
    waves: [['pendulum', 'chimewisp'], ['cogspider', 'cogspider', 'cogspider']], roundLimit: 15, starRounds: 9,
    intro: [
      { speaker: 'Elias', portrait: 'hesper', text: 'The escapement — the part of a clock that lets time out one tooth at a time. He has jammed it with fireflies.' },
    ],
    outro: 'A great gear shudders, catches, and turns one notch.',
  },
  {
    id: '4-3', chapter: 4, index: 3, name: 'The Carillon', level: 32, bg: 'clocktower', rule: 'restlessDim',
    waves: [['chimewisp', 'chimewisp', 'chimewisp'], ['pendulum', 'siren']], roundLimit: 15, starRounds: 10,
    intro: [
      { speaker: 'Seraphine', portrait: 'odile', text: 'The bells are out of tune. Every one of them is ringing thirteen.' },
    ],
    outro: 'One bell rings true, and the fog outside thins a little.',
  },
  {
    id: '4-4', chapter: 4, index: 4, name: 'Mainspring', level: 33, bg: 'clocktower',
    waves: [['cogspider', 'pendulum'], ['mannequin', 'chimewisp']], roundLimit: 15, starRounds: 10,
    intro: [
      { speaker: 'Aldric', portrait: 'teddy', text: 'The mainspring. He wound it with the city’s light. Every lamp the Dimming ate is coiled up in there.' },
    ],
    outro: 'The mainspring is wound tight with stolen hours. Far below, a street lamp flickers on by itself.',
  },
  {
    id: '4-5', chapter: 4, index: 5, name: 'Gallery of Faces', level: 34, bg: 'clocktower', rule: 'fireflyBloom',
    waves: [['widow', 'chimewisp'], ['lampeater', 'pendulum']], roundLimit: 18, starRounds: 12,
    intro: [
      { speaker: 'Columbine', portrait: 'bastian', text: 'These faces… they are all her. Hundreds of clock faces, every one painted with her face.' },
    ],
    outro: 'Every clock face in the gallery shows a different, wrong time — and the same sleeping girl.',
  },
  {
    id: '4-6', chapter: 4, index: 6, name: 'The Stopped Minute', level: 35, bg: 'clocktower',
    waves: [['pendulum', 'cogspider'], ['siren', 'chimewisp']], roundLimit: 15, starRounds: 11,
    intro: [
      { speaker: 'Elias', portrait: 'hesper', text: 'We are inside the last minute of 1929. Don’t touch the dust. It hasn’t fallen in a year.' },
    ],
    outro: 'Dust hangs in the air, unmoving, waiting for the next second.',
  },
  {
    id: '4-7', chapter: 4, index: 7, name: 'The Clock Face', level: 36, bg: 'clocktower', rule: 'restlessDim',
    waves: [['chimewisp'], ['curtaincaller']], roundLimit: 18, starRounds: 12,
    intro: [
      { speaker: 'Ophelia', portrait: 'ottoline', text: 'You are late, Lantern Keeper. I have been holding the last minute for you.' },
      { speaker: 'Columbine', portrait: 'bastian', text: 'The Curtain-Caller — again?' },
      { speaker: 'Ophelia', portrait: 'ottoline', text: 'Not again. Still. Everything up here is still. I should know; I have been watching from the other side of the board.' },
    ],
    outro: 'Behind the clock face stands a throne made of hour hands. Beside it, a small bed. A girl asleep in it.',
  },
  {
    id: '4-8', chapter: 4, index: 8, name: 'The Hourless King', level: 38, bg: 'clocktower', boss: true,
    waves: [['chimewisp', 'cogspider'], ['hourless']], roundLimit: 22, starRounds: 14,
    intro: [
      { speaker: 'The Hourless King', text: 'Do not wake her. If morning comes, she goes with it. I have abolished morning. You may thank me.' },
      { speaker: 'Columbine', portrait: 'bastian', text: '…Father?' },
      { speaker: 'The Hourless King', text: 'Colette? No — no. You are the doll. I made you so she would have someone to dance for her. You were never meant to walk.' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Aldous Vire. Your whole city is starving in the dark so that one night can last forever.' },
      { speaker: 'The Hourless King', text: 'Then let it starve!' },
      { speaker: 'Corvin', portrait: 'wren', text: 'Everyone — light the Lantern. Let us show him what a sunrise looks like.' },
    ],
    outro: 'The Cathedral Clock strikes one. For the first time in a year, Vellmoor sees the dawn.',
  },

];

for (const saga of SAGAS) {
  for (const st of STAGES) {
    if (saga.intros[st.id]) st.intro = saga.intros[st.id];
    if (saga.outros[st.id]) st.outro = saga.outros[st.id];
  }
}

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
