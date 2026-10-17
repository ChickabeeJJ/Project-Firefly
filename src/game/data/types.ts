// Shared content types: characters, enemies, verses and stages.

export type Mood = 'sun' | 'moon' | 'star';
export type Rarity = 3 | 4 | 5;
export type StatusId = 'might' | 'weak' | 'frail' | 'burn' | 'daze' | 'regen';
export type VerseType = 'attack' | 'mass' | 'heal' | 'shield' | 'buff' | 'debuff';
export type Role = 'Striker' | 'Healer' | 'Guardian' | 'Support' | 'Hexer';

/** Targets are always relative to the caster: "enemy" means one unit of the opposing side. */
export type TargetRule = 'enemy' | 'allEnemies' | 'randomEnemy' | 'self' | 'allAllies' | 'woundedAlly';

export type RankTriple = [number, number, number];

export type Effect =
  | { kind: 'damage'; target: TargetRule; power: number; hits?: number }
  | { kind: 'heal'; target: TargetRule; power: number }
  | { kind: 'shield'; target: TargetRule; power: number }
  | { kind: 'status'; target: TargetRule; status: StatusId; turns: number; chance?: RankTriple; power?: number }
  | { kind: 'ardor'; target: TargetRule; amount: number }
  | { kind: 'snuff'; amount: number }
  /** Adds fireflies to the Lantern. */
  | { kind: 'fireflies'; amount: number }
  /** Lights unlit Verses in the hand. */
  | { kind: 'light'; amount: number };

export type MotifId =
  | 'match' | 'flame' | 'bonfire' | 'vial' | 'crescent' | 'umbrella' | 'rain' | 'note' | 'sunburst'
  | 'cards' | 'tophat' | 'candle' | 'shield' | 'fist' | 'glove' | 'wings' | 'swirl' | 'eye' | 'tarot'
  | 'crystal' | 'baton' | 'metronome' | 'moth' | 'lantern'
  | 'camera' | 'violin' | 'wrench' | 'parasol' | 'telescope' | 'teacup' | 'newspaper' | 'meteor' | 'smoke';

export type ArtLayout = 'burst' | 'rays' | 'split' | 'rings' | 'spiral';

export interface CardArtSpec {
  motif: MotifId;
  layout: ArtLayout;
  /** Show the caster's head in the composition (comic close-up). */
  portrait?: boolean;
}

export interface VerseDef {
  id: string;
  name: string;
  type: VerseType;
  effects: Effect[];
  art: CardArtSpec;
  finale?: boolean;
}

export type HairStyle = 'bob' | 'long' | 'bun' | 'short' | 'curly' | 'ponytail' | 'wavy' | 'slick';
export type Bangs = 'straight' | 'side' | 'parted' | 'none' | 'curl';
export type Hat = 'newsboy' | 'tophat' | 'bowler' | 'headband' | 'coif' | 'aviator' | 'veil' | 'flatcap' | 'fedora' | 'beret' | 'cloche';
export type Outfit = 'coat' | 'labcoat' | 'dress' | 'suit' | 'robe' | 'vest' | 'jacket' | 'tailcoat';
export type Prop = 'lantern' | 'umbrella' | 'baton' | 'crystal' | 'cards' | 'gloves' | 'book' | 'match' | 'feather' | 'goggles'
  | 'camera' | 'violin' | 'wrench' | 'parasol' | 'telescope';

export interface DollSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  bangs: Bangs;
  eyes: string;
  hat?: Hat;
  hatColor?: string;
  hatAccent?: string;
  outfit: Outfit;
  coat: string;
  shirt: string;
  accent: string;
  legs: string;
  shoes: string;
  skirt?: boolean;
  prop?: Prop;
  glasses?: boolean;
  monocle?: boolean;
  scarf?: boolean;
  mustache?: boolean;
  freckles?: boolean;
  eyeStyle?: 'open' | 'soft' | 'happy';
  mouth?: 'smile' | 'grin' | 'smirk' | 'flat';
}

export interface Palette {
  /** Dominant card colour. */
  primary: string;
  /** Secondary card colour. */
  secondary: string;
  /** Deep shadow colour for the card art. */
  ink: string;
}

export interface StatBlock {
  hp: number;
  atk: number;
  def: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  mood: Mood;
  rarity: Rarity;
  role: Role;
  base: StatBlock;
  verses: [VerseDef, VerseDef];
  finale: VerseDef;
  look: DollSpec;
  palette: Palette;
  quote: string;
}

export type IntentKind = 'attack' | 'mass' | 'buff' | 'debuff' | 'shield' | 'heal' | 'snuff';

export interface EnemyMove {
  id: string;
  name: string;
  intent: IntentKind;
  effects: Effect[];
}

export type EnemyKind = 'mothling' | 'usher' | 'mannequin' | 'hound' | 'widow' | 'lampeater' | 'curtaincaller' | 'gloam'
  | 'gullwraith' | 'stevedore' | 'siren' | 'keeper' | 'cogspider' | 'pendulum' | 'chimewisp' | 'hourless';

export interface EnemyDef {
  id: string;
  name: string;
  mood: Mood;
  base: StatBlock;
  moves: EnemyMove[];
  /** Move ids cycled in order — readable, learnable behaviour. */
  pattern: string[];
  finale: EnemyMove;
  kind: EnemyKind;
  boss?: boolean;
  blurb: string;
}

export type StageRuleId = 'fireflyBloom' | 'restlessDim';

export interface DialogueLine {
  speaker: string;
  /** Character id for the portrait, or undefined for narration. */
  portrait?: string;
  text: string;
}

export interface StageDef {
  id: string;
  chapter: number;
  index: number;
  name: string;
  level: number;
  waves: string[][];
  roundLimit: number;
  starRounds: number;
  bg: 'street' | 'theatre' | 'docks' | 'clocktower';
  /** Guided first battle (scripted hands, gated input). */
  tutorial?: boolean;
  rule?: StageRuleId;
  intro?: DialogueLine[];
  outro?: string;
  boss?: boolean;
}

export type SceneBg = 'street' | 'theatre' | 'docks' | 'clocktower' | 'parlour' | 'lake' | 'map';

/** One beat of a cinematic. `who` is a character id, an enemy id, or a plain display name. */
export type Shot =
  | { kind: 'title'; kicker: string; title: string; sub?: string }
  | { kind: 'narrate'; text: string; bg?: SceneBg; tone?: 'warm' | 'cold' | 'dawn' }
  | { kind: 'line'; who: string; text: string }
  | { kind: 'bell'; strokes: number; text?: string; ominous?: boolean }
  | { kind: 'letter'; text: string; sign: string }
  | { kind: 'bg'; bg: SceneBg; tone?: 'warm' | 'cold' | 'dawn' };

export interface Cinematic {
  id: string;
  /** Menu label in the Story archive. */
  name: string;
  bg: SceneBg;
  tone?: 'warm' | 'cold' | 'dawn';
  shots: Shot[];
}

export interface BioSection {
  title: string;
  text: string;
}
