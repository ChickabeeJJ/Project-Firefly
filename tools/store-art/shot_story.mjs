const advance = (page) => page.evaluate(() => window.__game.scene.getScene('Cinematic').advance());
export default {
  0: async (page, step) => {
    await page.evaluate(() => { const g = window.__game; g.scene.getScenes(true).forEach((s) => s.scene.stop()); g.scene.start('Cinematic', { ids: ['ch2_open'], next: { scene: 'Lobby' } }); });
    await step(60);
    for (let k = 0; k < 200; k++) {
      await advance(page);
      await step(1);
      const n = await page.evaluate(() => window.__game.scene.getScene('Cinematic').cast?.length ?? 0);
      if (n >= 2) break;
      await step(24);
    }
  },
  62: async (page) => { await advance(page); },
};
