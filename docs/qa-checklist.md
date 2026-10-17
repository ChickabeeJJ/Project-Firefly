# QA checklist

Status key: ✅ verified in the running build · ⚠️ partially verified / known limitation · ⬜ not yet
verified (needs real hardware or the CrazyGames Preview tool).

Automated checks: `npm test` (25 unit tests), `npm run build`, and Playwright runs with
`tools/qa.mjs` (screenshots in `qa/screens/`, not committed).

## Gameplay

| Check | Status | Evidence |
|---|---|---|
| Main objective is clear | ✅ | 1-1 starts with a single hint; enemy intents visible |
| Primary interaction responds immediately | ✅ | tap → card flies to Beat slot (mouse and touch emulation) |
| Core loop complete | ✅ | plan → resolve → enemy acts → deal → … → Victory/Defeat → rewards → next stage |
| Difficulty changes understandable | ✅ | balance sim table (`npm run sim`); Battle Intel lists patterns |
| Success and failure states | ✅ | Victory (stars, EXP, Glimmer) and Defeat (save unchanged) both exercised |
| Restart leaves no stale entities/inputs | ✅ | scene state re-initialised in `create`; Retry from pause and results |
| No duplicate reward/completion events | ✅ | engine test: exactly one end event per battle; results applied once |
| No frame-rate dependent behaviour | ✅ | turn-based logic; real-time pacing fix for slow frames |
| Drag to move, undo, Lantern Hour, targeting | ✅ | browser runs (layout bug in hover/drag found and fixed) |
| Auto battle and 2× speed | ✅ | full stages auto-played to victory (1-1, 1-4, 1-8 boss) |

## Visuals

| Check | Status | Evidence |
|---|---|---|
| Art matches the style guide | ✅ | all scenes screenshotted at 1920×1080 |
| Silhouettes recognisable | ✅ | 10 Luminaries, 8 Dimfolk previewed side by side |
| No clipped sprites / blurry edges | ✅ | fixed: glow clipping on bosses, card portrait framing |
| Lighting/particles don't hide gameplay | ✅ | dim layer below units, VFX short |
| UI fits at tested sizes | ⚠️ | 1920×1080, 1280×720, 907×510 ✅; phone landscape 844×390 renders correctly but body text is ≈ 9 CSS px |
| No placeholder art | ✅ | every texture is final procedural art |
| Interactive controls have clear states | ✅ | hover/press/disabled on buttons; pulsing next Beat; lit Lantern |

## Technical

| Check | Status | Evidence |
|---|---|---|
| No missing assets | ✅ | no 404s except the blocked SDK host in the sandbox |
| No fatal console errors | ✅ | Playwright console/pageerror capture across all scenes |
| Relative paths only | ✅ | built bundle served from `/some/nested/` works |
| Scene transitions handled | ✅ | fade transitions, pause overlay, retreat |
| Audio starts and resumes | ⚠️ | context unlocks on first gesture, suspends when hidden; not listened to in the sandbox |
| Save data validated | ✅ | unit tests for garbage/unknown/clamped data |
| Production build completes | ✅ | `npm run build` |
| SDK lifecycle calls at correct points | ⚠️ | wired and guarded; SDK unreachable in sandbox — verify in CrazyGames Preview |
| Download limits | ✅ | 1.7 MB total, 16 files |

## Release

| Check | Status |
|---|---|
| Production build works outside dev server | ✅ |
| Gameplay begins promptly (new players land in 1-1) | ✅ |
| No custom fullscreen button | ✅ |
| CrazyGames Preview checks | ⬜ |
| Original name, art, copy | ✅ (see originality-decisions.md) |
| Submission metadata matches controls | ⬜ (controls: mouse/touch tap & drag; Space = Auto, Esc = Pause) |

## Known limitations / next steps

1. Phone-landscape text is small; consider a "large UI" layout for viewports under 900 CSS px.
2. Verify SDK v3 calls in the CrazyGames Preview tool (docs host blocked in sandbox).
3. Profile frame time on a low-end Android device; texture memory can be cut by rendering card
   art at 0.75× if needed.
4. Audio mix needs a listening pass on real speakers.
