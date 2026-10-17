// Regenerates docs/asset-manifest.csv from the content data (all art is procedural).
// Usage: node tools/manifest.mjs
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const chars = [...read('src/game/data/characters.ts').matchAll(/^\s{4}id: '([a-z]+)',\n\s{4}name: '([^']+)'/gm)].map((m) => ({ id: m[1], name: m[2] }));
const verses = [...read('src/game/data/characters.ts').matchAll(/id: '([a-z]+_[a-z]+)', name: '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }));
const enemies = [...read('src/game/data/enemies.ts').matchAll(/id: '([a-z]+)', name: '([^']+)', mood: '[a-z]+', kind: '([a-z]+)'/g)].map((m) => ({ id: m[1], name: m[2], kind: m[3] }));
const icons = [...read('src/game/art/icons.ts').matchAll(/^  ([a-z0-9]+)(?:\(ctx|: )/gm)].map((m) => m[1]).filter((n) => !['ICONS', 'part'].includes(n));
const ui = [...read('src/game/art/uiTextures.ts').matchAll(/key: '([^']+)'/g)].map((m) => m[1]);
const head = 'asset_id,asset_name,category,source_tool,source_asset_id,original_file,gameplay_role,dimensions,pivot,scale,animation_states,palette,review_status,implementation_path,license_notes';
const rows = [];
const row = (...c) => rows.push(c.map((x) => (String(x).includes(',') ? `"${x}"` : x)).join(','));
const own = 'Original; generated in code (no third-party art)';
for (const c of chars) {
  row(`doll:${c.id}`, `${c.name} battle doll`, 'character', 'procedural (canvas)', '-', 'src/game/art/doll.ts', 'battle unit', '220x380', 'bottom-centre', '0.85 in battle', 'idle/lunge/hit/fallen (tweens)', `${c.id} palette`, 'approved (in-game QA)', 'registry.registerBaseArt', own);
  row(`head:${c.id}`, `${c.name} head badge`, 'ui', 'procedural (canvas)', '-', 'src/game/art/registry.ts', 'card badges, chips, dialogue', '160x160', 'centre', '0.2-1.2', '-', `${c.id} palette`, 'approved', 'registry.registerBaseArt', own);
  row(`portrait:${c.id}`, `${c.name} large portrait`, 'character', 'procedural (canvas)', '-', 'src/game/art/doll.ts', 'lobby, victory, rite reveal, roster', '528x912', 'bottom-centre', '0.6-1.0', 'breathing (tween)', `${c.id} palette`, 'approved', 'registry.ensurePortrait (lazy)', own);
  row(`pcard:${c.id}`, `${c.name} portrait card`, 'ui', 'procedural (canvas)', '-', 'src/game/art/cardArt.ts', 'formation, roster, rite results', '300x500', 'centre', '0.46-0.98', '-', `${c.id} palette`, 'approved', 'registry.ensurePortraitCard (lazy)', own);
}
for (const v of verses) row(`card:${v.id}`, `${v.name} verse art`, 'card', 'procedural (canvas)', '-', 'src/game/art/cardArt.ts', 'hand / slot / tooltip card art', '264x404', 'centre', '0.42-0.62', 'merge flash, lit glow', 'caster palette', 'approved', 'registry.registerBaseArt', own);
for (const e of enemies) row(`enemy:${e.kind}`, `${e.name}`, 'enemy', 'procedural (canvas)', '-', 'src/game/art/enemyArt.ts', 'battle unit', 'varies (280-460 wide)', 'bottom-centre', '0.85 (bosses 0.95)', 'idle/lunge/hit/dissolve (tweens)', 'Dimfolk ink + violet aura', 'approved', 'registry.registerBaseArt', own);
for (const b of ['street', 'theatre', 'parlour', 'lake', 'map']) row(`bg:${b}`, `${b} background`, 'environment', 'procedural (canvas)', '-', 'src/game/art/backgrounds.ts', 'scene backdrop', '1600x900 (shown 1920x1080)', 'centre', '1.2', 'fog drift (tween)', 'role palette', 'approved', 'registry.ensureBg (lazy)', own);
for (const i of icons) row(`icon:${i}`, `${i} icon`, 'icon', 'procedural (canvas)', '-', 'src/game/art/icons.ts', 'UI glyph', '96x96', 'centre', '0.2-1.2', '-', 'icon colour table', 'approved', 'registry.registerBaseArt', own);
for (const k of ui) row(k, k.replace(':', ' '), k.split(':')[0] === 'fx' ? 'effect' : 'ui', 'procedural (canvas)', '-', 'src/game/art/uiTextures.ts', 'UI / VFX', 'see source', 'centre', 'varies', '-', 'role palette', 'approved', 'registry.registerBaseArt', own);
row('audio:all', 'Music + SFX', 'audio', 'Web Audio synthesis', '-', 'src/game/audio/AudioController.ts', 'music tracks lobby/battle/boss/rite, 24 SFX', '-', '-', '-', '-', '-', 'approved', 'audio singleton', 'Original; synthesised at runtime');
row('font:cinzel', 'Cinzel 400/700 (latin)', 'font', '@fontsource/cinzel 5.3.0', '-', 'node_modules', 'display type', '-', '-', '-', '-', '-', 'approved', 'src/main.ts', 'SIL Open Font License 1.1');
row('font:spectral', 'Spectral 400/700 + italics (latin)', 'font', '@fontsource/spectral 5.3.0', '-', 'node_modules', 'body type, numbers', '-', '-', '-', '-', '-', 'approved', 'src/main.ts', 'SIL Open Font License 1.1');
fs.writeFileSync('docs/asset-manifest.csv', [head, ...rows].join('\n') + '\n');
console.log(`asset-manifest.csv: ${rows.length} rows (chars ${chars.length}, verses ${verses.length}, enemies ${enemies.length}, icons ${icons.length}, ui ${ui.length})`);
