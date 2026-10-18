import { SAGAS } from './saga';
import type { BioSection, Cinematic } from './types';

// The story of Firefly Nocturne. Character ids are internal (wren = Corvin, odile = Seraphine,
// bastian = Columbine, ichabod = Lucien, teddy = Aldric, ottoline = Ophelia, marigold = Valerian,
// hesper = Elias). Stage-by-stage dialogue lives with each stage in stages.ts.

const BASE_CINEMATICS: Cinematic[] = [
  {
    id: 'prologue', name: 'Prologue · The Thirteenth Stroke', bg: 'street', tone: 'cold',
    clock: '23:59',
    shots: [
      { kind: 'narrate', text: 'Vellmoor. The thirty-first of December, 1929.' },
      { kind: 'narrate', text: 'A city of gaslight and brass, of theatres and tide-clocks — where every street lamp had a name, and every name had a lamp.' },
      { kind: 'bell', strokes: 12, text: 'At midnight, the Cathedral Clock began to strike.' },
      { kind: 'bell', strokes: 1, ominous: true, text: '…and then it struck once more.' },
      { kind: 'narrate', text: 'There is no thirteenth hour. But that night, Vellmoor found one.' },
      { kind: 'narrate', text: 'Every lamp in the city went out at once. The fog that rolled in after was not fog. It ate the light — and everything the light had touched.' },
      { kind: 'narrate', text: 'We call it the Dimming. What it swallows, the world forgets. Faces. Names. Whole streets. Even the letters people wrote to one another fade to blank paper.' },
      { kind: 'narrate', text: 'And the morning never came.' },
      { kind: 'title', kicker: 'PROLOGUE', title: 'The Thirteenth Stroke', sub: 'Vellmoor · the night without end' },
      { kind: 'line', who: 'wren', text: 'Another letter tonight. No sender. No address. The ink is still wet.' },
      { kind: 'letter', text: 'If anyone is still reading — the lamps on Corvid Lane are going out one by one. We can hear the moths at the windows. Please. Someone remember us.', sign: '— unsigned' },
      { kind: 'line', who: 'wren', text: 'The crows keep bringing them to me. Letters from people the city has already forgotten. As long as someone reads them, they are not entirely gone.' },
      { kind: 'line', who: 'odile', text: 'The stars have not moved since midnight, Lantern Keeper. The same sky every night, frozen. Except for one light that moves. Yours.' },
      { kind: 'line', who: 'wren', text: 'Then you know what this lantern is.' },
      { kind: 'line', who: 'odile', text: 'The last flame in Vellmoor the Dimming cannot eat. I read it in the sky, and I came to make sure it does not go out.' },
      { kind: 'narrate', text: 'On Corvid Lane, something tears through the fog — a girl in red, all porcelain joints and cut strings, holding back a swarm of moths with nothing but ribbons.' },
      { kind: 'line', who: 'bastian', text: 'Stay back! I— I don’t know who you are. I don’t know who I am. I only remember a voice. “Dance until morning.”' },
      { kind: 'line', who: 'wren', text: 'Then dance with us. Morning is exactly where we are going.' },
    ],
  },
  {
    id: 'ch1_end', name: 'Chapter I · Curtain Call', bg: 'street', tone: 'warm',
    clock: '04:12',
    shots: [
      { kind: 'narrate', text: 'Corvid Lane burns bright from end to end. People step out of doorways they had forgotten were theirs, and call each other by name.' },
      { kind: 'line', who: 'odile', text: 'The woman on the theatre balcony, in the violet smoke — she was not Dimmed. She was conducting them.' },
      { kind: 'line', who: 'wren', text: 'Madame Gloam. The crows will not fly near the Gloaming Theatre. Even they are afraid of her.' },
      { kind: 'line', who: 'bastian', text: 'There is a waltz playing in there. It has been playing all year. I know it… I know every step of it.' },
      { kind: 'line', who: 'wren', text: 'Then tomorrow night, we buy tickets.' },
    ],
  },
  {
    id: 'ch2_open', name: 'Chapter II · The Velvet Curtain', bg: 'theatre', tone: 'warm',
    clock: '21:40',
    shots: [
      { kind: 'title', kicker: 'CHAPTER II', title: 'The Velvet Curtain', sub: 'The Royal Gloaming Theatre' },
      { kind: 'narrate', text: 'The Gloaming Theatre was the jewel of Vellmoor. On the last night of 1929 it sold every seat for the New Year’s Gala — the farewell performance of its prima donna, Gloria Ambre.' },
      { kind: 'narrate', text: 'The audience never went home. They are still in their seats. They simply no longer remember why they came.' },
      { kind: 'line', who: 'marigold', text: 'Gloria sang at midnight. I was in my box. The thirteenth stroke landed in the middle of her final note… and the note never ended.' },
      { kind: 'line', who: 'wren', text: 'You remember her? The Dimming should have taken her name with everything else.' },
      { kind: 'line', who: 'marigold', text: 'I paid for every lamp in this house, Keeper. I do not forget my investments. Nor my friends.' },
      { kind: 'line', who: 'odile', text: 'Then your memory still glows. You are a Luminary, Count.' },
      { kind: 'line', who: 'marigold', text: 'Then let it light the way. She is on the stage. She has been singing for a year.' },
    ],
  },
  {
    id: 'ch2_end', name: 'Chapter II · Remember My Name', bg: 'theatre', tone: 'warm',
    clock: '02:03',
    shots: [
      { kind: 'narrate', text: 'The chandelier of the Gloaming Theatre blazes for the first time in a year. Two thousand people remember, all at once, that they have homes to go to.' },
      { kind: 'line', who: 'marigold', text: 'She went out smiling. She heard her own name sung back to her. That is all any of us want, in the end.' },
      { kind: 'line', who: 'bastian', text: 'She said I have his eyes. Whose eyes? Who made me?' },
      { kind: 'line', who: 'odile', text: 'The stars will not tell me — they are frozen at midnight. But the tide-clocks of the harbour were built by the same hand as the Cathedral Clock.' },
      { kind: 'letter', text: 'To the Lantern Keeper. The tide has not turned in a year. Ships lie in the mud. My son can call the sea, but the sea will not answer him. Come quickly. The lighthouse has started shining the wrong way.', sign: '— Harbourmaster Marée' },
      { kind: 'line', who: 'wren', text: 'Then we go to the docks.' },
    ],
  },
  {
    id: 'ch3_open', name: 'Chapter III · The Drowned Docks', bg: 'docks', tone: 'cold',
    clock: '23:10',
    shots: [
      { kind: 'title', kicker: 'CHAPTER III', title: 'The Drowned Docks', sub: 'Vellmoor harbour · low tide' },
      { kind: 'narrate', text: 'The sea stopped at midnight too. The tide drew out to its lowest ebb, and stayed there. Ships lie on their sides in the mud like sleeping animals.' },
      { kind: 'narrate', text: 'Out on the breakwater, the old lighthouse still burns. But its beam has turned around. It shines darkness out to sea.' },
      { kind: 'line', who: 'ichabod', text: 'You are the Lantern Keeper. My father said you would come. I am Lucien. I call the tides… I used to.' },
      { kind: 'line', who: 'ichabod', text: 'The sea is waiting for a minute that never comes. Water remembers time better than people do.' },
      { kind: 'line', who: 'wren', text: 'Then we give it back its minute.' },
    ],
  },
  {
    id: 'ch3_end', name: 'Chapter III · The Last Log', bg: 'docks', tone: 'cold',
    clock: '05:55',
    shots: [
      { kind: 'narrate', text: 'Keeper Brine’s logbook is the one thing in the lighthouse the Dimming did not swallow. Its final entry is dated the thirty-first of December, 1929. 11:59 pm.' },
      { kind: 'letter', text: 'Mr. Vire came again tonight. He asked me to hold the tide at midnight. His daughter Colette is sick, and the doctor says she will not see the morning. He means to make sure there isn’t one. God forgive me, I said yes.', sign: '— Log of the Breakwater Light' },
      { kind: 'line', who: 'bastian', text: 'Colette… “Dance until morning, Colette.” That was the voice. That is what he said to me.' },
      { kind: 'line', who: 'ichabod', text: 'Vire. Aldous Vire, the clockmaker. He built every clock in this city. The Cathedral Clock was his masterpiece.' },
      { kind: 'line', who: 'wren', text: 'And he stopped it. To keep his daughter alive.' },
      { kind: 'line', who: 'odile', text: 'Not alive. Unfinished. A night that never ends is not a life — it is a held breath.' },
      { kind: 'narrate', text: 'Behind them, for the first time in a year, the sea moves. One wave. Then another. The tide is coming in.', tone: 'dawn' },
    ],
  },
  {
    id: 'ch4_open', name: 'Chapter IV · The Clock Without Hands', bg: 'clocktower', tone: 'cold',
    clock: '22:30',
    shots: [
      { kind: 'title', kicker: 'CHAPTER IV', title: 'The Clock Without Hands', sub: 'Inside the Cathedral Clock' },
      { kind: 'narrate', text: 'The Cathedral Clock stands over Vellmoor like a gravestone with a face. Its hands are gone — torn out, the night it struck thirteen.' },
      { kind: 'line', who: 'teddy', text: 'I kept that clock for twenty years. Aldous Vire was my master. That night he asked me for the key to the tower… and I gave it to him.' },
      { kind: 'line', who: 'teddy', text: 'I heard the thirteenth stroke from the stairs. I have stood guard at the bottom of them ever since, waiting for someone brave enough to climb.' },
      { kind: 'line', who: 'hesper', text: 'Every map I draw of this city ends at midnight. Except this one. The way to dawn runs straight up through that clock.' },
      { kind: 'line', who: 'wren', text: 'Then we climb.' },
      { kind: 'line', who: 'bastian', text: 'He made me. Didn’t he? To dance for her. …I want to see his face.' },
    ],
  },
  {
    id: 'ch4_end', name: 'Chapter IV · Let the Morning Come', bg: 'clocktower', tone: 'cold',
    clock: '05:59',
    shots: [
      { kind: 'narrate', text: 'The Hourless King kneels among the broken hour hands. Beside him, in a small bed, Colette sleeps — pale and peaceful, exactly as she was at one minute to midnight.' },
      { kind: 'line', who: 'wren', text: 'Aldous. A crow brought me this a year ago. It was addressed “to whoever stops the clock.” I never opened it. I think it was meant for you.' },
      { kind: 'letter', text: 'Papa — I heard you talking to the doctor. Please don’t be sad. I am not afraid of the morning. Let it come, and I will watch it with you, I promise. And Papa… let someone else dance now.', sign: '— Colette Vire, 31 December 1929' },
      { kind: 'line', who: 'hourless', text: 'She wrote this before midnight. She knew. She knew, and I… I stopped the whole world so that I would never have to read it.' },
      { kind: 'line', who: 'teddy', text: 'Master. The hands. Let me put them back.' },
      { kind: 'bell', strokes: 1, text: 'The Cathedral Clock strikes one.' },
      { kind: 'bg', bg: 'parlour', tone: 'dawn' },
      { kind: 'narrate', text: 'Dawn comes to Vellmoor like a held breath let go. Lamps flare across the city. Names return to doorplates. Blank letters fill with ink again.' },
      { kind: 'narrate', text: 'Colette Vire opened her eyes once, at sunrise. She saw her father, and the doll he had made in her likeness, and she smiled. Then she slept.' },
      { kind: 'line', who: 'bastian', text: 'She told me to dance until morning. It is morning… and I do not want to stop.' },
      { kind: 'line', who: 'odile', text: 'The stars are moving again, Keeper. All of them.' },
      { kind: 'title', kicker: 'EPILOGUE', title: 'One Grain Missing' },
      { kind: 'narrate', text: 'That evening, in a drawing room high above the Gloaming Theatre, a countess turns her hourglass over — and frowns.' },
      { kind: 'line', who: 'ottoline', text: 'Twelve strokes, and then one more. But Vire only ever rang twelve. I was there. I was watching his hands.' },
      { kind: 'line', who: 'ottoline', text: 'So who rang the thirteenth?' },
      { kind: 'narrate', text: 'In Corvin’s satchel, a new letter arrives. The envelope is blank. The paper is blank. Only the wax seal is real — a clock face with thirteen hours.' },
      { kind: 'title', kicker: 'TO BE CONTINUED', title: 'The Thirteenth Bell', sub: 'Firefly Nocturne · Chapter V' },
    ],
  },
];

/** Base story, with each chapter's long-form saga replacing or adding scenes by id. */
export const CINEMATICS: Cinematic[] = (() => {
  const out = [...BASE_CINEMATICS];
  for (const c of SAGAS.flatMap((s) => s.cinematics)) {
    const i = out.findIndex((x) => x.id === c.id);
    if (i >= 0) out[i] = c;
    else out.push(c);
  }
  return out;
})();

/** Cinematic played after first clearing a (non-boss) stage. */
export const STAGE_INTERLUDES: Record<string, string> = Object.assign({}, ...SAGAS.map((s) => s.interludes));

export function getCinematic(id: string): Cinematic | undefined {
  return CINEMATICS.find((c) => c.id === id);
}

/** Cinematic played before entering a chapter's first stage (the prologue opens chapter 1). */
export const CHAPTER_OPENERS: Record<number, string> = { 2: 'ch2_open', 3: 'ch3_open', 4: 'ch4_open' };
/** Cinematic played after first clearing a chapter's boss. */
export const CHAPTER_ENDINGS: Record<string, string> = { '1-8': 'ch1_end', '2-8': 'ch2_end', '3-8': 'ch3_end', '4-8': 'ch4_end' };

/** Dossier pages shown in the Troupe profile. */
export const BIOS: Record<string, BioSection[]> = {
  wren: [
    { title: 'The Lantern Keeper', text: 'Night postman of Corvid Lane until the night the clock struck thirteen. Now Corvin Vesper carries the Lantern — the one flame in Vellmoor the Dimming cannot eat — and a satchel of letters no one else can read.' },
    { title: 'The Crows', text: 'His crows still fly their old routes. They bring him letters from people the city has forgotten, addressed to people who no longer remember them. He keeps every one in a gilded cage, and reads them aloud at night so their writers are not entirely gone.' },
    { title: 'The Sealed Letter', text: 'There is one envelope he has never opened. It is addressed in a child’s careful hand: “To whoever stops the clock.”' },
  ],
  odile: [
    { title: 'The Winged Oracle', text: 'Seraphine Aube kept the Observatory Chapel, where the people of Vellmoor came to have their futures read in the stars.' },
    { title: 'A Frozen Sky', text: 'Since the thirteenth stroke, the sky has shown the same midnight every night. Every star is fixed in place — except one moving light, low over Corvid Lane. She followed it, and found the Lantern.' },
    { title: 'What She Saw', text: 'There is one future she has read and will not speak of. Asked, she only says: “The morning comes. Not for everyone.”' },
  ],
  bastian: [
    { title: 'The Cut-String Marionette', text: 'A life-sized marionette who woke in a toyshop window at the thirteenth stroke, her strings already cut. Columbine fights by catching the strings of others — friend and Dimmed alike — and pulling them out of harm’s way.' },
    { title: 'Dance Until Morning', text: 'She remembers only a voice: “Dance until morning, Colette.” She does not know who Colette is. She does not know why the waltz from the Gloaming Theatre makes every joint in her body ache.' },
    { title: 'Porcelain', text: 'Beneath the red silk, each of her joints is signed in tiny brass letters: A.V.' },
  ],
  ichabod: [
    { title: 'The Tidecaller', text: 'The harbourmaster’s son, born with the sea in his blood. As a boy, Lucien Marée would call the tide in a day early just to watch the fishing boats come home.' },
    { title: 'Low Water', text: 'Since midnight the sea has not moved. His power answers to water that remembers time — and Vellmoor’s water has forgotten it. Until the clock turns, he is a tidecaller without a tide.' },
    { title: 'Moonlit', text: 'He taught himself to pull the moon’s light down like rain instead. It is not the same, he says. It will have to be enough.' },
  ],
  teddy: [
    { title: 'The Astrolabe Warden', text: 'For twenty years Aldric Verdane was warden of the Cathedral Clock and apprentice to its maker. He carries the clock’s astrolabe dial as a shield — torn from its housing the night the hands were taken.' },
    { title: 'The Key', text: 'On the last night of 1929 his master asked him for the key to the tower. Aldric gave it. He heard the thirteenth stroke from the stairs, and has stood guard at the bottom of them ever since.' },
    { title: 'Penance', text: 'He does not ask to be forgiven. He asks only to be the one who puts the hands back.' },
  ],
  ottoline: [
    { title: 'The Hourglass Countess', text: 'A countess of no fixed estate, Ophelia Sablier collects seconds — wasted ones, stolen ones, ones people would give anything to have back. She keeps them in an hourglass that has never run out.' },
    { title: 'The Game', text: 'On the night of the thirteenth stroke she was playing chess with Aldous Vire in his workshop. She lost. The stake was one minute.' },
    { title: 'One Grain Missing', text: 'She knows something about the thirteenth stroke that no one else does. She is waiting for the right moment to say it — and she, of all people, knows exactly when that is.' },
  ],
  marigold: [
    { title: 'The Crimson Patron', text: 'Count Valerian Rosenthal paid for every lamp, every rose and every velvet seat in the Gloaming Theatre. In forty years he has never missed an opening night.' },
    { title: 'Gloria', text: 'He was in his box when Gloria Ambre sang her final note at midnight. He is the only person in Vellmoor who still remembers her name — and he says it every night, like a prayer.' },
    { title: 'Roses', text: 'The roses he carries never wilt. He says they are waiting for an encore.' },
  ],
  hesper: [
    { title: 'The Star Cartographer', text: 'Elias Astrée maps Vellmoor by the stars above it — every street, every alley, every hidden stair and forgotten door.' },
    { title: 'Maps That End', text: 'Every map he has drawn since the thirteenth stroke ends at midnight, in ink he did not put there. All but one. That map leads up, through the Clock Without Hands, to a dawn no one has seen.' },
    { title: 'North', text: 'He never gets lost. He says it is because he stopped looking for where he is, and started looking for when.' },
  ],
  evangeline: [
    { title: 'The Caged Dove', text: 'Aveline Halcyon kept the dovecote of the Mission to Seafarers, where sailors’ birds carried word home from every harbour on the coast. When the tide stopped, the birds stopped too — all but hers.' },
    { title: 'The Gilded Cage', text: 'Her birdcage has no lock and has never had one. The doves fly out with names tied to their feet, and come back with the people who had forgotten them.' },
    { title: 'Rainwater', text: 'She heals with water that remembers falling. It is not the same as the sea, she admits. But it has never once refused her.' },
  ],
};

/** Things each Luminary says in the lobby (tap them, or on arrival). Night/first-visit lines are mixed in by the lobby. */
export const LOBBY_LINES: Record<string, string[]> = {
  wren: [
    'Another letter came while you were out. No name on it. They never have names any more.',
    'The crows are restless. Something on Corvid Lane is remembering itself.',
    'Hold the lantern a moment? …Careful. It is heavier than it looks. Everyone who ever loved this city is in there.',
    'I read the letters aloud at night. If someone hears them, the writer is not entirely gone.',
    'You look tired, Lamplighter. Even lanterns are allowed to rest.',
  ],
  odile: [
    'The stars still have not moved. I have counted them every night for a year.',
    'Be still. You are carrying more than you think. Let me take some of it.',
    'I read one future I will not speak of. Do not ask me again — not tonight.',
    'The sky remembers everything. That is why it is so heavy.',
    'There. Your fortune: you will be kind to someone tomorrow. It is a small one, but it is true.',
  ],
  bastian: [
    'One, two, three — one, two, three. If I stop counting, I forget I am moving.',
    'My joints are signed. A.V. Do you think he signed everything he loved?',
    'Someone cut my strings. I have decided that means I am free, and not that I was dropped.',
    'Dance with me? …No? Then at least hum. The waltz feels lonely with one.',
    'I do not sleep. I sit very still and pretend I am a doll again. It is restful.',
  ],
  ichabod: [
    'The sea is holding its breath. I can feel it from here.',
    'When I was small, I called the tide in early just to watch the boats come home.',
    'Water remembers time better than people do. That is why it stopped when the clock did.',
    'If you hear a wave tonight, it was me. Practising.',
  ],
  teddy: [
    'I gave him the key. I have been standing at the bottom of the stairs ever since.',
    'A good clock does not keep time. It keeps faith.',
    'Twenty years I wound that clock. My hands still turn in my sleep.',
    'Go on, Lamplighter. I will stand guard. It is the one thing I have never failed at.',
  ],
  ottoline: [
    'Every grain in this glass is a second someone wasted. Shall I tell you how many are yours?',
    'Check. …Oh, I am not playing against you. I am playing against midnight.',
    'Twelve strokes, and then one more. I was watching his hands. He only rang twelve.',
    'Patience, darling. I have all the time in the world. Literally.',
  ],
  marigold: [
    'Every lamp in the Gloaming Theatre was a gift from me. I intend to see them lit again.',
    'Gloria. Gloria Ambre. I say her name every night so the Dimming cannot have it.',
    'These roses never wilt. They are waiting for an encore.',
    'Sit, Lamplighter. A patron never lets a guest stand.',
  ],
  hesper: [
    'Every map of Vellmoor ends at midnight. I am drawing the one that ends at dawn.',
    'I never get lost. I stopped asking where I am and started asking when.',
    'North is still north. That is more than most things in this city can say.',
    'There is a staircase on my newest map that was not there yesterday. Shall we find out where it goes?',
  ],
  augustin: [
    'Everything the Dimming eats, I have already written down. It cannot unwrite me.',
    'Margins are where the truth hides. Nobody thinks to burn the margins.',
    'This page is blank. It was a love letter, once. I am trying to remember the words for them.',
    'Shh. Paper is very loud, if you know how to listen.',
  ],
  kit: [
    'My orrery still turns. Somewhere out there, the planets have not heard the night stopped.',
    'The cat? She found me. I think she was looking for someone who still travels.',
    'I have walked every road out of Vellmoor. They all bend back at midnight.',
    'Pack light, Lamplighter. Hope does not weigh much, but it takes up a lot of room.',
  ],
  evangeline: [
    'Hold still — there is a dove on your shoulder. She thinks you are a windowsill. It is a compliment.',
    'Every bird I let go carries a name home. Tell me yours, so I do not lose it.',
    'The cage is never locked. They come back because they choose to. So do I.',
    'Rainwater remembers falling. If you listen, it will tell you where it has been.',
    'You have been carrying something heavy all night. Set it down here, just for a moment.',
  ],
};

export const LOBBY_GREETINGS = {
  night: 'Still awake? The Dimming never sleeps either.',
  rite: 'The fireflies are restless tonight. Shall we hold a Lantern Rite?',
};
