import Phaser from 'phaser';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getCharacter } from '../data/characters';
import { CHAPTERS } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { frontierStage } from '../systems/progression';
import { RITE } from '../systems/gacha';
import { Atmosphere, Button, fadeIn, goTo, ornament, text } from '../ui/kit';

/** The Lamplighter's parlour: a character in a room, a Nixie clock, and the way onward. */
export class LobbyScene extends Phaser.Scene {
  private digits: Phaser.GameObjects.Text[] = [];
  private bubble?: Phaser.GameObjects.Container;

  constructor() {
    super('Lobby');
  }

  create(): void {
    fadeIn(this);
    this.digits = [];
    this.bubble = undefined;
    const save = saves.get();
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 60, fireflies: 7 });

    // Leader
    const leader = getCharacter(save.team[0]);
    const lead = this.add.image(660, H + 14, ensurePortrait(this, leader.id)).setOrigin(0.5, 1).setScale(0.8).setDepth(20);
    this.tweens.add({ targets: lead, scaleY: lead.scaleY * 1.008, y: lead.y - 4, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    lead.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 10 });
    lead.on('pointerup', () => this.say(leader.quote));
    this.add.image(660, H - 22, 'fx:shadow').setDisplaySize(380, 56).setDepth(19);

    this.buildClock();
    this.buildTitle();
    this.buildMenu();
    this.buildRight();
    this.buildCurrency();

    audio.play('lobby');
    this.time.delayedCall(900, () => this.say(save.totalPulls === 0 && save.glimmer >= RITE.cost * 10
      ? 'The fireflies are restless tonight. Shall we hold a Lantern Rite?'
      : 'The Dimming will not wait. Ready when you are.'));
  }

  private buildTitle(): void {
    text(this, 60, 54, 'FIREFLY NOCTURNE', { size: 54, font: 'display', bold: true, color: CSS.cream, spacing: 6, shadow: true }).setDepth(70);
    text(this, 64, 122, 'Vellmoor, 1929 · the night the lamps went out', { size: 26, italic: true, color: CSS.creamDim, shadow: true }).setDepth(70);
  }

  private buildCurrency(): void {
    const save = saves.get();
    const c = this.add.container(W - 250, 60).setDepth(70);
    c.add(this.add.nineslice(0, 0, 'ui:dark', undefined, 360, 64, 12, 12, 12, 12));
    c.add(this.add.image(-140, 0, 'icon:glimmer').setDisplaySize(48, 48));
    c.add(text(this, -106, 0, `${save.glimmer.toLocaleString('en-US')}`, { size: 32, bold: true, color: CSS.cream }).setOrigin(0, 0.5));
    c.add(text(this, 160, 0, 'Glimmer', { size: 22, italic: true, color: CSS.creamDim }).setOrigin(1, 0.5));
  }

  private buildMenu(): void {
    const items: { icon: string; label: string; go: () => void }[] = [
      { icon: 'story', label: 'Story', go: () => goTo(this, 'Story') },
      { icon: 'roster', label: 'Troupe', go: () => goTo(this, 'Roster') },
      { icon: 'summon', label: 'Rite', go: () => goTo(this, 'Summon') },
      { icon: 'gear', label: 'Settings', go: () => this.openSettings() },
    ];
    items.forEach((it, i) => {
      const y = 260 + i * 130;
      const c = this.add.container(92, y).setDepth(70);
      const plate = this.add.circle(0, 0, 46, 0x0c0e11, 0.55).setStrokeStyle(2, C.gold, 0.5);
      const ic = this.add.image(0, -4, `icon:${it.icon}`).setDisplaySize(58, 58);
      const lb = text(this, 0, 62, it.label, { size: 24, font: 'display', bold: true, color: CSS.cream, spacing: 2, shadow: true }).setOrigin(0.5);
      c.add([plate, ic, lb]);
      c.setSize(110, 130).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => c.setScale(1.06));
      c.on('pointerout', () => c.setScale(1));
      c.on('pointerup', () => {
        audio.sfx('tap');
        it.go();
      });
    });
  }

  private buildRight(): void {
    const save = saves.get();
    const stage = frontierStage(save);
    const chapter = CHAPTERS.find((c) => c.id === stage.chapter)!;
    const allClear = Object.keys(save.stars).length >= 16;
    const x = 1560;

    // Story card
    const sc = this.add.container(x, 380).setDepth(70);
    sc.add(this.add.nineslice(0, 0, 'ui:paper', undefined, 560, 340, 16, 16, 16, 16));
    sc.add(this.add.image(0, -100, ensureBg(this, stage.bg)).setDisplaySize(524, 120).setAlpha(0.95));
    sc.add(this.add.rectangle(0, -100, 524, 120, 0x000000, 0.35));
    sc.add(text(this, -244, -150, `CHAPTER ${stage.chapter}`, { size: 22, font: 'display', bold: true, color: CSS.goldLight, spacing: 4, shadow: true }));
    sc.add(text(this, -244, -120, chapter.name, { size: 40, font: 'display', bold: true, color: CSS.cream, shadow: true }));
    sc.add(text(this, -246, -22, allClear ? 'Every lamp is lit — replay any stage' : `Next · ${stage.id}`, { size: 24, color: CSS.paperSub }));
    sc.add(text(this, -246, 10, allClear ? '' : stage.name, { size: 32, font: 'display', bold: true, color: CSS.paperText, wrap: 500 }));
    new Button(this, x + 120, 380 + 110, {
      w: 280, h: 76, label: allClear ? 'Story' : 'Continue', style: 'amber',
      onClick: () => (allClear ? goTo(this, 'Story') : goTo(this, 'Formation', { stageId: stage.id })),
    }).setDepth(71);

    // Rite card
    const rc = this.add.container(x, 700).setDepth(70);
    const glow = this.add.image(0, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(620, 360).setAlpha(0.18);
    this.tweens.add({ targets: glow, alpha: 0.32, duration: 1400, yoyo: true, repeat: -1 });
    rc.add(glow);
    rc.add(this.add.nineslice(0, 0, 'ui:dark', undefined, 560, 230, 14, 14, 14, 14));
    rc.add(this.add.image(-200, 0, 'icon:summon').setDisplaySize(120, 120));
    rc.add(text(this, -120, -66, 'THE LANTERN RITE', { size: 30, font: 'display', bold: true, color: CSS.firefly, spacing: 2 }));
    const pulls = Math.floor(save.glimmer / RITE.cost);
    rc.add(text(this, -120, -18, pulls > 0 ? `Enough Glimmer for ${pulls} light${pulls > 1 ? 's' : ''}` : 'Clear stages to earn Glimmer', { size: 24, color: CSS.cream, wrap: 360 }));
    rc.setSize(560, 230).setInteractive({ useHandCursor: true });
    rc.on('pointerup', () => {
      audio.sfx('tap');
      goTo(this, 'Summon');
    });
    new Button(this, x + 120, 700 + 66, { w: 240, h: 66, label: 'Light', style: 'gold', size: 28, onClick: () => goTo(this, 'Summon') }).setDepth(71);

    ornament(this, x, 905, 520).setDepth(70);
    const stars = Object.values(save.stars).reduce((a, b) => a + b, 0);
    text(this, x, 950, `${stars} / 48 stars  ·  ${Object.keys(save.roster).length} / 10 Luminaries`, { size: 26, color: CSS.creamDim, shadow: true }).setOrigin(0.5).setDepth(70);
  }

  private buildClock(): void {
    // Nixie tubes on the desk, showing the player's real time.
    const x0 = 196;
    const y = 586;
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x140d09, 1).fillRoundedRect(x0 - 18, y + 30, 4 * 54 + 40, 26, 6);
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * 54 + (i > 1 ? 14 : 0);
      g.fillStyle(0x1a1410, 0.9).fillRoundedRect(x - 22, y - 44, 44, 78, 18);
      g.lineStyle(2, 0xc9a070, 0.35).strokeRoundedRect(x - 22, y - 44, 44, 78, 18);
      const d = text(this, x, y - 4, '0', { size: 54, color: '#ffae5a' }).setOrigin(0.5).setDepth(31);
      d.setShadow(0, 0, '#ff7a2a', 18, false, true);
      this.digits.push(d);
    }
    const colon = text(this, x0 + 2 * 54 - 13, y - 6, ':', { size: 44, color: '#ffae5a' }).setOrigin(0.5).setDepth(31);
    colon.setShadow(0, 0, '#ff7a2a', 14, false, true);
    this.tweens.add({ targets: colon, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.add.image(x0 + 90, y - 4, 'fx:glow').setTint(0xff8a3a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(360, 200).setAlpha(0.18).setDepth(29);
    this.tickClock();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });
  }

  private tickClock(): void {
    const d = new Date();
    const s = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    this.digits.forEach((t, i) => t.setText(s[i]));
  }

  private say(line: string): void {
    this.bubble?.destroy();
    const t = text(this, 0, 0, line, { size: 28, italic: true, color: CSS.paperText, wrap: 360 });
    const w = t.width + 44;
    const h = t.height + 30;
    const c = this.add.container(860, 300).setDepth(80);
    c.add([this.add.nineslice(0, 0, 'ui:paperPlain', undefined, w, h, 12, 12, 12, 12).setOrigin(0), t.setPosition(22, 15)]);
    c.add(this.add.triangle(30, h + 8, 0, 0, 28, 0, 0, 20, C.paper));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 220, yoyo: true, hold: 4200, onComplete: () => c.destroy() });
    this.bubble = c;
  }

  private openSettings(): void {
    this.scene.launch('Pause', { mode: 'settings', from: 'Lobby' });
    this.scene.pause();
  }
}
