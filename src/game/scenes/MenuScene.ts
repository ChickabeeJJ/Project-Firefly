import Phaser from 'phaser';
import { dropIn } from '../art/assets';
import { ensureBg, ensurePortrait } from '../art/registry';
import type { BgId } from '../art/backgrounds';
import { audio } from '../audio/AudioController';
import { CHAPTERS, STAGES } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { claimableCount, playerLevel } from '../systems/achievements';
import { Atmosphere, fadeIn, goTo, softPress, text } from '../ui/kit';
import { stagePortrait } from '../ui/LivingSprite';
import { openAchievements, openAtlas, openGramophone, openNotice, openProfile } from '../ui/Panels';

interface Slide {
  /** Drop-in id under src/assets/art/banners/. */
  id: string;
  bg: BgId;
  kicker: string;
  title: string;
  sub: string;
  go: () => void;
}

const BANNER_W = 900;
const BANNER_H = 360;

/** Options menu (the reference's "≡" screen): profile strip, banner carousel and a grid of features. */
export class MenuScene extends Phaser.Scene {
  private slides: Phaser.GameObjects.Container[] = [];
  private dotViews: Phaser.GameObjects.Arc[] = [];
  private index = 0;
  private badge?: Phaser.GameObjects.Arc;

  constructor() {
    super('Menu');
  }

  create(): void {
    fadeIn(this);
    this.slides = [];
    this.dotViews = [];
    this.index = 0;
    const save = saves.get();
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x07080a, 0x07080a, 0x07080a, 0x07080a, 0.92, 0.25, 0.92, 0.25);
    shade.fillRect(0, 0, W, H);
    new Atmosphere(this, { depth: 60, fireflies: 5 });

    stagePortrait(this, 1500, H + 30, save.team[0], ensurePortrait(this, save.team[0]), 0.78, 1040, 900).setDepth(10);

    this.buildHeader();
    this.buildCarousel();
    this.buildGrid();
    this.input.keyboard?.on('keydown-ESC', () => goTo(this, 'Lobby'));
  }

  private buildHeader(): void {
    const save = saves.get();
    const back = this.add.container(80, 78).setDepth(70);
    back.add([this.add.circle(0, 0, 40, 0x0c0e11, 0.6).setStrokeStyle(2, C.gold, 0.6), this.add.image(0, 0, 'icon:back').setDisplaySize(44, 44)]);
    back.setSize(90, 90).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => {
      audio.sfx('back');
      goTo(this, 'Lobby');
    });
    text(this, 150, 44, 'Lamplighter', { size: 40, font: 'display', bold: true, color: CSS.cream, shadow: true }).setDepth(70);
    text(this, 152, 96, `ID ${save.playerId}   ·   Lv ${playerLevel(save)}`, { size: 24, color: CSS.creamDim, shadow: true }).setDepth(70);
    const pill = this.add.container(560, 70).setDepth(70);
    pill.add([this.add.nineslice(0, 0, 'ui:btnCream', undefined, 150, 50, 14, 14, 14, 14), text(this, 0, 0, 'DETAIL', { size: 22, font: 'display', bold: true, color: CSS.paperText, spacing: 3 }).setOrigin(0.5)]);
    pill.setSize(150, 50).setInteractive({ useHandCursor: true });
    pill.on('pointerup', () => {
      audio.sfx('tap');
      openProfile(this);
    });
  }

  // ===================================================================== carousel

  private buildCarousel(): void {
    const save = saves.get();
    const slides: Slide[] = [
      { id: 'rite', bg: 'lake', kicker: 'LANTERN RITE', title: 'New Luminaries', sub: 'Ophelia, Valerian and Lucien answer the Rite', go: () => goTo(this, 'Summon') },
      ...CHAPTERS.map((ch): Slide => {
        const stages = STAGES.filter((s) => s.chapter === ch.id);
        const cleared = stages.filter((s) => s.id in save.stars).length;
        return {
          id: `chapter${ch.id}`, bg: stages[0].bg, kicker: `CHAPTER ${ch.id}`, title: ch.name,
          sub: `${ch.subtitle}  ·  ${cleared}/${stages.length} cleared`, go: () => goTo(this, 'Story'),
        };
      }),
    ];
    const cx = 80 + BANNER_W / 2;
    const cy = 190 + BANNER_H / 2;
    const frame = this.add.container(cx, cy).setDepth(40);
    const maskShape = this.make.graphics({}).fillStyle(0xffffff).fillRoundedRect(cx - BANNER_W / 2, cy - BANNER_H / 2, BANNER_W, BANNER_H, 14);
    const mask = maskShape.createGeometryMask();
    slides.forEach((s, i) => {
      const c = this.add.container(i === 0 ? 0 : BANNER_W, 0);
      const painted = dropIn(this, 'banners', s.id);
      if (painted) {
        c.add(this.add.image(0, 0, painted).setDisplaySize(BANNER_W, BANNER_H));
      } else {
        const img = this.add.image(0, 0, ensureBg(this, s.bg));
        img.setScale(Math.max(BANNER_W / img.width, BANNER_H / img.height));
        const grad = this.add.graphics();
        grad.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.1, 0.85, 0.85);
        grad.fillRect(-BANNER_W / 2, -BANNER_H / 2, BANNER_W, BANNER_H);
        c.add([img, grad,
          text(this, -BANNER_W / 2 + 40, 40, s.kicker, { size: 24, font: 'display', bold: true, color: CSS.firefly, spacing: 5, shadow: true }),
          text(this, -BANNER_W / 2 + 40, 74, s.title, { size: 52, font: 'display', bold: true, color: CSS.cream, shadow: true }),
          text(this, -BANNER_W / 2 + 42, 140, s.sub, { size: 24, italic: true, color: CSS.creamDim, shadow: true }),
        ]);
      }
      c.setMask(mask);
      frame.add(c);
      this.slides.push(c);
    });
    frame.add(this.add.rectangle(0, 0, BANNER_W, BANNER_H).setStrokeStyle(3, C.gold, 0.7));
    const hit = this.add.zone(cx, cy, BANNER_W, BANNER_H).setInteractive({ useHandCursor: true }).setDepth(41);
    let downX = 0;
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => (downX = p.x));
    hit.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = p.x - downX;
      if (Math.abs(dx) > 60) return this.show(this.index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      audio.sfx('tap');
      slides[this.index].go();
    });
    slides.forEach((_s, i) => {
      const d = this.add.circle(cx - (slides.length - 1) * 16 + i * 32, cy + BANNER_H / 2 + 30, 8, C.paper, i === 0 ? 1 : 0.3).setDepth(41);
      d.setInteractive({ useHandCursor: true }).on('pointerup', () => this.show(i, i > this.index ? 1 : -1));
      this.dotViews.push(d);
    });
    this.time.addEvent({ delay: 4500, loop: true, callback: () => this.show(this.index + 1, 1) });
  }

  private show(i: number, dir: 1 | -1): void {
    const n = this.slides.length;
    const next = ((i % n) + n) % n;
    if (next === this.index) return;
    const out = this.slides[this.index];
    const inn = this.slides[next];
    this.tweens.killTweensOf([out, inn]);
    inn.setX(dir * BANNER_W);
    this.tweens.add({ targets: out, x: -dir * BANNER_W, duration: 420, ease: 'Cubic.easeInOut' });
    this.tweens.add({ targets: inn, x: 0, duration: 420, ease: 'Cubic.easeInOut' });
    this.index = next;
    this.dotViews.forEach((d, k) => d.setFillStyle(C.paper, k === next ? 1 : 0.3));
  }

  // ===================================================================== grid

  private buildGrid(): void {
    const items: [string, string, () => void][] = [
      ['roster', 'Troupe', () => goTo(this, 'Roster')],
      ['story', 'Story', () => goTo(this, 'Story')],
      ['summon', 'Lantern Rite', () => goTo(this, 'Summon')],
      ['shop', 'Pawnshop', () => goTo(this, 'Shop')],
      ['atlas', 'Atlas', () => openAtlas(this)],
      ['trophy', 'Achievements', () => openAchievements(this, () => this.refreshBadge())],
      ['notice', 'Notice', () => openNotice(this)],
      ['profile', 'Profile', () => openProfile(this)],
      ['gramophone', 'Gramophone', () => openGramophone(this)],
      ['gear', 'Settings', () => this.openSettings()],
    ];
    const ART: Record<string, string> = { roster: 'troupe', story: 'story', shop: 'pawnshop', atlas: 'atlas', trophy: 'achievements', notice: 'notice', profile: 'profile', gramophone: 'gramophone', gear: 'settings' };
    const tw = 176;
    const th = 150;
    const gap = 14;
    const x0 = 80;
    const y0 = 650;
    text(this, x0, y0 - 34, 'OPTIONS', { size: 22, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0, 0.5).setDepth(40);
    this.add.rectangle(x0 + 150, y0 - 34, 5 * tw + 4 * gap - 150, 1, C.gold, 0.35).setOrigin(0, 0.5).setDepth(40);
    items.forEach(([icon, label, go], i) => {
      const x = x0 + tw / 2 + (i % 5) * (tw + gap);
      const y = y0 + th / 2 + Math.floor(i / 5) * (th + gap);
      const c = this.add.container(x, y).setDepth(40);
      const art = ART[icon] && this.textures.exists(`menu:${ART[icon]}`) ? `menu:${ART[icon]}` : null;
      if (art) {
        // Painted button: the art carries its own name plate.
        const halo = this.add.image(0, -10, 'fx:glow').setTint(0xffd49a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(190, 160).setAlpha(0);
        const im = this.add.image(0, 0, art).setDisplaySize(th + 14, th + 14);
        c.add([halo, im]);
        if (icon === 'trophy') {
          this.badge = this.add.circle(tw / 2 - 26, -th / 2 + 14, 9, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
          c.add(this.badge);
        }
        c.setSize(tw, th).setInteractive({ useHandCursor: true });
        c.on('pointerover', () => this.tweens.add({ targets: halo, alpha: 0.35, duration: 180 }));
        c.on('pointerout', () => this.tweens.add({ targets: halo, alpha: 0, duration: 160 }));
        softPress(c, go, 'tap', 1.05);
        c.setAlpha(0).setY(y + 18);
        this.tweens.add({ targets: c, alpha: 1, y, duration: 320, delay: 120 + i * 40, ease: 'Cubic.easeOut' });
        return;
      }
      const g = this.add.graphics();
      g.fillStyle(0x0b0c10, 0.6).fillRect(-tw / 2, -th / 2, tw, th);
      g.lineStyle(1.5, C.gold, 0.55).strokeRect(-tw / 2, -th / 2, tw, th);
      g.lineStyle(1, C.gold, 0.22).strokeRect(-tw / 2 + 6, -th / 2 + 6, tw - 12, th - 12);
      // corner lozenges
      for (const [cx, cy] of [[-tw / 2, -th / 2], [tw / 2, -th / 2], [-tw / 2, th / 2], [tw / 2, th / 2]]) {
        g.fillStyle(C.gold, 0.8).fillPoints([new Phaser.Math.Vector2(cx, cy - 5), new Phaser.Math.Vector2(cx + 5, cy), new Phaser.Math.Vector2(cx, cy + 5), new Phaser.Math.Vector2(cx - 5, cy)], true);
      }
      const halo = this.add.image(0, -18, 'fx:glow').setTint(0xffd49a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(150, 120).setAlpha(0.12);
      const ic = this.add.image(0, -18, `icon:${icon}`).setDisplaySize(72, 72).setAlpha(0.88);
      const lb = text(this, 0, 48, label.toUpperCase(), { size: 17, font: 'display', bold: true, color: CSS.cream, spacing: 3 }).setOrigin(0.5);
      if (lb.width > tw - 20) lb.setScale((tw - 20) / lb.width);
      const under = this.add.rectangle(0, 64, 0, 1.5, C.gold, 0.9);
      c.add([g, halo, ic, lb, under]);
      if (icon === 'trophy') {
        this.badge = this.add.circle(tw / 2 - 18, -th / 2 + 18, 9, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
        c.add(this.badge);
      }
      c.setSize(tw, th).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => {
        this.tweens.add({ targets: under, width: tw - 60, duration: 180, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: halo, alpha: 0.32, duration: 180 });
        ic.setAlpha(1);
      });
      c.on('pointerout', () => {
        this.tweens.add({ targets: under, width: 0, duration: 160 });
        this.tweens.add({ targets: halo, alpha: 0.12, duration: 160 });
        ic.setAlpha(0.88);
      });
      softPress(c, go, 'tap', 1.03);
      // staggered entrance
      c.setAlpha(0).setY(y + 18);
      this.tweens.add({ targets: c, alpha: 1, y, duration: 320, delay: 120 + i * 40, ease: 'Cubic.easeOut' });
    });
    this.refreshBadge();
  }

  private refreshBadge(): void {
    this.badge?.setVisible(claimableCount(saves.get()) > 0);
  }

  private openSettings(): void {
    this.scene.launch('Pause', { mode: 'settings', from: 'Menu' });
    this.scene.pause();
  }
}
