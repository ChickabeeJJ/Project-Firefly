# Originality decisions

Classification per bible §1.5: **Retain principle / Adapt / Replace / Reject**.

## Identity

| ID | Decision | Class |
|---|---|---|
| D-01 | Rendering: high-resolution illustrated/vector style, **not pixel art**. The reference is painterly + 3D chibi; the user asked for it to look "like R1999". All art is generated procedurally in code from original shape designs (no third-party art). | Adapt (documented override of the provisional pixel-art direction) |
| D-02 | Name **Firefly Nocturne**, premise: Vellmoor, 1929 — each night "the Dimming" swallows light and memory; the Lamplighter leads a troupe of Luminaries whose sung *Verses* rekindle it. No time-travel, no suitcase, no storm. | Replace |
| D-03 | Characters: ten original Luminaries (1920s performers and professionals) and seven Dimfolk enemies. No character resembles a reference character in name, silhouette or palette. | Replace |
| D-04 | Terminology: Incantation → **Verse**, Moxie → **Ardor**, Ultimate → **Finale**, AP → **Beats**, Afflatus → **Mood** (Sun / Moon / Star triangle), Arcanist → **Luminary**, Summon → **Lantern Rite**, currency → **Glimmer**. | Replace |
| D-05 | Battle layout mirrored: allies on the **left** facing right, enemies on the right. | Adapt |
| D-06 | Enemy intent shown as explicit chips (icon + value + target marker) — clearer than the reference. | Adapt (fairness, bible §2.5) |
| D-07 | Mood triangle (3 moods) instead of the reference's 4+2 afflatus wheel — simpler for a browser audience. | Adapt |
| D-08 | Summon ritual: fireflies released from a jar over a night lake; paper lanterns float down and their colour tells rarity. | Replace |
| D-09 | No stamina, no real-money shop, no login calendar, no mail, no live-ops notices. | Reject |
| D-10 | UI language (cream paper, orange primary, gold rewards, serif type) retained as a *principle*, with our own panel shapes, lantern emblem, icon family and copy. | Retain principle |
| D-11 | Card layout reading order (rank stars → art → type strip) retained; art is procedural pop-art with our motifs; type strip uses our glyphs. | Adapt |
| D-12 | All audio is synthesised at runtime (Web Audio); no recordings. | Replace |

## Signature mechanic — proposals

Scored 1–5 (higher is better; for cost, 5 = cheapest).

| Proposal | Clarity | Novelty | Impl. cost | Visual potential | Replay value | Total |
|---|---|---|---|---|---|---|
| **A. Fireflies & the Lantern** — each round a firefly lands on one card in hand. A lit card casts at +30 % and, when cast, its firefly flies to the Lantern. Merging keeps the light. Five fireflies let you light the **Lantern Hour**: +1 Beat for that round. Some enemies *snuff* fireflies from the Lantern. | 5 | 4 | 4 | 5 | 4 | **22** |
| B. Cadence slots — each round some Beat slots show a type glyph; matching card types "harmonise" for bonus effects. | 3 | 4 | 3 | 3 | 3 | 16 |
| C. Encore — repeating the same character in consecutive Beats builds an Encore chain that multiplies the last cast. | 4 | 3 | 4 | 3 | 3 | 17 |

**Selected: A.** It adds a recurring choice (play the lit card now vs. play for merges), a medium-term
plan (save the Lantern Hour for a boss Finale round), counter-play from enemies (Lamp-Eaters snuff
fireflies), and a strong visual (fireflies drifting across the screen into a glowing lantern). It
reinforces the core loop rather than adding a side system, and it can be tuned independently
(`LANTERN` constants in `src/game/battle/rules.ts`).
