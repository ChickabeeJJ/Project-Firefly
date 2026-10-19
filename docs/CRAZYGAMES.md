# Project Firefly — CrazyGames build

This branch (`crazygames-release`) is the CrazyGames submission build. The main development branch
keeps full-size art and streams the whole troupe at boot; this one is tuned for the portal.

## Build and upload

```
npm ci
npm run build        # outputs dist/
```

Zip the **contents** of `dist/` (index.html at the zip root) and upload it in the Developer Portal.
Every asset path is relative (`base: './'` in vite.config.ts), so the build runs from any folder.

## Initial download

Measured on the production build, network only, from page load until the first battle begins:

| | main branch | this branch |
|---|---|---|
| Before the title screen | 17.3 MB | 15.2 MB |
| Within 30 s of loading | 31.9 MB (troupe streaming) | 15.5 MB |

That is under the 50 MB limit and the 20 MB mobile-homepage limit. How:

- `tools/art/cg_compress.py` re-encodes the drop-in art (WebP method 6, sharp YUV) with caps that
  stay at or above the size each image is drawn at: 29.7 MB of art becomes 20.1 MB.
- Only the team (and the starter troupe, who carry the opening story) load at full size during
  boot. Everyone else streams in after the first `gameplayStart`, or after a minute in the menus.

## SDK v3 integration (`src/game/platform/PlatformAdapter.ts`)

All calls are guarded: without the SDK (local, blocked) the game runs normally.

| Feature | Where |
|---|---|
| `loadingStart` / `loadingStop` | Boot, around the asset load |
| `gameplayStart` / `gameplayStop` | Battles only; stopped on pause, results and leaving |
| `happytime` | Three-star clears and ★5 Lantern Rite results |
| Midgame ads | Leaving the results screen; at most once every 3 minutes, never in the first 2 |
| Rewarded ads | "Lamplighter's Tip" in the Pawnshop: +40 Glimmer, three a day (only shown when ads exist) |
| Ad lifecycle | Game paused and audio suspended from `adStarted` until `adFinished`/`adError` |
| Mute setting | Follows the portal's audio setting live |
| Data module | Saves through `SDK.data` (falls back to localStorage) |

## Portal rules covered

- Space, arrows and Page keys, and the mouse wheel, never scroll the host page.
- No external links, no other platform branding, no in-game fullscreen button.
- Dev-only URL switches (`?scene=`, `?midnight`) are compiled out of production builds.
- Landscape 16:9; phones in portrait see a "turn your device" card.

## Store art (`store-art/`)

| File | Size | Use |
|---|---|---|
| `cover_landscape_1920x1080.png` | 1920×1080 | Landscape cover |
| `cover_portrait_800x1200.png` | 800×1200 | Portrait cover |
| `cover_square_800x800.png` | 800×800 | Square cover |
| `preview_landscape_1920x1080.mp4` | 1920×1080, 30 fps, no audio | Landscape preview |
| `preview_portrait_1080x1620.mp4` | 1080×1620 (2:3), 30 fps, no audio | Portrait preview |

Covers carry only the game's title. The videos are real gameplay, captured frame by frame, open on
the landscape cover's image, and have no cursor, black frames, text overlays or sound.
