import type { Effect, StatusId, TargetRule, VerseDef, VerseType } from '../data/types';
import { LANTERN, RANK_MULT, STATUS_MULT } from './rules';

export const STATUS_INFO: Record<StatusId, { name: string; text: string; good: boolean }> = {
  might: { name: 'Might', text: `Deals ${pct(STATUS_MULT.might)} more damage.`, good: true },
  weak: { name: 'Weak', text: `Deals ${pct(STATUS_MULT.weak)} less damage.`, good: false },
  frail: { name: 'Frail', text: `Takes ${pct(STATUS_MULT.frail)} more damage.`, good: false },
  burn: { name: 'Burn', text: 'Loses HP at the end of each round.', good: false },
  daze: { name: 'Daze', text: 'Skips its next action.', good: false },
  regen: { name: 'Regen', text: 'Recovers HP at the end of each round.', good: true },
};

export const TYPE_LABEL: Record<VerseType, string> = {
  attack: 'Attack', mass: 'Mass', heal: 'Heal', shield: 'Shield', buff: 'Buff', debuff: 'Debuff',
};

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function who(t: TargetRule): string {
  switch (t) {
    case 'enemy': return 'the target';
    case 'allEnemies': return 'all enemies';
    case 'randomEnemy': return 'random enemies';
    case 'self': return 'self';
    case 'allAllies': return 'all allies';
    case 'woundedAlly': return 'the most wounded ally';
  }
}

function effectText(fx: Effect, mult: number, rank: number): string {
  switch (fx.kind) {
    case 'damage': {
      const hits = fx.hits ?? 1;
      const base = `Deal ${pct(fx.power * mult)} ATK damage to ${who(fx.target)}`;
      return hits > 1 ? `${base}, ${hits} times.` : `${base}.`;
    }
    case 'heal':
      return `Restore ${pct(fx.power * mult)} ATK as HP to ${who(fx.target)}.`;
    case 'shield':
      return `Grant ${who(fx.target)} a Shield of ${pct(fx.power * mult)} ATK.`;
    case 'status': {
      const name = STATUS_INFO[fx.status].name;
      const chance = fx.chance ? `${pct(fx.chance[rank - 1])} chance to ` : '';
      const potency = fx.power ? ` (${pct(fx.power * mult)} ATK per round)` : '';
      const verb = chance ? 'inflict' : STATUS_INFO[fx.status].good ? 'Grant' : 'Inflict';
      const sentence = `${chance}${verb} ${name}${potency} on ${who(fx.target)} for ${fx.turns} round${fx.turns > 1 ? 's' : ''}.`;
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    case 'ardor':
      return `Grant ${who(fx.target)} +${fx.amount} Ardor.`;
    case 'snuff':
      return `Snuffs ${fx.amount} fireflies from your Lantern.`;
  }
}

export function describeEffects(effects: Effect[], rank = 1, lit = false): string[] {
  const mult = RANK_MULT[rank - 1] * (lit ? 1 + LANTERN.litBonus : 1);
  return effects.map((fx) => effectText(fx, mult, rank));
}

export function describeVerse(verse: VerseDef, rank = 1, lit = false): string {
  const lines = describeEffects(verse.effects, rank, lit);
  if (lit) lines.push(`Firefly: +${pct(LANTERN.litBonus)} power, feeds the Lantern.`);
  return lines.join(' ');
}
