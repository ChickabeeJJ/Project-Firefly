# Higgsfield art brief — Firefly Nocturne

Everything the game needs from Higgsfield (or any image tool), for **all 16 Luminaries, all 16
Dimmed (enemies), 7 backgrounds and the optional banners/cards**. Each finished image goes in
`src/assets/art/<folder>/<id>.png`. The game picks it up automatically and falls back to the
code-drawn art when a file is missing (see `src/assets/art/README.md`).

---

## 1. Shared style (prepend this to every prompt)

> **STYLE:** painterly anime illustration, 1920s European art-deco city of Vellmoor, gouache and
> watercolour textures with clean ink linework, soft film grain, muted desaturated base colours
> lifted by warm lantern and firefly light (amber `#c9652f`, gold `#e2be6a`, firefly green
> `#dcef72`), gentle rim light, elegant stage-play mood, high detail, consistent character design.

**Negative prompt (all assets):** text, letters, watermark, logo, signature, UI, frame, border,
extra limbs, extra fingers, cropped feet, blurry, photorealistic, 3D render, modern clothing,
smartphone, any existing franchise character.

Keep the cast looking like one game:
- **One model and one seed family per set.** Do the characters first, then reuse a finished one
  as the style or character reference for the rest.
- **Same camera for every character:** full body, front three-quarter view, eye-level, standing
  pose, even studio lighting from the upper left, plain light-grey background. Then run
  **Remove Background** to get a transparent PNG.
- **Mood colour** shows as a small accent (badge, light or trim): Sun = warm amber/orange,
  Moon = cool teal/blue, Star = violet.

## 2. Deliverables and sizes

| Asset | Folder / filename | Size | Notes |
|---|---|---|---|
| Character key art (×16) | `characters/<id>.png` | ~1024×1792 (9:16), transparent | **Most important.** Used in the lobby, menu, Troupe, Rite, results and Finale cut-ins, and in battle if no `battle/` file exists |
| Character bust (×16) | `heads/<id>.png` | 512×512 | Face in the upper third, shoulders visible. Easiest route: crop it from the key art |
| Battle sprite (×16, optional) | `battle/<id>.png` | ~600×1000, transparent | Action-ready stance facing **right** (toward the enemies) |
| Enemy (×16) | `enemies/<id>.png` | ~800×1000, bosses ~1000×1300, transparent | Facing **left** (toward the troupe), full body |
| Background (×7) | `bg/<id>.jpg` | 1920×1080 | No characters. Leave the lower 40% as open floor or street for the battle line-up |
| Banners (optional) | `banners/rite.png`, `banners/chapter1…4.png` | 1800×720 | Lobby promo and menu carousel. Keep the left half calm, because the game prints the title there when no banner is supplied |
| Verse cards (×48, optional) | `cards/<verseId>.png` | 528×808 | Portrait illustration of the move; no text |

**Minimum set for a big visual jump:** the 16 `characters/`, 16 `enemies/` and 7 `bg/` files
(39 images). Heads can be cropped from the key art.

## 3. Luminaries (playable characters)

The fixed shape for each prompt is: **"STYLE + full-body character design of [description],
standing pose, front three-quarter view, plain light-grey background."** Each entry lists the
description to insert.

### Starter trio
| id | Name · title | Mood / rarity / role | Description to insert |
|---|---|---|---|
| `wren` | Wren Ashcombe · The Match-Seller | Sun ★4 Striker | cheerful teenage girl, copper-red bob with straight bangs, amber eyes, freckles, brown newsboy cap, mustard-yellow double-breasted coat, red neck scarf, cream shirt, brown trousers, holding up a single lit match like a torch, warm firelight on her face |
| `odile` | Odile Vance · The Night Physician | Moon ★4 Healer | calm young woman doctor, long silver-lilac hair parted in the middle, violet eyes, round glasses, long white lab coat over a dark slate shirt, teal scarf, holding a leather medical book, a faint moonlit teal glow |
| `bastian` | Bastian Hollis · The Umbrella Man | Star ★3 Guardian | stoic gentleman in his thirties, short black hair, neat moustache, grey-blue three-piece suit, black bowler hat with a burgundy band, burgundy tie, holding a large closed black umbrella like a sword, protective stance |

### Original roster
| id | Name · title | Mood / rarity / role | Description to insert |
|---|---|---|---|
| `marigold` | Marigold Pell · The Gilded Voice | Sun ★5 Support | glamorous jazz-age singer, golden wavy bob with a curl, black headband with a red feather, sparkling gold flapper dress with fringe, red heels, feather boa, singing pose with one arm raised, spotlight glow |
| `ichabod` | Ichabod Lark · The Vanishing Man | Moon ★5 Striker | elegant stage magician, slicked black hair, pale cyan eyes, monocle, tall black top hat with a purple band, deep purple tailcoat, white gloves, fanning a hand of playing cards, sly smirk, purple smoke wisps |
| `clementine` | Sister Clementine · Keeper of the Vigil | Star ★4 Healer | gentle young nun, short brown hair under a white coif, green eyes, navy habit with gold trim, holding a brass candle lantern, serene smile, candlelight halo |
| `rook` | Rook Delacroix · The Dockside Champion | Sun ★3 Striker | broad-shouldered dark-skinned dock boxer, short black hair, grey flat cap, brown waistcoat with rolled shirt sleeves, red boxing gloves, confident grin, fighting stance |
| `nell` | Nell Fairweather · The Night Flyer | Moon ★3 Striker | tomboyish aviator girl, short ginger hair, freckles, brown leather aviator cap with goggles pushed up, brown bomber jacket, white silk scarf blowing in the wind, adventurous grin |
| `ottoline` | Ottoline Grey · The Veiled Seer | Star ★4 Hexer | mysterious fortune teller, long black hair with straight bangs, golden eyes, sheer purple veil, plum dress with gold embroidery, holding a glowing crystal ball, knowing smirk |
| `augustin` | Augustin Bellweather · The Midnight Conductor | Moon ★5 Support | distinguished older orchestra conductor, swept-back white hair, white moustache, navy-black tailcoat with gold buttons, white bow tie, conducting baton raised mid-gesture, music notes of light |

### New Luminaries (this update)
| id | Name · title | Mood / rarity / role | Description to insert |
|---|---|---|---|
| `percival` | Percival Quill · The Ink-Stained Reporter | Sun ★4 Hexer | wry young newspaper reporter, short brown hair, round glasses, grey fedora with a black band and a press card, brown waistcoat over a cream shirt, blue tie, ink-stained fingers, holding a vintage box camera with a flashbulb |
| `delphine` | Delphine Moreau · The Midnight Violinist | Moon ★5 Striker | melancholy violinist, dark navy bob with straight bangs, sea-teal eyes, deep teal cloche hat with a gold band, dark teal drop-waist evening dress with gold art-deco trim, playing a violin under her chin, ghostly teal notes |
| `teddy` | Teddy Brass · The Boiler-Room Mechanic | Star ★3 Guardian | sunny young mechanic, curly ginger-blond hair, freckles, slate-blue beret, blue-grey work jacket with orange patches, cream shirt with sleeves rolled up, big brass wrench over one shoulder, soot smudge on one cheek |
| `evangeline` | Lady Evangeline Ash · The Parasol Heiress | Sun ★5 Healer | graceful aristocratic heiress, pale-gold wavy hair, rose eyes, cream cloche hat with a pink ribbon, blush-pink lace tea dress, pearl necklace, holding an open frilled lace parasol, teacup motif, soft sunny glow |
| `kit` | Kit Marlowe · The Rooftop Runner | Moon ★4 Striker | agile cat-burglar, short black hair swept to one side, gold eyes, dark plum beret, charcoal waistcoat, red scarf, fingerless gloves, crouched ready to leap, rooftop moonlight, playful smirk |
| `hesper` | Hesper Vale · The Star-Charting Astronomer | Star ★4 Support | dreamy astronomer, long dark-violet hair, lavender eyes, round glasses, indigo scholar's robe embroidered with gold constellations, brass telescope tucked under one arm, star chart scroll, tiny stars floating around her |

**Heads** (`heads/<id>.png`): crop the key art, or prompt *"STYLE + head-and-shoulders portrait
of [same description], facing the viewer, plain background"* with the key art as the character
reference.

## 4. The Dimmed (enemies)

The fixed shape for each prompt is: **"STYLE + full-body creature/character design of
[description], menacing but storybook-elegant, facing left, plain light-grey background."**
Then run Remove Background. Bosses should be noticeably larger and more ornate.

### Chapter 1–2 (existing)
| id | Name | Mood | Description to insert |
|---|---|---|---|
| `mothling` | Mothling | Star | small dusky-violet moth spirit with eye-spots on its wings and fuzzy antennae, faint violet glow, drawn toward light |
| `usher` | Hollow Usher | Moon | faceless theatre usher in a burgundy uniform with brass buttons and a pillbox cap, carrying a dim lantern, eerie blank mask face |
| `mannequin` | Clockwork Mannequin | Sun | shop-window dummy come to life, cream porcelain body with visible brass joints, a pearl necklace, a winding key in its back, jerky pose |
| `hound` | Ink Hound | Sun | dog-shaped creature made of dripping black ink, newspaper scraps caught in its fur, glowing amber eyes, ink puddles at its feet |
| `widow` | Velvet Widow | Moon | ghostly lady in a Victorian mourning gown of black velvet, wide hat with a veil, opera fan, translucent edges |
| `lampeater` | Lamp-Eater | Star | large moth monster with a glowing gas-lamp mantle as its heart, tattered grey wings, hungry mandibles |
| `curtaincaller` | The Curtain-Caller **(boss)** | Moon | towering spectre wrapped in heavy red theatre curtains with gold tassels, a hooked stage cane, smiling white theatre mask, footlights below |
| `gloam` | Madame Gloam **(boss)** | Star | regal sorceress of the Dimming, an enormous violet-black gown trailing smoke, a lace-veiled face with one glowing eye, a crown of extinguished candles, gaslights dying around her hem |

### Chapter 3 — The Drowned Docks (new)
| id | Name | Mood | Description to insert |
|---|---|---|---|
| `gullwraith` | Gull Wraith | Moon | spectral seagull with ragged fog-grey wings, a hollow skull-like beak, wisps of sea mist trailing from its feathers |
| `stevedore` | Rust Stevedore | Sun | hulking dock worker of riveted rusty iron plates, a flat cap welded on, a cargo hook for a hand, hauling a dripping crate |
| `siren` | Fog Siren | Star | pale drowned singer half-formed from fog, long seaweed hair, a tattered sailor's dress, mouth open in a haunting song, violet glow |
| `keeper` | Keeper Brine **(boss)** | Moon | huge drowned lighthouse keeper in a barnacled oilskin coat and sou'wester hat, a lighthouse lantern for a head shining black light, an anchor chain over his shoulder |

### Chapter 4 — The Clock Without Hands (new)
| id | Name | Mood | Description to insert |
|---|---|---|---|
| `cogspider` | Cog Spider | Sun | mechanical spider with a body of brass gears and mainspring legs, a ticking clock-face abdomen, a web of fine springs |
| `pendulum` | Pendulum Knight | Star | slender suit of art-deco armour with a swinging brass pendulum blade for an arm, a clock-dial visor, violet light in the joints |
| `chimewisp` | Chime Wisp | Moon | floating ghost of a small bronze bell, rippling sound waves, soft teal glow, little trailing tassels |
| `hourless` | The Hourless King **(boss)** | Star | colossal regal figure in a cathedral-clock crown, with a blank clock face missing its hands, a royal cape of gears and violet velvet, holding the torn clock hands as a sceptre, an aura of frozen time |

## 5. Backgrounds (`bg/<id>.jpg`, 1920×1080, no characters)

The fixed shape for each prompt is: **"STYLE + wide establishing background painting of
[description], cinematic composition, empty open ground in the lower third, no people."**

| id | Used for | Description to insert |
|---|---|---|
| `street` | Chapter 1 battles | foggy cobblestone street in a 1920s European city at night, art-deco shopfronts, broken and dimming gas lamps, a few fireflies |
| `theatre` | Chapter 2 battles | grand abandoned theatre stage, red velvet curtains, gilded balconies, dusty footlights, a single spotlight |
| `docks` | Chapter 3 battles | fog-drowned harbour at low tide, wooden piers, moored steamships, cranes and crates, a distant lighthouse shining dark, wet boards |
| `clocktower` | Chapter 4 battles | inside a gothic cathedral clock tower, giant brass gears and pendulums, a huge clock face seen from behind with no hands, violet moonlight through the glass |
| `parlour` | Lobby and menu | cosy 1920s parlour at night, tall arched windows with a sunset city skyline, red velvet curtains, a grand piano, a floor lamp, a patterned carpet, warm lamplight; keep the centre open for a standing character |
| `lake` | Lantern Rite (summon) | still dark lake under a starry sky, a lone lighthouse on the far shore, a mirror-like reflection, fireflies rising, mystical calm |
| `map` | Story chapter map | antique hand-drawn star map on dark parchment, constellations and a winding river of light, compass rose, very low contrast so text stays readable |

## 6. Optional extras

**Banners** (`banners/*.png`, 1800×720):
- `rite`: Delphine, Evangeline and Hesper posed together under a firefly-filled night sky, a
  Lantern Rite poster.
- `chapter1` … `chapter4`: a moody key-visual of each chapter's location, with its boss as a
  silhouette (Curtain-Caller, Madame Gloam, Keeper Brine, Hourless King).

**Verse cards** (`cards/<verseId>.png`, 528×808, portrait, no text): show the move being cast by
its Luminary, in comic-panel energy with halftone accents. The ids are:

```
wren: wren_strike, wren_kindle, wren_finale
odile: odile_tincture, odile_lullaby, odile_finale
bastian: bastian_brolly, bastian_bash, bastian_finale
marigold: marigold_swing, marigold_hot, marigold_finale
ichabod: ichabod_sleight, ichabod_flurry, ichabod_finale
clementine: clementine_vigil, clementine_sanctuary, clementine_finale
rook: rook_onetwo, rook_haymaker, rook_finale
nell: nell_strafe, nell_tailwind, nell_finale
ottoline: ottoline_omen, ottoline_tarot, ottoline_finale
augustin: augustin_accel, augustin_forte, augustin_finale
percival: percival_front, percival_flash, percival_finale
delphine: delphine_pizz, delphine_lament, delphine_finale
teddy: teddy_patch, teddy_spanner, teddy_finale
evangeline: evangeline_tea, evangeline_noblesse, evangeline_finale
kit: kit_dash, kit_smoke, kit_finale
hesper: hesper_guide, hesper_starfall, hesper_finale
```

## 7. Checklist before dropping files in

- [ ] Filename matches the id exactly (lower-case), in the right folder.
- [ ] Characters and enemies are transparent PNGs with the feet visible and a small margin.
- [ ] Characters face the viewer or the right; enemies face left.
- [ ] Backgrounds are 16:9 with no characters and no text.
- [ ] Each file is under ~1.5 MB (export as WebP if needed).
- [ ] Run `npm run dev` and check the lobby, Troupe, a battle and the Atlas.
