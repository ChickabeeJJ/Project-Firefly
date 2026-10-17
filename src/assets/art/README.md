# Drop-in art

Put finished images here and they replace the code-drawn art automatically on the next
`npm run dev` / `npm run build`. Nothing else needs changing. A missing file falls back to the
procedural art, so you can add assets one at a time.

The filename is the **id** (lower-case) — e.g. `characters/wren.png`. PNG, JPG and WebP all work.
Use **transparent PNG** for anything that stands on a background (characters, enemies).

| Folder        | What                                   | Size (px)                 | Used in |
|---------------|----------------------------------------|---------------------------|---------|
| `characters/` | Full-body key art, transparent, feet at the bottom edge | ~1024 × 1792 (9:16) | Lobby, menu, Troupe, Rite reveal, results, Finale cut-in. Also the battle sprite if `battle/` is empty |
| `heads/`      | Head-and-shoulders bust, face centred in the upper third | 512 × 512        | Card corners, HP bars, intent chips, Rite results |
| `battle/`     | *(optional)* Full-body battle pose, transparent, facing **right** | ~600 × 1000 | Battlefield sprite (resized to 380 px tall) |
| `enemies/`    | Full body, transparent, facing **left** | ~800 × 1000 (bosses ~1000 × 1300) | Battlefield, Atlas, Story stage preview |
| `bg/`         | Painted backdrops, no characters        | 1920 × 1080               | `street`, `theatre`, `docks`, `clocktower` (battles), `parlour` (lobby/menu), `lake` (Rite), `map` (Story) |
| `cards/`      | *(optional)* Verse card illustrations   | 528 × 808 (portrait)      | Hand cards; id = verse id, e.g. `cards/wren_strike.png` |
| `banners/`    | *(optional)* Wide promo banners         | 1800 × 720 (5:2)          | `rite` (lobby promo + menu carousel), `chapter1` … `chapter4` (menu carousel) |
| `ui/`         | Reserved for future UI skins            | —                         | — |

Ids are listed in `docs/higgsfield-art-brief.md`, along with a ready-to-paste prompt for every
character, enemy and background.

Tips
- Keep the same camera and lighting across a set, so the troupe looks like one cast.
- Leave a little transparent margin around the figure and don't crop the feet.
- Large files are fine for art direction, but keep each under ~1.5 MB so the CrazyGames build stays small (WebP helps).
