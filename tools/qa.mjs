// QA driver: node tools/qa.mjs <url> <outPrefix> <w> <h> <script.json?>
// Steps: [{wait:ms}|{click:[x,y]} (logical 1920x1080 coords)|{shot:name}|{eval:"js"}|{key:"Space"}]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [url, prefix, w = '1920', h = '1080', stepsFile] = process.argv.slice(2);
const steps = stepsFile ? JSON.parse(fs.readFileSync(stepsFile, 'utf8')) : [{ wait: 4000 }, { shot: 'start' }];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const touch = !!process.env.TOUCH;
const page = await browser.newPage({ viewport: { width: +w, height: +h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 3 : 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
if (process.env.SAVE_JSON) {
  const save = fs.readFileSync(process.env.SAVE_JSON, 'utf8');
  await page.addInitScript((data) => { try { localStorage.setItem('firefly-nocturne-save', data); } catch {} }, save);
}
await page.goto(url, { waitUntil: 'load' });
const toPage = async ([x, y]) => {
  const box = await page.evaluate(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  return [box.x + (x / 1920) * box.w, box.y + (y / 1080) * box.h];
};
for (const s of steps) {
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.until) {
    const t0 = Date.now();
    while (Date.now() - t0 < (s.timeout ?? 60000)) {
      if (await page.evaluate(s.until).catch(() => false)) break;
      await page.waitForTimeout(250);
    }
  }
  if (s.clickAt) { const pt = await page.evaluate(s.clickAt); if (pt) { const [px, py] = await toPage(pt); if (touch) await page.touchscreen.tap(px, py); else await page.mouse.click(px, py); } }
  if (s.click) { const [px, py] = await toPage(s.click); if (touch) await page.touchscreen.tap(px, py); else await page.mouse.click(px, py); }
  if (s.drag && s.skip) { const d = await page.evaluate('window.__drag'); s.drag = d; }
  if (s.drag) { const [ax, ay] = await toPage(s.drag[0]); const [bx, by] = await toPage(s.drag[1]); await page.mouse.move(ax, ay); await page.mouse.down(); await page.mouse.move((ax + bx) / 2, (ay + by) / 2, { steps: 5 }); await page.mouse.move(bx, by, { steps: 5 }); await page.mouse.up(); }
  if (s.key) await page.keyboard.press(s.key);
  if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
  if (s.shot) await page.screenshot({ path: `${prefix}${s.shot}.png` });
}
console.log(logs.filter((l) => !/crazygames|ERR_TUNNEL|ERR_PROXY|Failed to load resource/i.test(l)).join('\n') || 'no console errors');
await browser.close();
