// Deterministic capture: Phaser's loop is put to sleep and stepped exactly 1/30 s per frame.
// usage: node cap.mjs <name> <query> <frames> [warmMs]   (shots defined below by name)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [name, query, framesArg, warmArg] = process.argv.slice(2);
const FRAMES = +framesArg, WARM = +(warmArg ?? 6000);
const out = `${process.env.V}/frames_${name}`;
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.addInitScript(() => {
  const stars = {}; for (let c = 1; c <= 4; c++) for (let i = 1; i <= 8; i++) stars[`${c}-${i}`] = 3;
  const roster = {}; for (const id of ['wren','odile','bastian','ichabod','teddy','ottoline','marigold','hesper','augustin','kit','evangeline','delphine','clementine','percival','rook','nell','cassian']) roster[id] = { level: 30, insight: 2, resonance: 1 };
  const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const team = (new URLSearchParams(location.search).get('team') || 'cassian,odile,bastian,evangeline').split(',');
  const s = { version: 2, glimmer: 24000, roster, team, stars, pity: 3, totalPulls: 12, settings: { music: 0, sfx: 0, track: 'lobby' },
    hints: ['cine:prologue','tutorialDone','cast','beats','merge','firefly','finale','lantern','intent','move','egg:thirteenth'], playerId: 318290457,
    seen: [], claimed: [], items: { dust: 50000, sovereign: 50000, moth: 10, velvet: 10, tide: 5, spring: 5 }, savedAt: 1e13, history: [],
    signIn: { month, days: [now.getDate()], milestones: [] } };
  localStorage.setItem('firefly-nocturne-save-local', JSON.stringify(s));
});
await page.goto(`http://localhost:5173/?${query}`);
await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).some((s) => s.scene.key !== 'Boot'), null, { timeout: 180000, polling: 300 });
await page.waitForTimeout(WARM);
// Hide the cursor and freeze real time.
await page.addStyleTag({ content: '*{cursor:none!important}' });
await page.evaluate(() => { const g = window.__game; g.loop.sleep(); window.__t = performance.now(); });
const step = (n = 1) => page.evaluate((n) => { const g = window.__game; for (let i = 0; i < n; i++) { window.__t += 1000 / 30; g.step(window.__t, 1000 / 30); } }, n);
// Script hooks: frame -> action
const hooks = (await import(`${process.env.V}/shot_${name}.mjs`)).default;
await step(+(process.env.WARMSTEPS ?? 90));
for (let f = 0; f < FRAMES; f++) {
  if (hooks[f]) await hooks[f](page, step);
  await step(1);
  await page.screenshot({ path: `${out}/${String(f).padStart(4, '0')}.png` });
  if (f % 60 === 0) console.log(name, f);
}
await browser.close();
