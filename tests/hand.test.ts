import { describe, expect, it } from 'vitest';
import { canMerge, castWouldMerge, normalizeHand } from '../src/game/battle/hand';
import type { Card } from '../src/game/battle/types';

let cid = 1;
function card(verseId: string, rank: 1 | 2 | 3 = 1, extra: Partial<Card> = {}): Card {
  return { cid: cid++, ownerUid: verseId.split('_')[0], verseId, rank, lit: false, finale: false, ...extra };
}

describe('hand merging', () => {
  it('merges two identical neighbours into the next rank, keeping the left cid', () => {
    const a = card('a_x');
    const b = card('a_x');
    const hand = [a, b];
    const steps = normalizeHand(hand);
    expect(hand).toHaveLength(1);
    expect(hand[0].cid).toBe(a.cid);
    expect(hand[0].rank).toBe(2);
    expect(steps).toEqual([{ keep: a.cid, remove: b.cid, rank: 2, lit: false }]);
  });

  it('chains merges up to rank 3 and stops there', () => {
    const hand = [card('a_x', 2), card('a_x'), card('a_x')];
    normalizeHand(hand);
    expect(hand.map((c) => c.rank)).toEqual([3]);
    const full = [card('a_x', 3), card('a_x', 3)];
    normalizeHand(full);
    expect(full).toHaveLength(2);
  });

  it('three of a kind at rank 1 becomes rank 2 + rank 1', () => {
    const hand = [card('a_x'), card('a_x'), card('a_x')];
    normalizeHand(hand);
    expect(hand.map((c) => c.rank)).toEqual([2, 1]);
  });

  it('keeps the firefly when either card was lit', () => {
    const hand = [card('a_x'), card('a_x', 1, { lit: true })];
    normalizeHand(hand);
    expect(hand[0].lit).toBe(true);
  });

  it('never merges finales or different verses/ranks', () => {
    expect(canMerge(card('a_x', 1, { finale: true }), card('a_x', 1, { finale: true }))).toBe(false);
    expect(canMerge(card('a_x'), card('a_y'))).toBe(false);
    expect(canMerge(card('a_x', 1), card('a_x', 2))).toBe(false);
  });

  it('detects when casting a card would merge its neighbours', () => {
    const hand = [card('a_x'), card('b_y'), card('a_x')];
    expect(castWouldMerge(hand, 1)).toBe(true);
    expect(castWouldMerge(hand, 0)).toBe(false);
  });
});
