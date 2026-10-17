# Reference style study

## Rendering style (observed)

The reference is **not pixel art**. It combines:

1. Painterly, high-resolution anime illustration for portraits, banners and the victory screen.
2. Small chibi 3D models (≈ 20 % of screen height) in battle, lit by the stage.
3. Graphic, pop-art card illustrations: flat colour fields, halftone dot gradients, radiating speed
   lines, starbursts, cropped hands/hats/props, thick black shapes.
4. A restrained vintage UI: cream paper panels, thin rules, serif type, burnt-orange primary buttons,
   gold for victory/rarity, small red notification dots.

Because the bible makes the reference analysis authoritative over the provisional pixel-art
direction (§3.1–3.2), Firefly Nocturne uses a **high-resolution illustrated/vector style** instead of
pixel art. See `originality-decisions.md` (D-01).

## Sampled colour relationships

| Role | Sample (reference) | Where |
|---|---|---|
| Deep background | `#182123`, `#111817` | battle floor shadows, HUD panels (2:14, 2:26) |
| Stage mid tone | `#6b7b79` | brutalist wall (2:14) |
| Light plane | `#9ca79c` | light shaft on pillar (2:14) |
| Paper / cream | `#f7f1ec` | notice modal (0:22) |
| Primary accent | `#b64f30` | selected list item, Start / Summon×10 buttons (0:22, 2:11) |
| Ink | `#1d1614` | selected tab, card strips (0:22, 2:24) |
| Ritual gold | `#c9b573` | glowing wheel (1:06), victory lettering (2:39) |
| Mist | `#949070`, lake glow `#b3c291` | summon lake (1:06) |

Pattern: a **cold, desaturated world** (teal-grey, olive mist) against **warm interaction colours**
(orange, gold, cream). Warmth = something you can act on or something you earned.

## Typography

- Display: wide, high-contrast serif capitals ("VICTORY", chapter titles) with generous tracking.
- Body: a bookish serif at small sizes; keywords coloured (orange = numbers, blue = statuses).
- Numbers: bold italic serif for damage; gold for totals/crits.
- Labels: letter-spaced small caps ("A t t a c k").

Our choice: **Cinzel** (display caps) + **Spectral** (body, italic numbers). Both SIL OFL.

## Composition

- Battle: units occupy the middle third vertically; HUD hugs the corners; the hand owns the bottom
  edge; action slots float top-centre. Lots of negative space — the stage is moody, not busy.
- Menus: one large character on one side, information on the other. Modals are centred cream sheets
  over a blurred, darkened scene.

## Motion language

- UI elements slide a short distance + fade (≈ 150–250 ms), never bounce cartoonishly.
- Casts: short anticipation (scene dims, rings appear ≈ 200 ms) → effect (≈ 400 ms) → number pop → settle.
- Damage numbers pop large then drift up and fade.
- Summon: slow, ceremonial; long holds with particles and fog.

## Atmosphere

Film-grain-like softness, vignettes, fog, floating dust motes, and a single strong light direction per
scene (light shafts from upper right in the battle hall at 2:14).
