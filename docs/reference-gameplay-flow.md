# Reference gameplay flow

Derived from the footage (see `reference-observations.md` for timestamps).

## Session flow observed

```
Boot art (0:00) → loading tip (0:02) → Lobby (0:05)
  ├─ live-ops modals: calendar, notices, mail (0:07–0:27)       [rejected for v1]
  ├─ Summon banner → confirm → ritual → reveal → results (0:52–1:17)
  ├─ Roster → character detail (1:22–1:27)
  └─ Story hub → stage timeline → cutscene → Formation → Battle → Victory → dialogue → timeline (1:35–3:00)
```

## Battle state machine (2:13–2:45)

```
Intro ─► Overture (opening passives) ─► Deal ─► Planning ─► Resolve player queue ─► Enemy actions ─► End of round
                                          ▲                                                           │
                                          └──────────────── next round (round ≤ limit) ◄──────────────┘
End of round ─► wave cleared? ─► next wave / Victory          all allies down or round limit ─► Defeat
```

- **Deal**: the hand is topped up from the right; identical neighbours merge.
- **Planning**: tap a card → it moves into the next action slot; the gap closes (possible merge).
  When all slots are full the round resolves automatically (no confirm button observed at 2:28).
- **Resolve**: slot order, one cast at a time, each with caster focus, effect, numbers.
- **Enemy actions**: telegraphed by an icon above the enemy during planning (2:24).
- **Ultimate**: available once five moxie pips are full; appears at the right end of the hand.

## Reference gameplay specification (§1.3)

| Field | Finding |
|---|---|
| Genre and subgenre | Turn-based, side-view party RPG with a card-hand action system; gacha collection meta. |
| Primary player objective | Defeat every enemy wave before the round limit. |
| Primary repeatable action | Choose cards from a dealt hand to fill a fixed number of action slots each round. |
| Secondary actions | Merge identical cards (via adjacency), pick a target, spend the ultimate, toggle auto/speed. |
| Failure / completion | Victory when all waves are cleared; defeat when the team falls or the round limit passes. |
| Core challenge pattern | Short-term card economy (play now vs. hold to merge) against telegraphed enemy actions. |
| Progression structure | Linear story stages with star objectives; summon for new characters; level ups. |
| Average meaningful cycle | ≈ 10–14 s per round (≈ 4 s decide + ≈ 6–10 s resolve). A stage ≈ 1–3 min. |
| Camera model | Fixed side view; brief darkening/vignette on casts; no camera travel observed. |
| Control model | Mouse/touch taps only during battle; no drag observed (?: the live game supports drag-to-move). |
| Key animation beats | Cards slide into slots (2:25); caster rings + beam (2:29); damage numbers (2:35); ultimate cut-in (2:34); victory emblem (2:39). |
| Most satisfying moment | The ultimate → big gold total-damage number (2:35–2:37); in the meta, the rare diamond on the water (1:10). |
| Three defining visual characteristics | 1. Desaturated teal-grey stages with dramatic light shafts. 2. Cream paper UI with burnt-orange accents and serif type. 3. Pop-art card illustrations (halftone, flat colour, speed lines). |
| Three defining feedback characteristics | 1. Large italic serif damage numbers (gold for totals). 2. Floating serif status labels. 3. Scene dims + gold rings during every cast. |
