# Art pipeline (Scenario / Higgsfield status)

## Current state

The shipped build uses **no generated images**. Every asset is drawn in code
(`src/game/art/`), which gives a single consistent style, zero licensing risk, a 1.7 MB bundle,
and instant iteration. Scenario and Higgsfield were **not** used yet: the bible requires a cost
estimate and approval before generation (§5.2, §6.4, §16), and that approval has not been given.

## Recommended proof set (awaiting approval)

Goal: painted key art for the menus (where the reference uses illustrations) while keeping the
procedural chibis in battle (where the reference uses small 3D models).

| # | Asset | Use | Count |
|---|---|---|---|
| 1 | Luminary key-art portrait (one character, e.g. Wren) | lobby, victory, rite reveal | 1 + 2 variants |
| 2 | Lobby parlour backdrop | lobby | 1 |
| 3 | Lantern Rite lake backdrop | summon | 1 |

Review each at in-game size against the existing UI before generating the remaining 9 portraits.

### Prompt (Scenario, portrait)

> Original 1920s character key art for a browser game. Gameplay purpose: menu and victory
> portrait. Character: Wren Ashcombe, a young match-seller in a mustard coat, brown newsboy cap,
> auburn bob, freckles, red scarf, holding a lit match. Style: painterly anime illustration,
> soft cel shading, light from upper left, muted night palette with warm amber accents.
> Full body, centred, transparent or flat dark background. Exclusions: no text, no logos,
> no watermark, no existing game characters.

### Higgsfield (optional, promotional only)

A 6–8 s trailer shot of the Lantern Rite (fireflies spiralling from a jar over a night lake,
lanterns descending). Promotional only; in-game animation stays in Phaser.

## Integration plan

`registry.ensurePortrait` already isolates portrait lookup. Approved images would be added as
files under `public/art/`, loaded in Boot, and used in place of the procedural portrait key — no
scene code changes. Record model IDs, asset IDs and prompts in this file when generated.
