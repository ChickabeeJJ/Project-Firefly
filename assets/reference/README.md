# Reference footage (local only)

Place the reference recording at `assets/reference/reference-gameplay.mp4`.
It is git-ignored on purpose: it is third-party footage used only for study and
must never ship in the game bundle.

Regenerate the contact sheets with:

```sh
tools/contact-sheet.sh assets/reference/reference-gameplay.mp4 docs/reference-frames
```
