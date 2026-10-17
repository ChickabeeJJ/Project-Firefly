import { moodRelation } from './rules';
import { canMerge } from './hand';
import type { BattleEngine } from './engine';
import type { Card, Unit } from './types';

export type AutoAction = { kind: 'lantern' } | { kind: 'cast'; cid: number; targetUid: string | null };

/**
 * Picks the next planning action with a simple, readable heuristic. Used by the Auto button and
 * by the balance simulation.
 */
export function chooseAutoAction(engine: BattleEngine): AutoAction | null {
  if (engine.phase !== 'planning' || engine.beatsLeft <= 0) return null;
  if (engine.canLightLantern && engine.queue.length === 0) return { kind: 'lantern' };
  const hand = engine.hand;
  if (hand.length === 0) return null;

  const allies = engine.aliveAllies;
  const enemies = engine.aliveEnemies;
  const lowest = Math.min(...allies.map((u) => u.hp / u.maxHp));
  const threat = enemies.reduce((sum, e) => sum + (e.intent?.preview ?? 0), 0);
  const teamHp = allies.reduce((s, u) => s + u.hp, 0);

  let best: { card: Card; score: number } | null = null;
  hand.forEach((card, i) => {
    const verse = engine.verseOf(card);
    let score = card.rank * 12 + (card.lit ? 14 : 0) + (card.finale ? 100 : 0);
    if (i > 0 && i < hand.length - 1 && canMerge(hand[i - 1], hand[i + 1])) score += 18;
    switch (verse.type) {
      case 'heal': score += lowest < 0.55 ? 50 : lowest < 0.8 ? 5 : -30; break;
      case 'shield': score += threat > teamHp * 0.25 ? 30 : lowest < 0.7 ? 12 : -10; break;
      case 'mass': score += 8 + 6 * (enemies.length - 1); break;
      case 'attack': score += 12; break;
      case 'buff': score += 9; break;
      case 'debuff': score += 10; break;
    }
    if (!best || score > best.score) best = { card, score };
  });
  const pick = best as { card: Card; score: number } | null;
  if (!pick) return null;
  const caster = engine.unit(pick.card.ownerUid);
  return { kind: 'cast', cid: pick.card.cid, targetUid: caster ? pickTarget(caster, enemies) : engine.targetUid };
}

function pickTarget(caster: Unit, enemies: Unit[]): string | null {
  if (enemies.length === 0) return null;
  const scored = enemies.map((e) => ({
    e,
    s: e.hp / e.maxHp - 0.25 * moodRelation(caster.mood, e.mood) + (e.intent?.finale ? -0.3 : 0),
  }));
  scored.sort((a, b) => a.s - b.s);
  return scored[0].e.uid;
}

/** Plans a whole round with the heuristic (simulation helper). */
export function autoPlanRound(engine: BattleEngine): void {
  let guard = 12;
  while (!engine.readyToResolve && guard-- > 0) {
    const a = chooseAutoAction(engine);
    if (!a) break;
    if (a.kind === 'lantern') engine.lightLantern();
    else engine.cast(a.cid, a.targetUid);
  }
}
