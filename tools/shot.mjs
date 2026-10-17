// Screenshot helper for QA: node tools/shot.mjs <url> <out.png> [width] [height] [waitMs]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [url, out, w = '1350', h = '940', wait = '600'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log(logs.filter((l) => !l.includes('crazygames')).join('\n'));
await browser.close();
