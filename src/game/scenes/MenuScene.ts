import Phaser from 'phaser';
import { dropIn } from '../art/assets';
import { ensureBg, ensurePortrait } from '../art/registry';
import type { BgId } from '../art/backgrounds';
import { audio } from '../audio/AudioController';
import { CHAPTERS, STAGES } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { claimableCount, playerLevel } from '../systems/achievements';
import { Atmosphere, fadeIn, goTo, text } from '../ui/kit';
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

    stagePortrait(this, 1480, H + 20, save.team[0], ensurePortrait(this, save.team[0]), 0.78, 960, 860).setDepth(10);

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
      { id: 'rite', bg: 'lake', kicker: 'LANTERN RITE', title: 'New Luminaries', sub: 'Delphine, Evangeline and Hesper answer the Rite', go: () => goTo(this, 'Summon') },
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
      ['atlas', 'Atlas', () => openAtlas(this)],
      ['trophy', 'Achievements', () => openAchievements(this, () => this.refreshBadge())],
      ['roster', 'Troupe', () => goTo(this, 'Roster')],
      ['story', 'Story', () => goTo(this, 'Story')],
      ['notice', 'Notice', () => openNotice(this)],
      ['summon', 'Lantern Rite', () => goTo(this, 'Summon')],
      ['gear', 'Settings', () => this.openSettings()],
      ['gramophone', 'Gramophone', () => openGramophone(this)],
    ];
    const tw = 210;
    const th = 170;
    items.forEach(([icon, label, go], i) => {
      const x = 80 + tw / 2 + (i % 4) * (tw + 20);
      const y = 640 + th / 2 + Math.floor(i / 4) * (th + 20);
      const c = this.add.container(x, y).setDepth(40);
      c.add(this.add.nineslice(0, 0, 'ui:dark', undefined, tw, th, 12, 12, 12, 12).setAlpha(0.85));
      c.add(this.add.image(0, -20, `icon:${icon}`).setDisplaySize(84, 84));
      c.add(text(this, 0, 52, label, { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 1 }).setOrigin(0.5));
      if (icon === 'trophy') {
        this.badge = this.add.circle(tw / 2 - 22, -th / 2 + 22, 11, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
        c.add(this.badge);
      }
      c.setSize(tw, th).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => c.setScale(1.05));
      c.on('pointerout', () => c.setScale(1));
      c.on('pointerup', () => {
        audio.sfx('tap');
        go();
      });
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
