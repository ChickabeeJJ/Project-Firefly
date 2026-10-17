# Animation catalog

All animation is procedural (Phaser tweens/particles over generated textures). Durations are at
1× speed; the Speed button doubles `tweens.timeScale` and `time.timeScale` together.

| animation_id | owning_entity | trigger | start_state | end_state | frames / duration | loop | root_motion | interruption_rules | gameplay_timing | fallback |
|---|---|---|---|---|---|---|---|---|---|---|
| unit.idle | UnitView | spawn | idle | idle | 1.7–2.2 s yoyo (flyers 1.3 s, ±16 px) | yes | none | stopped on death | none | static sprite |
| unit.appear | UnitView | wave spawn / battle start | hidden | idle | 480 ms slide 80 px + fade, 120–140 ms stagger | no | x | none | precedes planning | instant |
| unit.lunge | UnitView | cast / enemy act with damage | idle | idle | 140 ms out, 120 ms hold, yoyo | no | x ±40–90 px | resolves at yoyo so hits land on contact | blocks the cast block | skip |
| unit.hit | UnitView | damage event | idle | idle | 70 ms white fill + 60 ms knockback yoyo | no | x ±14/26 px | stacks harmlessly | none | none |
| unit.die.enemy | UnitView | death event | idle | removed | 650 ms fade + rise 40 px | no | y | awaited at end of block | wave clear after | instant hide |
| unit.die.ally | UnitView | death event | idle | fallen (35 % alpha, grey, −8°) | 500 ms | no | none | — | cards purged next round | — |
| hud.hp | UnitView | damage/heal/shield | — | — | fill instant, white lag bar 500 ms after 250 ms | no | — | retargets | none | instant |
| card.deal | CardView | dealCard | offscreen right | hand slot | 260 ms, 70 ms stagger | no | x | killed by relayout | before planning | instant |
| card.hover | CardView | pointer over | home | lifted 30 px | 120 ms | no | y | relayout restores home x/y | none | none |
| card.cast | CardView | tap | hand | Beat slot (0.42×) | 220 ms | no | x/y | undo rebuilds state | queues Beat | instant |
| card.merge | CardView | MergeStep | two cards | one card rank+1 | 220 ms fly-in, 420 ms flash, star pop 380 ms | no | x/y | — | none | instant |
| card.drag | CardView | drag (>22 px) | hand | new index | follows pointer; 200 ms settle | no | x/y | drop outside → snap back | spends a Beat | — |
| card.lit | CardView | light event | unlit | lit | firefly flight 650 ms; glow pulse 1.1 s yoyo | glow loops | — | — | none | glow only |
| slot.consume | Container | cast/fizzle | queued | spent | 120 ms pop yoyo, 260 ms fade | no | — | — | marks cast order | instant |
| fx.castRing | BattleFx | cast | — | — | ring 600 ms, glow 500 ms | no | — | — | pre-hit | none |
| fx.slash / burst / beam | BattleFx | damage | — | — | slash 280 ms, sparks 300–600 ms, beam 90+120+90 ms | no | — | — | with hit | number only |
| fx.number | BattleFx | damage/heal/shield | — | — | pop 160 ms, hold 480 ms (crit 700), drift 420 ms | no | y | — | none | — |
| fx.label | BattleFx | status/resist/mood | — | — | 200 in, 760 hold, 360 out | no | y | — | none | — |
| fx.firefly | BattleFx | firefly/snuff/light | — | — | quadratic bezier 650–900 ms | no | — | fire-and-forget | Lantern updates on arrival | count updates |
| fx.cutIn | BattleFx | Finale cast | — | — | 140 fade, 420 slide, hold to 1250, flash 220 | no | — | blocks block | before Finale effects | banner |
| fx.banner | BattleFx | wave/victory/lantern/enemy Finale | — | — | 200 in, 900 hold, 260 out | no | — | — | blocks where awaited | — |
| lantern.hour | BattleScene | Lantern tap | — | — | flash 400 ms, 18 fireflies, banner | no | — | undoable | +1 Beat | — |
| rite.vortex | SummonScene | Light ×1/×10 | banner | ritual | 46 fireflies spiralling 1.6–2.4 s, 4 rings | no | — | SKIP → results | results saved before animation | results grid |
| rite.lanterns | SummonScene | after title card | — | floating | fall 1.1–2.0 s, bob 1.4–1.8 s yoyo | bob loops | y | SKIP | — | results grid |
| rite.reveal | SummonScene | lantern tap / reveal all | lantern | card | 600 ms burst, 320 ms card pop; ★5 full-screen | no | — | tap to continue / auto 4.5 s | — | grid |
| result.stars | ResultScene | scene start | hidden | shown | 300 ms pop, 260 ms stagger from 700 ms | no | — | — | — | static |
| lobby.leader | LobbyScene | scene start | — | — | breathing 2.2 s yoyo | yes | — | — | — | static |
| lobby.nixie | LobbyScene | every 1 s | — | — | colon blink 500 ms yoyo | yes | — | — | real clock | static |
