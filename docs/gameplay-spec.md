# Gameplay specification — Firefly Nocturne

**Core concept.** Players *cast Verse cards from a dealt hand* to *drive back waves of Dimfolk
within a round limit*, while managing *card merges, telegraphed enemy attacks and their fireflies*,
gradually *collecting and levelling a troupe of Luminaries through the Lantern Rite*.

## Core loop

Enter stage → read enemy intents → choose Verses into Beats (merging, lighting fireflies) →
the round resolves with clear feedback → enemies act as telegraphed → next round →
victory (stars, Glimmer, EXP) or defeat (retry) → story timeline → summon / team up → next stage.

## Battle rules (authoritative values live in `src/game/battle/rules.ts`)

- **Team**: 3 Luminaries on the field. Enemies: 1–3 per wave, 1–3 waves.
- **Hand**: up to 7 Verse cards. Each round the hand is topped up to 7 from the living allies'
  Verses (each ally has two). New cards enter at the right end.
- **Merging**: two adjacent cards of the same Verse and rank (< 3) merge into one card of rank + 1.
  Merges chain. They happen when dealing, when a cast card leaves the hand (its neighbours meet), and
  when the player moves a card.
- **Ranks**: ★ ×1.0, ★★ ×1.5, ★★★ ×2.5 effect power.
- **Beats**: 3 per round (+1 during the Lantern Hour). Casting a card or moving a card costs one Beat.
  When every Beat is spent the round resolves automatically. The last action can be undone.
- **Targeting**: tap an enemy to set the target for single-target Verses (default: first enemy).
  Heals/shields pick the most wounded ally.
- **Ardor**: every Verse a Luminary casts gives them +1 Ardor (max 5). At 5, their **Finale** card is
  added to the hand (right end, never merges). Casting the Finale resets Ardor to 0.
- **Fireflies (signature)**: at the start of each round one unlit Verse in hand is lit. A lit card
  casts at +30 % and sends its firefly to the **Lantern** (max 5). A merge keeps the light.
  With 5 fireflies, tap the Lantern → **Lantern Hour**: +1 Beat this round. Some enemies *snuff*
  fireflies (remove 2 from the Lantern).
- **Moods**: Sun beats Moon, Moon beats Star, Star beats Sun. Advantage ×1.25 damage, disadvantage ×0.85.
- **Enemies** follow a readable move pattern and show their next move (chip above the head) during
  planning, including the targeted ally. At 5 Ardor their next move is their Finale (red chip).
- **Statuses**: Might (+30 % damage dealt), Weak (−25 % damage dealt), Frail (+30 % damage taken),
  Burn (damage at end of round), Daze (skips its next action — enemies only), Regen (heal at end of
  round). Shields absorb damage and persist until broken.
- **End of round**: Burn/Regen tick, status durations count down, round +1.
- **Defeat**: all allies down, or the round limit is exceeded. **Victory**: all waves cleared.
- **Stars**: ① win, ② win within the stage's round target, ③ no ally falls.

## Meta

- **Glimmer**: first clear 160 (+80 for 3★), repeat clears 40. New players start with 1600 (one ×10 rite).
- **Lantern Rite**: 160 Glimmer per light (×10 = 1600). Rates ★5 4 %, ★4 24 %, ★3 72 %;
  a ★5 is guaranteed by the 40th light (counter shown on the banner).
- **Duplicates**: +1 Resonance (max 5, +6 % HP/ATK each); beyond max → refund 60 Glimmer.
- **Levels**: stage EXP to each team member; Lv 1–40; +7 % HP/ATK/DEF per level.
- **Achievements**: 17 milestones (chapters, stars, rites, roster, levels, Atlas) each pay Glimmer once
  when claimed (`src/game/systems/achievements.ts`). Lamplighter level = 1 + stars ÷ 2.
- **Atlas**: enemies are recorded the first time their wave spawns (`save.seen`).

## Pacing table (targets, to be tuned by playtest)

| Phase | Stages | Rounds | New elements |
|---|---|---|---|
| Introductory | 1-1, 1-2 | 3–5 | tap to cast, Beats, merge hint, first firefly |
| Early | 1-3 … 1-5 | 4–7 | enemy intents, Finale, multi-wave |
| Middle | 1-6 … 2-3 | 5–8 | statuses (Burn, Frail), snuffers, Lantern Hour planning |
| Advanced | 2-4 … 2-8 | 6–10 | shields + healers, boss Finales, mood counters |
| Docks | 3-1 … 3-8 | 7–12 | heavy hitters (Rust Stevedore), dazing Fog Siren, boss Keeper Brine |
| Clockwork | 4-1 … 4-8 | 8–15 | random-hit Cog Spiders, Pendulum Knights, final boss The Hourless King |

## First-play experience

New players land directly in Stage 1-1, "First Light (Tutorial)" — no title screen, no menus.
Until it has been won once, 1-1 runs a scripted battle (`BattleScript` in the engine) that fields
the starter trio, doubles enemy HP, and never lets an ally fall. A paper
bubble gates one action at a time and refuses any other card (Auto, drag and undo are locked
until the lesson ends):

| Round | Scripted setup | Step |
|---|---|---|
| 1 | Hand: Strike, Lullaby, Strike, … | read the enemy intent (tap) → cast Lullaby (the Strikes merge) → cast the ★★ Strike → free cast |
| 2 | Kindling is lit | cast the firefly-lit Verse |
| 3 | Wren's Ardor set to 5 | cast her Finale |
| 4 | Lantern filled to 5 | tap the Lantern for a 4th Beat → "finish the fight your way" |

Winning marks `tutorialDone` (and every per-hint flag). Later stages still show the one-off
hints for intents (1-2) and moving cards (1-3).
