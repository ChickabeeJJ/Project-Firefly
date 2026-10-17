# Technical architecture

Phaser 3.90.0 + TypeScript 5.9 + Vite 7 (all pinned). Logical canvas 1920×1080, `Scale.FIT`,
WebGL with Canvas fallback. No other engine or UI framework.

## Layout

```
src/
  main.ts                 Phaser config, scene list, audio unlock on first gesture
  preview.ts              dev-only art preview (preview.html; not in the build)
  game/
    config/theme.ts       palette roles, fonts, sizes
    data/                 characters, enemies, stages, shared content types
    battle/               PURE TS battle simulation (no Phaser imports)
      engine.ts           BattleEngine: planning API + resolveRound() → BattleEvent[]
      hand.ts             merge / normalise rules
      rules.ts            every tunable number (ranks, lantern, moods, scaling)
      stats.ts, rng.ts    level scaling, deterministic PRNG
      describe.ts         tooltip text generated from effect data
      autoplay.ts         heuristic used by Auto and by the balance simulation
    systems/              progression (rewards, EXP, unlocks), gacha (Lantern Rite)
    persistence/          versioned save schema + validation, SaveService
    platform/             PlatformAdapter (CrazyGames SDK v3, guarded)
    audio/                AudioController (Web Audio synth: music sequencer + SFX)
    art/                  procedural art generators → Phaser textures (registry.ts)
    ui/                   kit (text, buttons, toasts, atmosphere), CardView, UnitView,
                          BattleFx, PortraitCard, Dialogue
    scenes/               Boot, Lobby, Story, Formation, Battle, Pause, Result, Summon, Roster
tests/                    vitest: hand, engine, meta (saves/progression/gacha), balance sim
tools/                    contact-sheet.sh, qa.mjs (Playwright driver), manifest.mjs
```

## Logic / presentation split

`BattleEngine` is the single source of truth. Planning calls (`cast`, `move`, `lightLantern`,
`undo`, `setTarget`) mutate state immediately and return merge steps so the hand can animate.
`resolveRound()` runs the whole round (player queue → enemy intents → upkeep → next deal) and
returns an ordered event list. `BattleScene.playEvents` animates those events; nothing in the
scene changes game state. This guarantees:

- no double starts / double completions (one `victory` or `defeat` event per battle — tested);
- input is ignored while `busy` (resolution, intro) or after the end;
- determinism for a given seed (tested), which also makes balance simulation possible.

## Scene flow

```
Boot ─► (new player) Battle 1-1 ─► Result ─► Lobby
     └► (returning)  Lobby ─► Story ─► [Dialogue] ─► Formation ─► Battle ─► Result
                         ├─► Summon (Lantern Rite)      Battle ⇄ Pause (pause / intel)
                         ├─► Roster                     Lobby  ⇄ Pause (settings)
```

## Platform (CrazyGames SDK v3)

`index.html` loads `https://sdk.crazygames.com/crazygames-sdk-v3.js`. `PlatformAdapter`:

- `init()` awaits `SDK.init()` with a 2.5 s timeout; any failure or `environment === 'disabled'`
  leaves the adapter offline, and every call becomes a no-op.
- `loadingStart/Stop` wrap boot; `gameplayStart` only when a battle becomes interactive;
  `gameplayStop` on pause, results, retreat; `happytime` on 3-star wins and ★5 reveals.
- Mute follows `game.settings.muteAudio` and `addSettingsChangeListener`.
- Saves go through `SDK.data` when available, else `localStorage`.

API surface was cross-checked against two published third-party wrappers
(`@adlad/plugin-crazygames`, `@wonderlandengine/upsdk-provider-crazygames`) because
docs.crazygames.com is not reachable from the build sandbox. **Verify against the live docs and
the CrazyGames Preview tool before submission.**

## Persistence

`SaveData` v1: Glimmer, roster (level/exp/resonance), team, best stars per stage, pity, settings,
seen hints. `sanitizeSave` validates every field (unknown ids dropped, numbers clamped, team
repaired). Battle state is never saved; results are applied once, on the final event.

## Timing

Game config `fps: { min: 3, panicMax: 0 }` so slow devices keep real-time pacing (Phaser's
default clamps deltas for the first 120 frames, which caused multi-second slow motion at low
frame rates). Gameplay logic is turn-based and timing-independent; animation durations use the
scene clock so 2× speed scales everything consistently.

## Budgets (measured)

| Metric | Value |
|---|---|
| Production build | 1.7 MB, 16 files (≈ 400 KB gzipped JS) |
| Initial download | same (no lazy asset files) — well under the 20 MB mobile target |
| Procedural textures at first battle | 133 textures, 10.7 MPx (≈ 41 MB RGBA GPU) |
| Boot → battle scene (dev server, sandbox software GL) | 2.4 s |
| Unit tests | 25 passing (`npm test`) |

The QA sandbox renders with software WebGL (≈ 3–9 fps at 1920×1080), so frame-time numbers from
it are not representative; profile on real hardware before release.
