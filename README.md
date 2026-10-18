# Project Firefly

A card-incantation battler for CrazyGames, inspired by the feel of *Reverse: 1999* with its own
world, characters, art and signature mechanic.

> Vellmoor, 1929. Each night the Dimming swallows the city's light. Lead a troupe of Luminaries,
> cast Verses from your hand, and let the fireflies light the way.

## Play

- **Tap a Verse** to cast it into the next Beat (3 per round). The round plays out when the Beats are full.
- **Identical Verses side by side merge** into a stronger rank — casting the card between two
  twins merges them for free. **Drag** a Verse to move it (costs a Beat).
- **Tap an enemy** to target it. Chips above enemies show their next move and target.
- **Fireflies** light one Verse per round (+30 %). Casting it feeds the **Lantern**; at 5, tap the
  Lantern for an extra Beat. Lamp-Eaters snuff fireflies.
- Full **Ardor** (5 pips) adds a character's **Finale** card.
- Keys: `Space` toggles Auto, `Esc` pauses. Tap the last filled Beat to undo.

**Content:** 4 chapters / 32 stages (1-1 is a guided tutorial), 16 Luminaries, 16 kinds of Dimmed
including 4 bosses. The lobby has an options menu (≡) with the Atlas, Achievements, Notice
board, Gramophone and profile.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173  (dev: ?scene=Battle&stage=1-4 jumps to a scene)
npm test           # unit tests
npm run sim        # balance simulation table
npm run build      # production build in dist/ (relative paths, CrazyGames-ready)
```

Art preview (dev only): `http://localhost:5173/preview.html?v=dolls|enemies|cards|bg_street`.

## Docs

Start with `docs/GAME_BIBLE.md`, then `docs/reference-analysis.md`, `docs/gameplay-spec.md`,
`docs/originality-decisions.md`, `docs/visual-style-guide.md`, `docs/technical-architecture.md`
and `docs/qa-checklist.md`.

All art is generated in code and all audio is synthesised at runtime. Painted art can be dropped
into `src/assets/art/` to replace it per character, enemy or background — see
`src/assets/art/README.md` and the prompt list in `docs/higgsfield-art-brief.md`. Fonts: Cinzel and Spectral
(SIL Open Font License).
