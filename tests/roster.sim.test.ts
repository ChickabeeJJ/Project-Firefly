import { describe, expect, it } from 'vitest';
import { BattleEngine } from '../src/game/battle/engine';
import { autoPlanRound } from '../src/game/battle/autoplay';
import { STAGES } from '../src/game/data/stages';
import { CHARACTERS } from '../src/game/data/characters';

/** Every Luminary, in every troupe slot, plays through real stages without the engine throwing or stalling. */
describe('every Luminary can fight', () => {
  it('plays each character through several stages to an end', () => {
    const stages = ['1-2', '2-4', '3-6', '4-8'].map((id) => STAGES.find((s) => s.id === id)!);
    const ids = CHARACTERS.map((c) => c.id);
    for (let i = 0; i < ids.length; i++) {
      const team = [ids[i], ids[(i + 7) % ids.length], ids[(i + 13) % ids.length]];
      for (const stage of stages) {
        const e = new BattleEngine({ stage, team: team.map((charId) => ({ charId, level: 40, resonance: 2 })), seed: 77 + i });
        e.start();
        let guard = 80;
        while (e.phase === 'planning' && guard-- > 0) {
          autoPlanRound(e);
          e.resolveRound();
        }
        expect(['won', 'lost'], `${team.join(',')} on ${stage.id} ended in ${e.phase}`).toContain(e.phase);
      }
    }
  });
});
