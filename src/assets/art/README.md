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

## Current art

Imported with the scripts in `tools/art/`:

```sh
# characters: two 4x3 transparent sheets (optionally with AI-upscaled copies for detail)
python3 tools/art/import_characters.py sheetA.webp sheetB.webp [--upA sheetA_4x.png --upB sheetB_4x.png]
# enemies: two 4x2 sheets (A transparent, B on a flat dark backdrop that gets keyed out)
python3 tools/art/import_enemies.py enemiesA.webp enemiesB.webp [--upA enemiesA_4x.png --upB enemiesB_4x.png]
```

Luminaries with painted art (ids are internal and unchanged; names follow the art):

| id | Name · title | Notes |
|---|---|---|
| wren | Corvin Vesper · The Lantern Keeper (main character) | idle loop `idle/wren.webm` |
| odile | Seraphine Aube · The Winged Oracle | |
| bastian | Columbine Rouge · The Cut-String Marionette | mirrored in battle |
| ichabod | Lucien Marée · The Tidecaller | mirrored in battle |
| teddy | Aldric Verdane · The Astrolabe Warden | |
| ottoline | Ophelia Sablier · The Hourglass Countess | |
| marigold | Valerian Rosenthal · The Crimson Patron | |
| hesper | Elias Astrée · The Star Cartographer | mirrored in battle |

Renders that face left are listed in `ART_FACES_LEFT` (src/game/art/registry.ts) so the troupe
always faces right in battle. Single renders: `python3 tools/art/import_single.py <img> <id> <faceX> <faceY> [size]`.

Idle loops: extract frames at the still's full size, key them with
`python3 tools/art/key_idle_video.py <frames> <out> <still> 0.85` (flood-fills the black backdrop,
crops to the still's frame so both match exactly, ping-pongs), then encode VP9 with alpha:
`ffmpeg -framerate 18 -i out/%03d.png -c:v libvpx-vp9 -pix_fmt yuva420p -crf 42 -b:v 0 idle/<id>.webm`.
The game plays the loop once, rests 2.6–4.2 s on the first frame, then plays again.

| Dimmed | Sprite | Dimmed | Sprite |
|---|---|---|---|
| mothling | crescent moth | gullwraith | birdcage bride with gulls |
| usher | faceless bellhop | stevedore (Bilge Shade) | red-veined shadow |
| mannequin | porcelain doll | siren | mirror lady |
| hound | shadow hound | keeper (boss) | logbook golem with lantern |
| widow | angel statue | cogspider (Torn Hymnal) | hymn-sheet choir girl |
| lampeater | lamp beetle | pendulum (Pendulum Jester) | marionette jester |
| curtaincaller (boss) | chandelier ghost | chimewisp | belfry bell-ringer |
| gloam (boss) | umbrella shroud | hourless (boss) | clockwork gentleman |

Backgrounds: `bg/parlour` (lobby + menu), `bg/street` (Chapter 1), `bg/theatre` (Chapter 2).

All ground units and the lobby/menu leader are drawn with `LivingSprite`
(`src/game/ui/LivingSprite.ts`), which slices the image into strips and animates them every frame
(sway, breathing, hair/cape ripple, attack/hit/cast poses), so a single still image moves.
