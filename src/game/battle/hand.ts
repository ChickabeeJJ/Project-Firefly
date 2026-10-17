import { MAX_RANK } from './rules';
import type { Card, MergeStep } from './types';

export function canMerge(a: Card, b: Card): boolean {
  return (
    !a.finale &&
    !b.finale &&
    a.ownerUid === b.ownerUid &&
    a.verseId === b.verseId &&
    a.rank === b.rank &&
    a.rank < MAX_RANK
  );
}

/**
 * Restores the hand invariant "no two adjacent mergeable cards", merging left to right.
 * The left card survives (keeps its cid), takes rank + 1 and keeps any firefly light.
 */
export function normalizeHand(hand: Card[]): MergeStep[] {
  const steps: MergeStep[] = [];
  let i = 0;
  while (i < hand.length - 1) {
    const a = hand[i];
    const b = hand[i + 1];
    if (canMerge(a, b)) {
      a.rank = (a.rank + 1) as Card['rank'];
      a.lit = a.lit || b.lit;
      hand.splice(i + 1, 1);
      steps.push({ keep: a.cid, remove: b.cid, rank: a.rank, lit: a.lit });
      i = Math.max(0, i - 1);
    } else {
      i++;
    }
  }
  return steps;
}

/** Number of ordinary (non-Finale) cards; Finales always sit at the right end. */
export function normalCount(hand: Card[]): number {
  let n = 0;
  for (const c of hand) if (!c.finale) n++;
  return n;
}

export function cloneCards(cards: Card[]): Card[] {
  return cards.map((c) => ({ ...c }));
}

/** Would casting the card at `index` bring two mergeable neighbours together? */
export function castWouldMerge(hand: Card[], index: number): boolean {
  const left = hand[index - 1];
  const right = hand[index + 1];
  return !!left && !!right && canMerge(left, right);
}
