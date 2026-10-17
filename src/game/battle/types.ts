import type { IntentKind, Mood, StatusId } from '../data/types';

export type Side = 'ally' | 'enemy';

export interface Status {
  id: StatusId;
  turns: number;
  /** Flat amount for burn/regen ticks. */
  potency: number;
}

export interface Unit {
  uid: string;
  side: Side;
  defId: string;
  name: string;
  mood: Mood;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  shield: number;
  ardor: number;
  statuses: Status[];
  alive: boolean;
  /** Position within its side (0 = front of the formation). */
  slot: number;
  /** Enemies only. */
  wave?: number;
  patternIndex?: number;
  intent?: Intent | null;
  boss?: boolean;
}

export interface Intent {
  moveId: string;
  name: string;
  kind: IntentKind;
  targetUid?: string;
  /** Estimated damage to the target (or to each target for mass moves). */
  preview: number;
  finale: boolean;
}

export interface Card {
  cid: number;
  ownerUid: string;
  verseId: string;
  rank: 1 | 2 | 3;
  lit: boolean;
  finale: boolean;
}

export interface MergeStep {
  keep: number;
  remove: number;
  rank: number;
  lit: boolean;
}

export type QueuedAction =
  | { kind: 'cast'; card: Card; targetUid: string | null }
  | { kind: 'move'; cid: number };

export type BattleEvent =
  | { t: 'roundStart'; round: number }
  | { t: 'purge'; cids: number[]; merges: MergeStep[] }
  | { t: 'dealCard'; card: Card; index: number; merges: MergeStep[] }
  | { t: 'finaleCard'; card: Card }
  | { t: 'light'; cid: number }
  | { t: 'intents'; intents: Record<string, Intent | null> }
  | { t: 'cast'; casterUid: string; verseId: string; rank: number; lit: boolean; finale: boolean; targetUids: string[] }
  | { t: 'fizzle'; casterUid: string; verseId: string }
  | { t: 'enemyAct'; uid: string; moveId: string; name: string; kind: IntentKind; finale: boolean; targetUids: string[] }
  | { t: 'damage'; sourceUid: string | null; targetUid: string; amount: number; absorbed: number; crit: boolean; adv: 1 | 0 | -1; hp: number; shield: number; dot?: boolean }
  | { t: 'heal'; targetUid: string; amount: number; hp: number; dot?: boolean }
  | { t: 'shield'; targetUid: string; amount: number; shield: number }
  | { t: 'status'; targetUid: string; status: StatusId; turns: number }
  | { t: 'resist'; targetUid: string; status: StatusId }
  | { t: 'statusEnd'; targetUid: string; status: StatusId }
  | { t: 'ardor'; uid: string; value: number }
  | { t: 'firefly'; casterUid: string; lantern: number }
  | { t: 'snuff'; sourceUid: string; amount: number; lantern: number }
  | { t: 'dazed'; uid: string }
  | { t: 'death'; uid: string }
  | { t: 'waveClear'; wave: number }
  | { t: 'waveSpawn'; wave: number; uids: string[] }
  | { t: 'upkeep' }
  | { t: 'roundEnd'; round: number }
  | { t: 'victory'; rounds: number; fallen: number }
  | { t: 'defeat'; reason: 'wiped' | 'time' };

export type Phase = 'planning' | 'resolving' | 'won' | 'lost';
