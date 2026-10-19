const tap = (page) => page.evaluate(() => { const b = window.__game.scene.getScene('Battle'); const c = b.handOrder.find((id) => !b.cards.get(id)?.card.finale); if (c) b.tapCard(c); });
export default {
  6: tap, 18: tap, 30: tap,
  150: async (page) => {
    await page.evaluate(() => {
      const b = window.__game.scene.getScene('Battle');
      const views = [...b.views.values()];
      const caster = views.find((v) => v.unit.defId === 'cassian') ?? views.find((v) => v.unit.side === 'ally');
      const foes = views.filter((v) => v.unit.side === 'enemy' && v.unit.alive).map((v) => v.center);
      const key = b.textures.exists('hf:characters/cassian') ? 'hf:characters/cassian' : 'hf:battle/cassian';
      void b.fx.cutIn(key, 'The Thirteenth Stroke', 'Cassian Vire', 'The Clockmaker’s Heir', 0x8a1e22).then(() => b.fx.finaleVolley(caster.center, foes, 0xe8a33d, 'hf:ui/obj_watch', true));
    });
  },
};
