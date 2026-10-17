import Phaser from 'phaser';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { Rng } from '../battle/rng';
import { MAX_RESONANCE } from '../battle/rules';
import { CHARACTERS, getCharacter } from '../data/characters';
import { C, CSS, H, RARITY_CSS, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { platform } from '../platform/PlatformAdapter';
import { performRite, RITE, riteCost, type RiteResult } from '../systems/gacha';
import { Atmosphere, Button, fadeIn, goTo, ornament, rarityStars, text, toast } from '../ui/kit';
import { PortraitCard } from '../ui/PortraitCard';

interface Floating {
  img: Phaser.GameObjects.Image;
  refl: Phaser.GameObjects.Image;
  res: RiteResult;
  open: boolean;
}

/** The Lantern Rite: anticipation (fireflies), tease (lantern colours), payoff (reveal). */
export class SummonScene extends Phaser.Scene {
  private ui!: Phaser.GameObjects.Container;
  private lanterns: Floating[] = [];
  private results: RiteResult[] = [];
  private stage: 'banner' | 'ritual' | 'reveal' | 'done' = 'banner';
  private skipBtn?: Phaser.GameObjects.Text;
  private revealAllBtn?: Button;
  private bigReveal = false;
  private prompt?: Phaser.GameObjects.Text;

  constructor() {
    super('Summon');
  }

  create(): void {
    fadeIn(this);
    this.lanterns = [];
    this.results = [];
    this.stage = 'banner';
    this.bigReveal = false;
    this.add.image(W / 2, H / 2, ensureBg(this, 'lake')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 30, fireflies: 10, dust: false });
    this.buildBanner();
    audio.play('rite');
  }

  // ------------------------------------------------------------------ banner

  private buildBanner(): void {
    const save = saves.get();
    const ui = this.add.container(0, 0).setDepth(50);
    ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x05070c, 0.35));
    const feat = ['augustin', 'ichabod', 'marigold'];
    feat.forEach((id, i) => {
      const p = this.add.image(1130 + i * 260, H + 60 + (i === 1 ? 0 : 30), ensurePortrait(this, id)).setOrigin(0.5, 1).setScale(i === 1 ? 0.86 : 0.76);
      if (i !== 2) p.setTint(0xb8b8c8);
      ui.add(p);
    });
    ui.add(this.add.image(1450, 420, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(900, 700).setAlpha(0.12));

    ui.add(new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }));
    const cur = this.add.container(W - 250, 60);
    cur.add(this.add.nineslice(0, 0, 'ui:dark', undefined, 360, 64, 12, 12, 12, 12));
    cur.add(this.add.image(-140, 0, 'icon:glimmer').setDisplaySize(48, 48));
    cur.add(text(this, -106, 0, save.glimmer.toLocaleString('en-US'), { size: 32, bold: true, color: CSS.cream }).setOrigin(0, 0.5));
    cur.add(text(this, 160, 0, 'Glimmer', { size: 22, italic: true, color: CSS.creamDim }).setOrigin(1, 0.5));
    ui.add(cur);

    const x = 100;
    ui.add(text(this, x, 190, 'THE LANTERN RITE', { size: 76, font: 'display', bold: true, color: CSS.firefly, spacing: 6, shadow: true }));
    ui.add(text(this, x + 4, 290, 'Light a lantern on Lake Vell. Someone in the dark will answer.', { size: 30, italic: true, color: CSS.cream, shadow: true }));
    ui.add(ornament(this, x + 380, 350, 760));
    const left = Math.max(1, RITE.pity - save.pity);
    const lines = [
      `★5  ${(RITE.rates[5] * 100).toFixed(0)}%   ·   ★4  ${(RITE.rates[4] * 100).toFixed(0)}%   ·   ★3  ${((1 - RITE.rates[5] - RITE.rates[4]) * 100).toFixed(0)}%`,
      `A ★5 Luminary is guaranteed within ${left} light${left > 1 ? 's' : ''}.`,
      `Duplicates raise Resonance (+6% HP and ATK, up to ${MAX_RESONANCE}).`,
      `Luminaries found: ${Object.keys(save.roster).length} / ${CHARACTERS.length}`,
    ];
    lines.forEach((l, i) => ui.add(text(this, x + 4, 390 + i * 50, l, { size: 28, color: i === 1 ? CSS.goldLight : CSS.cream, shadow: true })));
    ui.add(text(this, x + 4, 620, 'Featured: the Gilded Voice, the Vanishing Man and the Midnight Conductor.', { size: 24, italic: true, color: CSS.creamDim, wrap: 760 }));

    const one = new Button(this, x + 190, H - 140, { w: 340, h: 104, label: 'Light ×1', sub: `${riteCost(1)} Glimmer`, style: 'cream', size: 36, onClick: () => this.start(1) });
    const ten = new Button(this, x + 570, H - 140, { w: 380, h: 104, label: 'Light ×10', sub: `${riteCost(10)} Glimmer`, style: 'amber', size: 36, onClick: () => this.start(10) });
    if (save.glimmer < riteCost(1)) one.setAlpha(0.55);
    if (save.glimmer < riteCost(10)) ten.setAlpha(0.55);
    else this.tweens.add({ targets: ten, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ui.add([one, ten]);
    this.ui = ui;
  }

  private start(count: number): void {
    if (this.stage !== 'banner') return;
    const save = saves.get();
    const res = performRite(save, count, new Rng((Date.now() ^ (Math.random() * 1e9)) >>> 0));
    if (!res) {
      audio.sfx('deny');
      toast(this, 'Not enough Glimmer — clear stages to earn more', 'glimmer');
      return;
    }
    saves.commit();
    this.results = res;
    this.stage = 'ritual';
    this.tweens.add({ targets: this.ui, alpha: 0, duration: 300, onComplete: () => this.ui.destroy() });
    this.skipBtn = text(this, W - 70, 60, 'SKIP  ▸▸', { size: 30, font: 'display', bold: true, color: CSS.creamDim, spacing: 3 })
      .setOrigin(1, 0.5).setDepth(900).setInteractive({ useHandCursor: true });
    this.skipBtn.on('pointerup', () => {
      audio.sfx('back');
      this.showResults();
    });
    void this.ritual();
  }

  // ------------------------------------------------------------------ ritual

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  private async ritual(): Promise<void> {
    const jar = this.add.image(910, 700, 'rite:jar').setScale(0.7).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: jar, alpha: 1, duration: 400 });
    audio.sfx('riteRise');
    await this.wait(500);
    const best = Math.max(...this.results.map((r) => r.rarity));
    const tint = best === 5 ? 0xffd27a : best === 4 ? 0xc8a8ff : C.firefly;
    for (let i = 0; i < 46; i++) {
      const f = this.add.image(910, 690, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setDepth(60).setScale(0.6 + Math.random() * 0.8).setTint(i % 3 === 0 ? tint : 0xffffff);
      const o = { t: 0 };
      const turns = 1.5 + Math.random();
      const r0 = 20 + Math.random() * 40;
      const top = 120 + Math.random() * 260;
      this.tweens.add({
        targets: o, t: 1, duration: 1600 + Math.random() * 800, delay: i * 26, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const a = o.t * Math.PI * 2 * turns + i;
          const rr = r0 + o.t * 180;
          f.setPosition(960 + Math.cos(a) * rr, 690 - o.t * (690 - top) + Math.sin(a) * rr * 0.25);
        },
        onComplete: () => this.tweens.add({ targets: f, alpha: 0, duration: 400, onComplete: () => f.destroy() }),
      });
    }
    for (let k = 0; k < 4; k++) {
      this.time.delayedCall(k * 380, () => {
        const ring = this.add.image(940, 740, 'fx:ring').setTint(0xc8f0e0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(120, 30).setDepth(35);
        this.tweens.add({ targets: ring, displayWidth: 1100, displayHeight: 210, alpha: 0, duration: 1600, onComplete: () => ring.destroy() });
      });
    }
    await this.wait(1900);
    if (this.stage !== 'ritual') return;
    const flash = this.add.rectangle(W / 2, H / 2, W, H, tint, 0.6).setDepth(800).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });
    jar.destroy();
    const card = this.add.container(W / 2, H * 0.4).setDepth(700);
    const em = this.add.image(0, 0, 'ui:emblem').setScale(1.6).setAlpha(0.5);
    card.add([em, text(this, 0, -10, 'THE LANTERN RITE', { size: 88, font: 'display', bold: true, color: CSS.cream, spacing: 12, shadow: true }).setOrigin(0.5),
      text(this, 0, 76, 'someone answers the light', { size: 32, italic: true, color: CSS.creamDim }).setOrigin(0.5)]);
    card.setAlpha(0);
    this.tweens.add({ targets: em, angle: 45, duration: 2200 });
    this.tweens.add({ targets: card, alpha: 1, duration: 400, yoyo: true, hold: 1000, onComplete: () => card.destroy() });
    await this.wait(1900);
    if (this.stage !== 'ritual') return;
    this.dropLanterns();
  }

  private dropLanterns(): void {
    this.stage = 'reveal';
    const n = this.results.length;
    const slots: { x: number; y: number; s: number }[] = [];
    if (n === 1) slots.push({ x: 960, y: 760, s: 0.95 });
    else {
      for (let i = 0; i < 5; i++) slots.push({ x: 520 + i * 220, y: 650, s: 0.55 });
      for (let i = 0; i < 5; i++) slots.push({ x: 430 + i * 265, y: 830, s: 0.75 });
    }
    this.results.forEach((res, i) => {
      const p = slots[i];
      const img = this.add.image(p.x, -150, `rite:lantern${res.rarity}`).setScale(p.s).setDepth(60 + p.y / 100);
      const refl = this.add.image(p.x, p.y + 90 * p.s, `rite:lantern${res.rarity}`).setScale(p.s, -p.s * 0.6).setAlpha(0).setDepth(55).setTint(0x8aa0c0);
      this.tweens.add({ targets: img, y: p.y, duration: 1100 + i * 90, ease: 'Sine.easeOut', delay: i * 70 });
      this.tweens.add({ targets: refl, alpha: 0.28, duration: 600, delay: 900 + i * 90 });
      this.time.delayedCall(1300 + i * 90, () => {
        this.tweens.add({ targets: [img], y: p.y - 8, duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        audio.sfx(res.rarity === 5 ? 'reveal4' : 'firefly');
      });
      const f: Floating = { img, refl, res, open: false };
      img.setInteractive({ useHandCursor: true });
      img.on('pointerup', () => void this.open(f));
      this.lanterns.push(f);
    });
    const prompt = (this.prompt = text(this, W / 2, 470, n === 1 ? 'Tap the lantern' : 'Tap a lantern — or reveal them all', { size: 32, italic: true, color: CSS.cream, shadow: true }).setOrigin(0.5).setDepth(90).setAlpha(0));
    this.tweens.add({ targets: prompt, alpha: 1, delay: 1500, duration: 400 });
    if (n > 1) {
      this.revealAllBtn = new Button(this, W / 2, H - 70, { w: 320, h: 76, label: 'Reveal all', style: 'gold', size: 30, onClick: () => void this.revealAll() }).setDepth(90);
    }
  }

  private async open(f: Floating, quick = false): Promise<void> {
    if (f.open || this.bigReveal || this.stage !== 'reveal') return;
    f.open = true;
    f.img.disableInteractive();
    const { img, res } = f;
    this.tweens.killTweensOf(img);
    audio.sfx(res.rarity === 5 ? 'reveal5' : res.rarity === 4 ? 'reveal4' : 'reveal3');
    const glowColor = res.rarity === 5 ? 0xffc040 : res.rarity === 4 ? 0xb48cff : 0xffe0a0;
    const g = this.add.image(img.x, img.y, 'fx:glow').setTint(glowColor).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(80, 80).setDepth(70);
    this.tweens.add({ targets: g, displayWidth: 420, displayHeight: 420, alpha: 0, duration: 600, onComplete: () => g.destroy() });
    this.tweens.add({ targets: [img, f.refl], alpha: 0, y: img.y - 40, duration: 300 });
    const pc = new PortraitCard(this, img.x, img.y - 40, res.id, { badge: res.isNew ? 'NEW' : undefined }).setDepth(80).setScale(0);
    this.tweens.add({ targets: pc, scale: this.results.length === 1 ? 0.7 : img.scaleX * 0.62, duration: 320, ease: 'Back.easeOut' });
    if (res.rarity === 5 || this.results.length === 1) {
      if (!quick || res.rarity === 5) await this.showBig(res);
    } else {
      await this.wait(quick ? 120 : 260);
    }
    if (this.lanterns.every((l) => l.open)) {
      await this.wait(700);
      this.showResults();
    }
  }

  private async revealAll(): Promise<void> {
    this.revealAllBtn?.setEnabled(false);
    for (const f of this.lanterns) {
      if (this.stage !== 'reveal') return;
      if (!f.open) await this.open(f, true);
    }
  }

  private showBig(res: RiteResult): Promise<void> {
    this.bigReveal = true;
    const c = getCharacter(res.id);
    if (res.rarity === 5) platform.happytime();
    return new Promise((resolve) => {
      const root = this.add.container(0, 0).setDepth(850);
      const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.88).setInteractive();
      const sun = this.add.image(760, 520, 'fx:glow').setTint(res.rarity === 5 ? 0xffc040 : res.rarity === 4 ? 0x9a70e0 : 0xd8c8a0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(1100, 1100).setAlpha(0.6);
      const em = this.add.image(760, 470, 'ui:emblem').setScale(2.6).setAlpha(0.25);
      const p = this.add.image(760, H + 40, ensurePortrait(this, res.id)).setOrigin(0.5, 1).setScale(1.0).setAlpha(0);
      const name = text(this, 1260, 400, c.name, { size: 74, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0, 0.5);
      const title = text(this, 1264, 470, c.title, { size: 34, italic: true, color: RARITY_CSS[res.rarity] }).setOrigin(0, 0.5);
      const stars = rarityStars(this, 1360, 540, res.rarity, 40, res.rarity === 5 ? 0xf0c25a : res.rarity === 4 ? 0xb98ae0 : 0xa9b4c2);
      const note = res.isNew ? 'NEW LUMINARY' : res.refund ? `Resonance maxed — +${res.refund} Glimmer` : `Resonance ${res.resonance}`;
      const tag = text(this, 1264, 610, note, { size: 32, font: 'display', bold: true, color: res.isNew ? CSS.firefly : CSS.goldLight, spacing: 3 }).setOrigin(0, 0.5);
      const quote = text(this, 1264, 680, `“${c.quote}”`, { size: 28, italic: true, color: CSS.creamDim, wrap: 560 }).setOrigin(0, 0);
      const tap = text(this, W / 2, H - 50, 'Tap to continue', { size: 26, italic: true, color: CSS.muted }).setOrigin(0.5);
      root.add([shade, sun, em, p, name, title, stars, tag, quote, tap]);
      root.setAlpha(0);
      this.tweens.add({ targets: root, alpha: 1, duration: 260 });
      this.tweens.add({ targets: p, alpha: 1, y: H + 10, duration: 700, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: em, angle: 30, duration: 4000 });
      this.tweens.add({ targets: [name, title, tag, quote], x: '-=40', alpha: { from: 0, to: 1 }, duration: 500, delay: 200 });
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        this.tweens.add({ targets: root, alpha: 0, duration: 220, onComplete: () => { root.destroy(); this.bigReveal = false; resolve(); } });
      };
      this.time.delayedCall(600, () => shade.once('pointerup', close));
      this.time.delayedCall(4500, close);
    });
  }

  // ------------------------------------------------------------------ results

  private showResults(): void {
    if (this.stage === 'done') return;
    this.stage = 'done';
    this.skipBtn?.destroy();
    this.revealAllBtn?.destroy();
    this.prompt?.destroy();
    this.children.list.filter((o) => o.getData?.('keep') !== true && (o instanceof PortraitCard || (o instanceof Phaser.GameObjects.Image && o.texture.key.startsWith('rite:')))).forEach((o) => o.destroy());
    const root = this.add.container(0, 0).setDepth(900);
    root.add(this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.8));
    root.add(text(this, W / 2, 90, 'THE LIGHT ANSWERED', { size: 56, font: 'display', bold: true, color: CSS.firefly, spacing: 8 }).setOrigin(0.5));
    root.add(ornament(this, W / 2, 140, 600));
    const n = this.results.length;
    const order = [...this.results];
    order.forEach((res, i) => {
      const cols = n === 1 ? 1 : 5;
      const x = W / 2 + ((i % cols) - (cols - 1) / 2) * 300;
      const y = n === 1 ? 540 : 365 + Math.floor(i / cols) * 380;
      const pc = new PortraitCard(this, x, y + 60, res.id, { badge: res.isNew ? 'NEW' : undefined }).setScale(n === 1 ? 0.9 : 0.6).setAlpha(0);
      root.add(pc);
      this.tweens.add({ targets: pc, alpha: 1, y, duration: 320, delay: i * 70, ease: 'Cubic.easeOut' });
      if (!res.isNew) {
        const t = text(this, x, y + (n === 1 ? 256 : 170), res.refund ? `+${res.refund} Glimmer` : `Resonance ${res.resonance}`, { size: 24, bold: true, color: CSS.goldLight }).setOrigin(0.5).setAlpha(0);
        root.add(t);
        this.tweens.add({ targets: t, alpha: 1, delay: 400 + i * 70, duration: 300 });
      }
    });
    const news = this.results.filter((r) => r.isNew).length;
    if (news > 0) this.time.delayedCall(700, () => toast(this, `${news} new Luminar${news > 1 ? 'ies' : 'y'} joined the Troupe`, 'roster'));
    root.add(new Button(this, W / 2 - 220, H - 80, { w: 360, h: 88, label: 'Again', style: 'cream', onClick: () => this.scene.restart() }));
    root.add(new Button(this, W / 2 + 220, H - 80, { w: 360, h: 88, label: 'Team up', style: 'amber', onClick: () => goTo(this, 'Story') }));
  }
}
