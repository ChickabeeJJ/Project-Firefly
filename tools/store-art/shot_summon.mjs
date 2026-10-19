export default {
  4: async (page, step) => { await page.mouse.move(1600, 1000); await page.mouse.down(); await step(2); await page.mouse.up(); },
  62: async (page, step) => {
    await page.mouse.move(960, 820); await page.mouse.down(); await step(1);
    for (let y = 820; y >= 560; y -= 20) { await page.mouse.move(960 + (820 - y) * 0.08, y); await step(1); }
    await page.mouse.up();
  },
};
