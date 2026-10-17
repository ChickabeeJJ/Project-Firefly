# Visual style guide — Firefly Nocturne

Direction: a moody 1929 night city rendered as **clean illustrated vector art** — chibi Luminaries
with ink outlines and cel shading, pop-art Verse cards, painted-gradient stages, cream-paper UI.
(Pixel art was the bible's provisional default; the reference analysis overrode it — see
`originality-decisions.md` D-01.) Everything is generated in code from `src/game/art/`.

## Palette roles (`src/game/config/theme.ts`)

| Role | Value | Use |
|---|---|---|
| Deep background | `#0c0e11`, `#15171c` | letterbox, overlays, dark panels |
| Structural shadow / outline | `#1b1518` | every outline (3 px at doll scale) |
| Stage materials | `#3b4746`, `#5f706e` | cold teal-grey world |
| Paper (neutral UI) | `#efe6d2`, shade `#d8cab0`, line `#b9a888` | panels, hints, toasts |
| Interaction accent | lantern amber `#c9652f` / `#e58a4c` | primary buttons, selection, reticle |
| Reward / emphasis | gold `#e2be6a` | victory, Finale frames, stars, ornaments |
| Signature | firefly `#dcef72` | fireflies, Lantern, Glimmer currency |
| Danger | `#c8433a` | enemy HP, enemy Finale chips |
| Success / heal | `#7fb069`, `#8fe0a0` | heals, regen |
| Moods | Sun `#e8a33d`, Moon `#8fa7d6`, Star `#b886e0` | mood icons, cast rings |

Rule: **cold world, warm interaction.** Anything the player can act on or has earned is warm
(amber, gold, firefly); the stage stays desaturated.

## Light and shading

- One light direction everywhere: upper left. Cel shadows fall lower right (curved terminator via
  clip + offset circle in `paint.part`).
- Shadows mix toward a violet ink (`shade()`), never pure black, so colours stay alive.
- Enemies carry a violet aura (canvas shadow blur) and glowing eyes to separate them from allies.
- Glows are radial gradients rendered additively; full-screen post-processing is avoided.

## Typography

| Use | Face | Size (logical 1920×1080) |
|---|---|---|
| Titles, labels, buttons | Cinzel 700, tracked | 28–120 px |
| Body, tooltips | Spectral 400 | 24–34 px (minimum 22) |
| Damage numbers | Spectral 700 italic | 42–80 px, stroked |

Minimum body text is 24 px logical (≈ 11 px in the 907×510 embed).

## Layers (battle)

| Depth | Layer |
|---|---|
| 0–5 | painted stage, drifting fog |
| 15 | cast dim |
| 19–30 | ground shadows, reticle, units (sorted by y) |
| 48–49 | unit HUD (HP, Ardor pips, statuses), intent chips |
| 53–61 | VFX, numbers, labels |
| 140 | atmosphere (vignette, grain, dust, fireflies) |
| 200–400 | hand, Beat slots, dragged card |
| 300–320 | HUD, cast banner |
| 640–720 | banners, cut-ins, tooltips |
| 800+ | tutorial hints, overlays |

## Components

- **Verse card** (264×404 native, shown at 0.6): pop-art art, rank stars top, caster head badge
  top-left, black type strip with letter-spaced label; firefly glow when lit; gold frame for Finales.
- **Beat slot**: lantern-emblem card back; the next slot pulses; the last filled slot shows ↶.
- **Intent chip**: dark plate, intent icon, damage preview, target's head; red + pulsing for Finales.
- **Buttons**: amber (primary), cream (secondary), dark (utility), gold (special). States: hover
  +3 %, press −3 %, disabled 45 % alpha.
- **Diamond buttons** for battle utilities (Auto, Speed, Pause), lit amber when active.
- **Portrait card** (300×500): palette gradient, halftone, upper-body crop, name, rarity, level.

## Motion

- UI: 120–320 ms, Cubic ease-out; no bouncy overshoot except star pops (Back.easeOut).
- Casts: ring + glow (≈ 0.2 s) → lunge (140 ms out, 120 ms hold) → hits staggered 95 ms → settle.
- Numbers pop from 1.5× to 1×, hold, then drift up and fade.
- Idle: allies breathe (±1 % scale, 1.7–2.2 s); flyers bob ±16 px.
- No constant camera shake: crits (0.004, 140 ms), Finales (0.006–0.007, 260–300 ms) only.
