import Phaser from 'phaser';
import { fitPortrait } from '../art/assets';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { Rng } from '../battle/rng';
import { MAX_RESONANCE } from '../battle/rules';
import { getCharacter } from '../data/characters';
import { C, CSS, H, RARITY_COLOR, RARITY_CSS, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { platform } from '../platform/PlatformAdapter';
import { BANNERS, bannerOdds, bannerTimeLeft, getBanner, performRite, RITE, riteCost, type Banner, type RiteResult } from '../systems/gacha';
import { Atmosphere, Button, fadeIn, goTo, ornament, rarityStars, softPress, text, toast } from '../ui/kit';
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
  private bannerId = 'dove';

  constructor() {
    super('Summon');
  }

  create(data: { banner?: string } = {}): void {
    fadeIn(this);
    this.lanterns = [];
    this.results = [];
    this.stage = 'banner';
    this.bigReveal = false;
    this.bannerId = data.banner ?? this.bannerId;
    this.add.image(W / 2, H / 2, ensureBg(this, 'lake')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 30, fireflies: 10, dust: false });
    this.buildBanner();
    audio.play('rite');
  }

  // ------------------------------------------------------------------ banner

  /** Banner screen in the reference's layout: tabs left, title centre, featured art right. */
  private buildBanner(): void {
    const save = saves.get();
    const banner = getBanner(this.bannerId);
    const ui = this.add.container(0, 0).setDepth(50);
    this.ui = ui;

    // Featured art, cut in from the right with a slow drift.
    if (banner.featured) {
      const fc = getCharacter(banner.featured);
      const rays = this.add.image(1450, 420, 'fx:glow').setTint(Phaser.Display.Color.HexStringToColor(fc.palette.secondary).color).setDisplaySize(1300, 1300).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      ui.add(rays);
      const art = fitPortrait(this.add.image(1480, H + 70, ensurePortrait(this, fc.id)).setOrigin(0.5, 1), 1.1, 1230, 1100);
      ui.add(art);
      const ax = art.x;
      art.setX(ax + 80).setAlpha(0);
      this.tweens.add({ targets: art, x: ax, alpha: 1, duration: 900, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: art, y: art.y - 10, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      [3, 4, 5].forEach((r, i) => {
        const l = this.add.image(1180 + i * 230, 470 - (i % 2) * 90, `rite:lantern${r}`).setScale(0.85 - i * 0.1);
        ui.add(l);
        this.tweens.add({ targets: l, y: l.y - 18, duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    }
    // Left fade so the tabs and title read over the art.
    const fade = this.add.graphics();
    fade.fillGradientStyle(0x05070c, 0x05070c, 0x05070c, 0x05070c, 0.82, 0, 0.82, 0);
    fade.fillRect(0, 0, 1100, H);
    fade.fillGradientStyle(0x05070c, 0x05070c, 0x05070c, 0x05070c, 0, 0, 0.75, 0.75);
    fade.fillRect(0, H - 300, W, 300);
    ui.add(fade);

    // Top bar: back + home, currency.
    const back = this.add.image(70, 64, 'icon:back').setDisplaySize(52, 52).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => {
      audio.sfx('back');
      goTo(this, 'Lobby');
    });
    const home = this.add.rectangle(170, 64, 40, 40).setStrokeStyle(4, 0xe8dcc0, 0.9).setInteractive({ useHandCursor: true });
    home.on('pointerup', () => {
      audio.sfx('back');
      goTo(this, 'Lobby');
    });
    ui.add([back, home, this.add.rectangle(170, 64, 14, 14, 0xe8dcc0, 0.9)]);
    const pill = this.add.container(W - 260, 60);
    pill.add(this.add.rectangle(0, 0, 360, 52, 0x0b0c10, 0.55).setStrokeStyle(1, 0xe8dcc0, 0.35));
    pill.add(this.add.image(-150, -2, 'icon:glimmer').setDisplaySize(54, 54));
    pill.add(text(this, 40, 0, save.glimmer.toLocaleString('en-US'), { size: 28, bold: true, color: CSS.cream }).setOrigin(0.5));
    const plus = this.add.image(150, 0, 'icon:plus').setDisplaySize(26, 26).setInteractive({ useHandCursor: true });
    plus.on('pointerup', () => goTo(this, 'Shop'));
    pill.add(plus);
    ui.add(pill);

    // Banner tabs.
    BANNERS.forEach((b, i) => ui.add(this.bannerTab(b, 180, 250 + i * 150, b.id === banner.id)));

    // Title, R1999-style: huge display type with a gilt slash.
    const words = banner.name.toUpperCase().split(' ');
    const l1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    const t1 = text(this, 420, 400, l1, { size: 96, font: 'display', bold: true, color: '#f2ead8', spacing: 4, shadow: true });
    const t2 = text(this, 520, 510, l2, { size: 112, font: 'display', bold: true, color: '#f2ead8', spacing: 4, shadow: true });
    const slash = this.add.rectangle(520, 625, Math.max(t2.width, 420), 3, C.gold, 0.9).setOrigin(0, 0.5).setScale(0, 1);
    const blurb = text(this, 524, 650, banner.blurb, { size: 24, italic: true, color: CSS.creamDim, wrap: 640, shadow: true });
    ui.add([t1, t2, slash, blurb]);
    [t1, t2].forEach((t, i) => {
      t.setAlpha(0).setX(t.x - 30);
      this.tweens.add({ targets: t, alpha: 1, x: t.x + 30, duration: 700, delay: 150 + i * 120, ease: 'Cubic.easeOut' });
    });
    this.tweens.add({ targets: slash, scaleX: 1, duration: 900, delay: 350, ease: 'Cubic.easeOut' });

    // Featured name plate.
    if (banner.featured) {
      const fc = getCharacter(banner.featured);
      const nx = W - 470;
      // A smoky backing so the name plate reads over the art.
      const plate = this.add.graphics();
      plate.fillGradientStyle(0x05070c, 0x05070c, 0x05070c, 0x05070c, 0, 0.78, 0, 0.78).fillRect(nx - 160, 350, 640, 230);
      ui.add(plate);
      ui.add(this.add.rectangle(nx - 30, 420, 80, 80, 0x2a1a10, 0.85).setStrokeStyle(1, C.gold, 0.6));
      ui.add(this.add.image(nx - 30, 420, `icon:${fc.mood}`).setDisplaySize(56, 56));
      const nm = text(this, nx + 30, 404, fc.name.split(' ')[0], { size: 64, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0, 0.5);
      ui.add(nm);
      ui.add(rarityStars(this, nx + 30 + 5 * 22, 462, fc.rarity, 34, 0xf0c25a));
      const mag = this.add.image(nx + 30 + 5 * 44 + 30, 462, 'icon:eye').setDisplaySize(34, 34).setInteractive({ useHandCursor: true });
      mag.on('pointerup', () => goTo(this, 'Roster', { charId: fc.id }));
      ui.add(mag);
      if (banner.featured4?.length) {
        ui.add(text(this, nx - 70, 530, 'Rate up ★4', { size: 22, color: CSS.goldLight }).setOrigin(0, 0.5));
        banner.featured4.forEach((id, k) => {
          ui.add(this.add.circle(nx + 120 + k * 76, 530, 32, 0x0b0c10, 0.7).setStrokeStyle(2, 0xb98ae0, 0.9));
          ui.add(this.add.image(nx + 120 + k * 76, 530, `head:${id}`).setDisplaySize(60, 60));
        });
      }
    }

    // Rate-up ribbon, time left and pity.
    const rib = this.add.graphics();
    rib.fillStyle(0xc8a24a, 0.22).fillRect(420, 820, 900, 58);
    rib.fillStyle(0xc8a24a, 0.5).fillRect(420, 820, 6, 58);
    ui.add(rib);
    ui.add(this.add.image(468, 849, 'icon:star4').setDisplaySize(36, 36).setTint(0xf2e2b0));
    ui.add(text(this, 500, 849, banner.featured ? 'DISPLAYED LUMINARIES RATE UP!!' : 'EVERY LUMINARY ANSWERS THE LIGHT', { size: 40, italic: true, bold: true, color: '#f4ead4', spacing: 2, shadow: true }).setOrigin(0, 0.5));
    const ms = bannerTimeLeft();
    const left = Math.max(1, RITE.pity - save.pity);
    const timeStr = banner.featured ? `Time Left: ${Math.floor(ms / 864e5)}D ${Math.floor(ms / 36e5) % 24}H ${Math.floor(ms / 6e4) % 60}M` : 'Always open';
    ui.add(text(this, 430, 912, timeStr, { size: 26, color: CSS.cream }).setOrigin(0, 0.5));
    ui.add(this.add.rectangle(760, 912, W - 820, 1, 0xe8dcc0, 0.4).setOrigin(0, 0.5));
    ui.add(text(this, 430, 946, `★5 guaranteed within ${left} light${left > 1 ? 's' : ''}`, { size: 22, italic: true, color: CSS.goldLight }).setOrigin(0, 0.5));

    // Bottom-left utility buttons.
    ([['Pawnshop', () => goTo(this, 'Shop')], ['Details', () => this.details()], ['Record', () => this.record()]] as const).forEach(([label, fn], i) => {
      const b = this.add.container(130 + i * 190, 1010);
      b.add(this.add.rectangle(0, 0, 170, 60, 0x0b0c10, 0.55).setStrokeStyle(1.5, 0xe8dcc0, 0.55));
      b.add(text(this, 0, 0, label, { size: 26, color: CSS.cream }).setOrigin(0.5));
      b.setSize(170, 60).setInteractive({ useHandCursor: true });
      softPress(b, fn, 'tap', 1.04);
      ui.add(b);
    });

    // Summon buttons.
    ui.add(this.summonButton(1150, 1000, 1, false));
    ui.add(this.summonButton(1600, 1000, 10, true));
  }

  private bannerTab(b: Banner, x: number, y: number, on: boolean): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 240;
    const h = 120;
    const maskG = this.make.graphics({}).fillRect(x - w / 2, y - h / 2, w, h);
    let thumb: Phaser.GameObjects.Image;
    if (b.featured) {
      // Face-and-shoulders crop of the featured art.
      thumb = this.add.image(0, 0, ensurePortrait(this, b.featured));
      thumb.setScale(w / (thumb.width * 0.42)).setOrigin(0.45, 0.2);
    } else {
      thumb = this.add.image(0, 0, ensureBg(this, 'lake')).setDisplaySize(w * 1.4, h * 1.4);
    }
    thumb.setMask(maskG.createGeometryMask());
    c.add(this.add.rectangle(0, 0, w + 8, h + 8, 0x000000, 0.5));
    c.add(thumb);
    c.add(this.add.rectangle(0, 0, w, h, 0x000000, on ? 0.05 : 0.45).setStrokeStyle(1, 0xe8dcc0, on ? 0.8 : 0.3));
    const tag = text(this, -w / 2 + 8, -h / 2 + 18, b.tag, { size: 22, color: '#fff4e4' }).setOrigin(0, 0.5);
    c.add(this.add.rectangle(-w / 2, -h / 2 + 18, tag.width + 18, 30, b.featured ? 0xc8501e : 0x3a6a4a, 0.92).setOrigin(0, 0.5));
    c.add(tag);
    c.add(text(this, -w / 2 + 8, h / 2 - 20, b.name, { size: 21, color: CSS.cream, shadow: true }).setOrigin(0, 0.5));
    if (on) c.add(this.add.rectangle(0, h / 2 + 10, w, 4, C.gold, 0.9));
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    softPress(c, () => {
      if (!on) this.scene.restart({ banner: b.id });
    }, 'tap', 1.03);
    return c;
  }

  private summonButton(x: number, y: number, count: number, primary: boolean): Phaser.GameObjects.Container {
    const save = saves.get();
    const cost = riteCost(count);
    const c = this.add.container(x, y);
    const w = 420;
    const h = 84;
    const g = this.add.graphics();
    if (primary) g.fillGradientStyle(0xe0763a, 0xd2602a, 0xb84a1e, 0xb84a1e, 1).fillRect(-w / 2, -h / 2, w, h);
    else g.fillStyle(0xf6f0e4, 1).fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1.5, primary ? 0xffc89a : 0xc8b890, 0.9).strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    c.add(g);
    c.add(this.add.image(-w / 2 + 44, 0, 'icon:glimmer').setDisplaySize(52, 52));
    c.add(text(this, -w / 2 + 76, 0, `${cost}`, { size: 24, bold: true, color: primary ? '#fff2e0' : CSS.paperText }).setOrigin(0, 0.5));
    c.add(text(this, w / 2 - 24, 0, `Summon ×${count}`, { size: 38, color: primary ? '#fff6ec' : CSS.paperText }).setOrigin(1, 0.5));
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    if (save.glimmer < cost) c.setAlpha(0.6);
    else if (primary) this.tweens.add({ targets: c, scale: 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    softPress(c, () => this.start(count), 'tap', 1.03);
    return c;
  }

  /** Modal shell shared by Details and Record. */
  private modal(title: string, w: number, h: number): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0).setDepth(600);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    c.add(shade);
    const g = this.add.graphics();
    g.fillStyle(0x0a0c12, 0.96).fillRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
    g.lineStyle(1.5, C.gold, 0.55).strokeRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
    c.add(g);
    c.add(text(this, W / 2, H / 2 - h / 2 + 46, title, { size: 34, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0.5));
    c.add(ornament(this, W / 2, H / 2 - h / 2 + 84, 380));
    const close = new Button(this, W / 2 + w / 2 - 44, H / 2 - h / 2 + 44, { w: 60, h: 60, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: () => {
      this.tweens.add({ targets: c, alpha: 0, duration: 180, onComplete: () => c.destroy() });
    } });
    c.add(close);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 220 });
    return c;
  }

  /** Details: rules plus each Luminary's own odds on this banner. */
  private details(): void {
    const banner = getBanner(this.bannerId);
    const save = saves.get();
    const c = this.modal('POOL DETAILS', 1400, 900);
    const x0 = W / 2 - 660;
    let y = H / 2 - 330;
    const rules = [
      `★5  ${(RITE.rates[5] * 100).toFixed(0)}%   ·   ★4  ${(RITE.rates[4] * 100).toFixed(0)}%   ·   ★3  ${((1 - RITE.rates[5] - RITE.rates[4]) * 100).toFixed(0)}%   per light`,
      `A ★5 is guaranteed on the ${RITE.pity}th light without one (shared across banners).`,
      banner.featured ? 'Displayed Luminaries take half of the results of their rarity.' : 'Every Luminary of a rarity is equally likely.',
      `Duplicates raise Resonance (+6% HP and ATK, up to ${MAX_RESONANCE}); beyond that, +${RITE.dupeRefund} Glimmer.`,
    ];
    rules.forEach((r, i) => c.add(text(this, x0, y + i * 36, r, { size: 23, color: i === 0 ? CSS.goldLight : CSS.cream })));
    y += rules.length * 36 + 24;
    const odds = bannerOdds(banner);
    ([5, 4, 3] as const).forEach((r) => {
      const rows = odds.filter((o) => o.rarity === r);
      c.add(this.add.rectangle(x0 - 10, y + 4, 1340, 36, RARITY_COLOR[r], 0.16).setOrigin(0, 0.5));
      c.add(rarityStars(this, x0 + 10 + r * 12, y + 4, r, 22, RARITY_COLOR[r]));
      y += 42;
      rows.forEach((o, i) => {
        const ch = getCharacter(o.id);
        const col = i % 3;
        const px = x0 + col * 445;
        const py = y + Math.floor(i / 3) * 52 + 18;
        const owned = !!save.roster[o.id];
        const feat = o.id === banner.featured || banner.featured4?.includes(o.id);
        c.add(this.add.image(px + 22, py, `head:${o.id}`).setDisplaySize(44, 44));
        c.add(this.add.image(px + 60, py, `icon:${ch.mood}`).setDisplaySize(24, 24));
        const nm = text(this, px + 80, py, ch.name, { size: 21, color: feat ? CSS.goldLight : owned ? CSS.cream : CSS.creamDim, bold: feat }).setOrigin(0, 0.5);
        if (nm.width > 230) nm.setScale(230 / nm.width);
        c.add(nm);
        c.add(text(this, px + 420, py, `${(o.p * 100).toFixed(2)}%`, { size: 20, bold: true, color: RARITY_CSS[r] }).setOrigin(1, 0.5));
      });
      y += Math.ceil(rows.length / 3) * 52 + 16;
    });
    c.add(text(this, W / 2, H / 2 + 420, 'Gold names are rated up on this banner · faded names are not yet in your Troupe', { size: 19, italic: true, color: CSS.muted }).setOrigin(0.5));
  }

  /** Record: the most recent lights. */
  private record(): void {
    const save = saves.get();
    const c = this.modal('RECORD', 1100, 860);
    const x0 = W / 2 - 500;
    const y0 = H / 2 - 320;
    [['Luminary', 0], ['Rarity', 470], ['Banner', 640], ['Time', 860]].forEach(([l, dx]) => c.add(text(this, x0 + (dx as number), y0, l as string, { size: 22, bold: true, color: CSS.creamDim })));
    c.add(this.add.rectangle(x0 - 10, y0 + 26, 1020, 1, 0xe8dcc0, 0.3).setOrigin(0, 0.5));
    const rows = save.history.slice(0, 14);
    if (!rows.length) c.add(text(this, W / 2, H / 2, 'No lanterns lit yet.', { size: 26, italic: true, color: CSS.muted }).setOrigin(0.5));
    rows.forEach((h, i) => {
      const y = y0 + 60 + i * 44;
      const ch = getCharacter(h.id);
      c.add(text(this, x0, y, ch.name, { size: 22, color: RARITY_CSS[h.rarity as 3 | 4 | 5] }).setOrigin(0, 0.5));
      c.add(text(this, x0 + 470, y, '★'.repeat(h.rarity), { size: 22, color: RARITY_CSS[h.rarity as 3 | 4 | 5] }).setOrigin(0, 0.5));
      c.add(text(this, x0 + 640, y, getBanner(h.b).name, { size: 20, color: CSS.cream }).setOrigin(0, 0.5));
      c.add(text(this, x0 + 860, y, new Date(h.t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), { size: 20, color: CSS.creamDim }).setOrigin(0, 0.5));
    });
    c.add(text(this, W / 2, H / 2 + 390, `Showing the last ${rows.length} of ${save.totalPulls} lights`, { size: 19, italic: true, color: CSS.muted }).setOrigin(0.5));
  }

  private start(count: number): void {
    if (this.stage !== 'banner') return;
    const save = saves.get();
    const res = performRite(save, count, new Rng((Date.now() ^ (Math.random() * 1e9)) >>> 0), this.bannerId);
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
      this.events.emit('rite-skip');
      this.showResults();
    });
    void this.ritual();
  }

  // ------------------------------------------------------------------ ritual

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  /**
   * The draw: the player swipes up to strike the wick of a single lantern; its flame colour
   * teases the best rarity (white, violet, gold), then it bursts into one lantern per light.
   */
  private async ritual(): Promise<void> {
    const best = Math.max(...this.results.map((r) => r.rarity));
    const tint = best === 5 ? 0xffc040 : best === 4 ? 0xb48cff : 0xfff0c8;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x020308, 0).setDepth(35);
    this.tweens.add({ targets: veil, fillAlpha: 0.6, duration: 600 });
    const lantern = this.add.image(W / 2, H + 200, 'rite:lantern3').setScale(1.1).setDepth(60).setTint(0x6a6a72);
    this.tweens.add({ targets: lantern, y: 600, duration: 1100, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: lantern, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    audio.sfx('riteRise');
    await this.wait(1100);
    if (this.stage !== 'ritual') return;

    // Swipe up to strike the match.
    const hint = text(this, W / 2, 900, 'Swipe up to light the wick', { size: 32, italic: true, color: CSS.cream, shadow: true }).setOrigin(0.5).setDepth(90).setAlpha(0);
    const arrow = this.add.image(W / 2, 830, 'icon:back').setAngle(90).setDisplaySize(48, 48).setDepth(90).setAlpha(0);
    this.tweens.add({ targets: [hint, arrow], alpha: 1, duration: 400 });
    this.tweens.add({ targets: arrow, y: 790, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    await new Promise<void>((resolve) => {
      let downY: number | null = null;
      let done = false;
      const sparks: Phaser.GameObjects.Image[] = [];
      const finish = () => {
        if (done) return;
        done = true;
        this.input.off('pointerdown', onDown);
        this.input.off('pointermove', onMove);
        this.input.off('pointerup', onUp);
        sparks.forEach((sp) => sp.destroy());
        resolve();
      };
      const onDown = (p: Phaser.Input.Pointer) => {
        downY = p.y;
      };
      const onMove = (p: Phaser.Input.Pointer) => {
        if (downY === null || !p.isDown) return;
        const sp = this.add.image(p.x, p.y, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setDepth(95).setScale(0.6).setTint(0xffe0a0);
        sparks.push(sp);
        this.tweens.add({ targets: sp, alpha: 0, scale: 0.1, y: p.y + 30, duration: 500, onComplete: () => sp.destroy() });
        if (downY - p.y > 160) finish();
      };
      const onUp = (p: Phaser.Input.Pointer) => {
        if (downY !== null && downY - p.y > 90) finish();
        downY = null;
      };
      this.input.on('pointerdown', onDown);
      this.input.on('pointermove', onMove);
      this.input.on('pointerup', onUp);
      // A plain tap also works after a moment, so nobody gets stuck.
      this.time.delayedCall(2600, () => this.input.once('pointerup', finish));
      this.events.once('rite-skip', finish);
    });
    hint.destroy();
    arrow.destroy();
    if (this.stage !== 'ritual') return;

    // The wick catches: white, then the tease colour, with a held breath for ★4/★5.
    audio.sfx('lantern');
    lantern.clearTint();
    const flame = this.add.image(lantern.x, lantern.y, 'fx:glow').setTint(0xfff0c8).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(60, 60).setDepth(61);
    this.tweens.add({ targets: flame, displayWidth: 420, displayHeight: 420, alpha: 0.85, duration: 500, ease: 'Cubic.easeOut' });
    await this.wait(600);
    if (best >= 4) {
      flame.setTint(tint);
      this.cameras.main.shake(best === 5 ? 900 : 500, best === 5 ? 0.006 : 0.003);
      for (let k = 0; k < (best === 5 ? 3 : 2); k++) {
        this.time.delayedCall(k * 260, () => {
          const ring = this.add.image(lantern.x, lantern.y, 'fx:ring').setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(80, 80).setDepth(62);
          this.tweens.add({ targets: ring, displayWidth: 900, displayHeight: 900, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
        });
      }
      if (best === 5) {
        // Gold light shafts turn slowly behind the lantern.
        for (let k = 0; k < 8; k++) {
          const ray = this.add.rectangle(lantern.x, lantern.y, 26, 1400, 0xffd27a, 0.12).setBlendMode(Phaser.BlendModes.ADD).setDepth(34).setAngle(k * 22.5);
          this.tweens.add({ targets: ray, angle: ray.angle + 40, alpha: 0, duration: 2200, onComplete: () => ray.destroy() });
        }
      }
      audio.sfx(best === 5 ? 'reveal5' : 'reveal4');
      await this.wait(best === 5 ? 1100 : 700);
    }
    if (this.stage !== 'ritual') return;

    // It rises out of frame trailing sparks, and the sky answers with one light per pull.
    this.tweens.add({ targets: [lantern, flame], y: -260, duration: 900, ease: 'Cubic.easeIn' });
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 25, () => {
        const sp = this.add.image(lantern.x + (Math.random() - 0.5) * 60, lantern.y + 60, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setTint(i % 2 ? tint : 0xffffff).setDepth(59);
        this.tweens.add({ targets: sp, y: sp.y + 120 + Math.random() * 120, alpha: 0, duration: 900, onComplete: () => sp.destroy() });
      });
    }
    await this.wait(900);
    lantern.destroy();
    flame.destroy();
    const flash = this.add.rectangle(W / 2, H / 2, W, H, tint, 0.5).setDepth(800).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });
    this.tweens.add({ targets: veil, fillAlpha: 0.25, duration: 800 });
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
      this.tweens.add({
        targets: img, y: p.y, duration: 1100 + i * 90, ease: 'Sine.easeOut', delay: i * 70,
        onUpdate: (tw) => {
          if (tw.progress < 0.85 && Math.random() < 0.5) {
            const tr = this.add.image(img.x + (Math.random() - 0.5) * 30 * p.s, img.y - 60 * p.s, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setTint(res.rarity === 5 ? 0xffc040 : res.rarity === 4 ? 0xb48cff : 0xfff0c8).setDepth(58).setScale(0.5);
            this.tweens.add({ targets: tr, alpha: 0, y: tr.y - 40, duration: 500, onComplete: () => tr.destroy() });
          }
        },
      });
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
    if (res.rarity >= 4 && !quick) {
      // A held breath: the lantern trembles before it opens.
      this.tweens.add({ targets: img, angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: res.rarity === 5 ? 7 : 3 });
      await this.wait(res.rarity === 5 ? 520 : 280);
    }
    const target = this.results.length === 1 ? 0.7 : img.scaleX * 0.62;
    const pc = new PortraitCard(this, img.x, img.y - 40, res.id, { badge: res.isNew ? 'NEW' : undefined }).setDepth(80).setScale(0.02, target);
    // Card flips in edge-on, with a rarity flare behind it.
    const flare = this.add.image(img.x, img.y - 40, 'fx:glow').setTint(glowColor).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(260, 380).setDepth(79).setAlpha(res.rarity >= 4 ? 0.8 : 0.4);
    this.tweens.add({ targets: flare, alpha: 0, duration: 900, delay: 200, onComplete: () => flare.destroy() });
    this.tweens.add({ targets: pc, scaleX: target, duration: 340, ease: 'Back.easeOut' });
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
      const p = fitPortrait(this.add.image(760, H + 40, ensurePortrait(this, res.id)).setOrigin(0.5, 1), 1.0, 1060).setAlpha(0);
      const name = text(this, 1260, 400, c.name, { size: 74, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0, 0.5);
      const title = text(this, 1264, 470, c.title, { size: 34, italic: true, color: RARITY_CSS[res.rarity] }).setOrigin(0, 0.5);
      const stars = rarityStars(this, 1360, 540, res.rarity, 40, res.rarity === 5 ? 0xf0c25a : res.rarity === 4 ? 0xb98ae0 : 0xa9b4c2);
      const note = res.isNew ? 'NEW LUMINARY' : res.refund ? `Resonance maxed — +${res.refund} Glimmer` : `Resonance ${res.resonance}`;
      const tag = text(this, 1264, 610, note, { size: 32, font: 'display', bold: true, color: res.isNew ? CSS.firefly : CSS.goldLight, spacing: 3 }).setOrigin(0, 0.5);
      const quote = text(this, 1264, 680, `“${c.quote}”`, { size: 28, italic: true, color: CSS.creamDim, wrap: 560 }).setOrigin(0, 0);
      const tap = text(this, W / 2, H - 50, 'Tap to continue', { size: 26, italic: true, color: CSS.muted }).setOrigin(0.5);
      root.add([shade, sun, em]);
      if (res.rarity === 5) {
        for (let k = 0; k < 10; k++) {
          const ray = this.add.rectangle(760, 520, 34, 1600, 0xffd27a, 0.08).setBlendMode(Phaser.BlendModes.ADD).setAngle(k * 18);
          root.add(ray);
          this.tweens.add({ targets: ray, angle: ray.angle + 180, duration: 24000, repeat: -1 });
        }
      }
      root.add([p, name, title, stars, tag, quote, tap]);
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
