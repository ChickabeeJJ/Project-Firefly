# Reference observations (timestamped evidence)

Source: `Screen_Recording_2026-10-17_120602.mp4` — 1918×1078, 30 fps, 3:27.9, a desktop
capture of the live-service gacha RPG used as the reference. Frames were sampled with
`tools/contact-sheet.sh` (overview: one frame every 2.5 s; battle: one frame per second
from 2:08 to 2:46) plus full-resolution crops of the battle HUD.

Legend: **O** = direct observation, **I** = interpretation, **?** = uncertain.

| Time | Observation | Purpose | Adaptation decision |
|---|---|---|---|
| 0:00 | **O** Loading art: a derelict airship half-sunk in water, picture frames floating in the air, cold blue-grey palette with a red smear. | Sets a melancholic, surreal tone before any UI. | Replace: our boot is a short "lighting the lamps" line; mood is set in the first scene instead (CrazyGames wants fast time-to-play). |
| 0:02 | **O** Loading tip screen: tiny film-strip/record motif, a line of serif body text, near-black background. | Covers loading with lore. | Adapt: one-line lore tips on the results/transition panels only. |
| 0:05, 0:27–0:35 | **O** Lobby: a single tall character stands in a dim room with dusk windows; left column of small line icons (Mail, Tasks, Warehouse, Bank); right column of stacked banner buttons; "Summon" button carries a wheel icon; currencies top-right; an orange Nixie-tube clock (e.g. "19 21") sits on furniture. | Home base with a character as the emotional anchor. | Adapt: our Lamplighter's parlour — one character standing, left line-icon menu, right stacked buttons, Nixie clock showing the player's real time. Different room, icons and copy. |
| 0:07–0:17 | **O** Login-calendar modal: five tall cream paper cards numbered 01–05, a claimed card turns dark with a check stamp. | Daily return reward. | Reject (no login-reward economy — not needed for a CrazyGames session game). |
| 0:17–0:25 | **O** Notice/news and mail modals: cream paper panels, black selected tab, orange selected list item, thin red notification dots. | Live-ops comms. | Reject the screens; **retain** the panel language (cream paper, orange selection, serif type). |
| 0:32 | **O** Task list: numbered rows "01…05", progress "0/10", circular "Go" buttons. | Goals. | Reject for v1 (stage stars cover goals). |
| 0:37–0:42 | **O** Shop with left category list and a calendar illustration. | Monetisation. | Reject (no real-money shop in a CrazyGames basic launch). |
| 0:52–1:00 | **O** Summon banners: large key art, left list of banners, "Summon x1" (white button) and "Summon x10" (orange button) bottom-right; "30 summons guarantee a 6★ character". | Desire + pity transparency. | Adapt: one banner, ×1 / ×10 buttons with the same white/orange hierarchy, visible pity counter, earned currency only. |
| 1:02 | **O** Confirm modal when lacking tickets: currency icon → ticket icon, Cancel (white) / Confirm (orange). | Prevent accidental spending. | Retain principle: summon buttons show cost; disabled state when unaffordable. |
| 1:04–1:06 | **O** Summon ritual starts: a wooden spinning wheel half-submerged in a misty lake, reeds, ruined arches in fog. | Anticipation. | Replace: a jar of fireflies released over a night lake from a pier. |
| 1:06–1:08 | **O** The wheel glows gold, the water forms a teal vortex, golden lines sweep the screen. | Build-up. | Adapt: fireflies spiral up into a column of light; water ripples. |
| 1:08–1:10 | **O** Title card in large serif capitals with a geometric rhombus/circle emblem. | Ritual "moment". | Adapt: our own title "THE LANTERN RITE" with a lantern emblem. |
| 1:10–1:12 | **O** Ten shapes float on the water: triangles (common) and one diamond (rare); "Open all" prompt; SKIP top-right. | Rarity tease before the reveal. | Adapt: ten paper lanterns float down to the water; lantern colour/shape tells rarity (paper = ★3, violet = ★4, gold = ★5). Tap one or "Reveal all". |
| 1:14–1:17 | **O** Results: ten tall portrait cards dealt in a staggered grid; "Already owned … converted" toasts in the top-right. | Reward payoff; dupe handling. | Adapt: dealt card grid + duplicate → Resonance toast. |
| 1:22–1:25 | **O** Roster grid: tall portrait cards with level, an element icon top-left, name bottom; sort tabs Level / Rarity / Bond. | Collection. | Adapt: roster grid with level, mood icon, rarity stars, sort by Level/Rarity. |
| 1:27 | **O** Character detail: large art right, stats list left (ATK/HP/DEF…), Level panel, role tags ("DPS Support Control"), a quote as subtitle at the bottom. | Character attachment. | Adapt: detail panel with stats, verse cards and a one-line quote. |
| 1:35–1:37 | **O** Story hub: chapter posters in a row, bottom tab bar of game modes. | Mode navigation. | Adapt (reduced): chapters as tabs on one story screen. |
| 1:40 | **O** Stage select: a horizontal timeline with stage nodes ("02 Homecoming Day"), recommended level, rewards row, orange Start button with cost "−20". | Linear progression. | Adapt: horizontal timeline of numbered stages with stars; no stamina cost. |
| 1:42–1:57 | **O** Story cutscene: centred title card, monochrome hallway, location tag, dialogue box with portrait + name + text, AUTO / SKIP. | Narrative framing. | Adapt (light): short pre-stage dialogue with AUTO-less tap-to-advance and SKIP; first stage has none (immediate play). |
| 2:05–2:12 | **O** Formation: left "Goals" (Defeat all enemies / Clear within 12 rounds), "Enemy" icons; right four tall character cards with level & element; bottom "Team 1 ⟳" and orange "Start". | Pre-battle check. | Adapt: three tall cards, goals, enemy list, Start. |
| 2:13–2:15 | **O** Enemy appears alone on the left in a grey brutalist hall with a light shaft and checker floor; HUD "Wave: 1/1 Round: 1/20 Battle Intel 🔍". | Establish arena. | Adapt: our arenas (gaslit street, theatre); allies on the **left**, enemies on the right (layout mirrored). |
| 2:15–2:17 | **O** Allies walk in on the right; three cream "stage modifier" cards appear on the far right (e.g. "Battlefield Effect" with a "?" badge). | Rules of this fight are visible. | Retain principle: a small "Stage Rule" chip on hard stages. |
| 2:17–2:21 | **O** Opening passives fire: floating serif labels ("Shield", "Dynamo ×20", "Drunk"), the screen dims, a translucent pink dome over the team, heal numbers "+3630" in large italic serif. | Spectacle; shows passives. | Adapt: start-of-battle "Overture" — team buffs float in as labels. |
| 2:22 | **O** A hand of eight cards slides in from the right along the bottom edge. Each card: pop-art illustration (flat colour, halftone dots, speed lines), three small four-point stars on top (orange = owned rank), black bottom strip with letter-spaced type ("A t t a c k", "B u f f", "C h a n n e l"). | The core decision surface. | Adapt: our "Verse" cards — same reading order (rank on top, art, type strip) but original art motifs, palette per character, our own type glyphs. |
| 2:24 | **O** Four dark card-back slots appear top-centre (an eye-in-triangle emblem). A small shield icon appears above the enemy. Blue "1" badges appear under each ally. | Action points and enemy intent. | Adapt: "Beats" slots with a lantern emblem; enemy intent shown as a cream chip with icon + number + target marker (more explicit than the reference = fairer). |
| 2:25–2:28 | **O** Tapped cards shrink into the slots left→right; remaining hand cards close the gap. A label "Iteration ×1" floats. | Commit actions; adjacency changes. | Retain: closing the gap can merge identical neighbours. |
| 2:29–2:33 | **O** The queue resolves automatically: each cast shows a bottom-left tooltip (skill name + rules text with orange/blue keywords), golden rings orbit the caster, the scene darkens, a gold beam or burst hits. | Readable resolution. | Adapt: bottom-left cast banner with verse name + one-line effect, darkened stage, our own VFX shapes (moth-wing flares, firefly sparks, light ribbons). |
| 2:34 | **O** A special large card with a blue prism illustration sits at the far right of the hand (the ultimate). | Pay-off for the moxie meter. | Adapt: "Finale" card (gold frame) appears when a character's 5 Ardor pips are full. |
| 2:35–2:37 | **O** Big italic numbers "6818", gold "TOTAL 14967" with sparks. | Damage as reward. | Retain principle: per-hit numbers, crits in gold, total for multi-hit. |
| 2:38 | **O** Enemy dissolves; drop label floats ("…Key acquired"). | Resolution. | Adapt: enemy dissolves into moths/smoke. |
| 2:39–2:45 | **O** Victory: black screen, full-height character art left over a red disc, "VICTORY" in large gold serif caps over a triangle sunburst emblem, stage name, objectives with red four-point stars, EXP bar "+200", reward item tiles; a voiced quote as subtitle. | Payoff + progress. | Adapt: MVP character large over a red disc, "VICTORY" with our lantern emblem, objectives with stars, EXP and Glimmer rewards. |
| 2:47–2:55 | **O** Post-battle dialogue in a museum hall. | Narrative. | Adapt: optional short post-stage line on the results screen. |
| 3:00 | **O** Timeline updated: next stage node "03 Escape Plan" is unlocked. | Progress visible. | Retain. |
| 3:02–3:20 | **O** Other modes: roguelike, resource stages, events. | Retention breadth. | Reject for v1 (scope). |

## Battle HUD crops (2:22–2:28, full resolution)

- **O** Top-left block: "Wave: 1/1", "Round: 1/20", "Battle Intel" + magnifier, then a gold coin-like circle "3" with a bar "0/50" and three small segments (?: a team resource).
- **O** Top-right: four diamond buttons (card list, ⟫ speed, ⟳ auto, ∥ pause).
- **O** Above each unit: element badge (diamond), HP bar (allies green on white, enemy red), and five small diamond pips under the bar (moxie). Small status icons with stack counts sit beside the badge.
- **O** Bottom-left: a helix icon with an orange counter (20 → 32 → 36) that grows as cards are played (?: a passive charge).
- **O** Card stars: three four-point stars; owned ranks are orange-red, missing ranks grey.
- **O** Type strip text is letter-spaced serif with a small glyph, coloured per type (Attack red, Buff blue).

## Measured pacing

- Battle entry to first input: ≈ 9 s (2:13 → 2:22), mostly opening passives.
- Card selection for four slots: ≈ 4 s (2:24 → 2:28).
- Resolution of four casts: ≈ 5 s (2:29 → 2:33) — ≈ 1.2 s per cast.
- Ultimate: ≈ 3 s including cut-in and total-damage number.
- Victory screen hold before rewards: ≈ 2 s.
- Summon ritual from confirm to results: ≈ 13 s with SKIP always visible.
