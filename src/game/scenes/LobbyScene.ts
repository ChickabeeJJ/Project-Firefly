import Phaser from 'phaser';
import { dropIn } from '../art/assets';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { CHARACTERS, getCharacter } from '../data/characters';
import { CHAPTERS, STAGES } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { claimableCount, playerLevel, totalStars } from '../systems/achievements';
import { frontierStage } from '../systems/progression';
import { RITE } from '../systems/gacha';
import { Atmosphere, fadeIn, goTo, text, toast } from '../ui/kit';
import { livingPortrait } from '../ui/LivingSprite';
import { openAchievements, openAtlas, openGramophone, openNotice, openProfile } from '../ui/Panels';

/** The newest Luminaries, advertised on the lobby banner. */
const FEATURED = ['delphine', 'evangeline', 'hesper'];

/**
 * The Lamplighter's parlour, laid out like the reference lobby: profile badge top-left, shortcut
 * column on the left, the leader centre stage, currencies top-right, and the way onward on the right.
 */
export class LobbyScene extends Phaser.Scene {
  private digits: Phaser.GameObjects.Text[] = [];
  private bubble?: Phaser.GameObjects.Container;
  private ui!: Phaser.GameObjects.Container;
  private glimmerText!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private hidden = false;

  constructor() {
    super('Lobby');
  }

  create(): void {
    fadeIn(this);
    this.digits = [];
    this.dots = [];
    this.bubble = undefined;
    this.hidden = false;
    const save = saves.get();
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 60, fireflies: 7 });

    // Leader, centre stage. Painted portraits stand nearly full height.
    const leader = getCharacter(save.team[0]);
    this.add.image(860, H - 24, 'fx:shadow').setDisplaySize(420, 60).setDepth(19);
    const lead = livingPortrait(this, 860, H + 20, ensurePortrait(this, leader.id), 0.92, 1000, 900).setDepth(20);
    lead.hit.setInteractive({ useHandCursor: true });
    lead.hit.on('pointerup', () => {
      if (this.hidden) return this.toggleUi();
      lead.pose(14, 0.03, 160, 120);
      this.say(leader.quote);
    });

    this.ui = this.add.container(0, 0).setDepth(70);
    this.buildBadge();
    this.buildLeftColumn();
    this.buildCurrency();
    this.buildRight();
    this.buildClock();
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.hidden && over.length === 0) this.toggleUi();
    });

    audio.play(save.settings.track);
    this.time.delayedCall(900, () => this.say(save.totalPulls === 0 && save.glimmer >= RITE.cost * 10
      ? 'The fireflies are restless tonight. Shall we hold a Lantern Rite?'
      : 'The Dimming will not wait. Ready when you are.'));
  }

  // ===================================================================== helpers

  /** Round icon button with a label underneath (and an optional red notice dot). */
  private iconButton(x: number, y: number, icon: string, label: string, onClick: () => void, size = 84, dot = false): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const plate = this.add.circle(0, 0, size / 2, 0x0c0e11, 0.6).setStrokeStyle(2, C.gold, 0.55);
    const ic = this.add.image(0, 0, `icon:${icon}`).setDisplaySize(size * 0.62, size * 0.62);
    c.add([plate, ic]);
    if (label) c.add(text(this, 0, size / 2 + 18, label, { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 1, shadow: true }).setOrigin(0.5));
    if (dot) {
      const d = this.add.circle(size * 0.34, -size * 0.34, 10, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
      c.add(d);
      this.dots.push(d);
    }
    c.setSize(size + 20, size + (label ? 40 : 10)).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => c.setScale(1.07));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerup', () => {
      audio.sfx('tap');
      onClick();
    });
    this.ui.add(c);
    return c;
  }

  private refreshDots(): void {
    const any = claimableCount(saves.get()) > 0;
    for (const d of this.dots) d.setVisible(any);
    this.glimmerText.setText(saves.get().glimmer.toLocaleString('en-US'));
  }

  // ===================================================================== top-left

  private buildBadge(): void {
    const save = saves.get();
    const c = this.add.container(40, 34);
    const plate = this.add.nineslice(0, 0, 'ui:dark', undefined, 440, 112, 12, 12, 12, 12).setOrigin(0).setAlpha(0.85);
    const ring = this.add.circle(62, 56, 42, 0x15120f).setStrokeStyle(4, C.gold, 0.9);
    const lv = text(this, 62, 48, `${playerLevel(save)}`, { size: 40, font: 'display', bold: true, color: CSS.goldLight }).setOrigin(0.5);
    const lvl = text(this, 62, 82, 'LV', { size: 16, bold: true, color: CSS.creamDim, spacing: 3 }).setOrigin(0.5);
    const name = text(this, 124, 22, 'Lamplighter', { size: 34, font: 'display', bold: true, color: CSS.cream });
    const id = text(this, 126, 68, `ID  ${save.playerId}`, { size: 22, color: CSS.creamDim, spacing: 1 });
    c.add([plate, ring, lv, lvl, name, id]);
    c.setSize(440, 112).setInteractive({ useHandCursor: true });
    c.input!.hitArea.setTo(0, 0, 440, 112);
    c.on('pointerup', () => {
      audio.sfx('tap');
      openProfile(this);
    });
    this.ui.add(c);

    // Shortcut row under the badge.
    const row: [string, () => void][] = [
      ['profile', () => openProfile(this)],
      ['gramophone', () => openGramophone(this)],
      ['gear', () => this.openSettings()],
    ];
    row.forEach(([icon, go], i) => this.iconButton(80 + i * 86, 200, icon, '', go, 64));
  }

  private buildLeftColumn(): void {
    const items: [string, string, () => void, boolean?][] = [
      ['notice', 'Notice', () => openNotice(this)],
      ['trophy', 'Tasks', () => openAchievements(this, () => this.refreshDots()), true],
      ['atlas', 'Atlas', () => openAtlas(this)],
      ['roster', 'Troupe', () => goTo(this, 'Roster')],
    ];
    items.forEach(([icon, label, go, dot], i) => this.iconButton(86, 330 + i * 128, icon, label, go, 84, !!dot));
    this.iconButton(220, 330, 'menu', 'Menu', () => goTo(this, 'Menu'), 84);
    this.iconButton(220, 458, 'eye', 'Hide', () => this.toggleUi(), 84);
    this.refreshDotsLater();
  }

  private refreshDotsLater(): void {
    this.time.delayedCall(0, () => this.refreshDots());
  }

  private toggleUi(): void {
    this.hidden = !this.hidden;
    this.tweens.killTweensOf(this.ui);
    this.tweens.add({ targets: this.ui, alpha: this.hidden ? 0 : 1, duration: 260 });
    this.ui.each((o: Phaser.GameObjects.GameObject) => {
      if (o.input) o.input.enabled = !this.hidden;
    });
    this.bubble?.destroy();
    if (this.hidden) toast(this, 'Tap anywhere to bring the menu back', 'eye');
  }

  // ===================================================================== top-right

  private buildCurrency(): void {
    const save = saves.get();
    const pill = (x: number, icon: string, value: string, onPlus: () => void) => {
      const c = this.add.container(x, 70);
      c.add(this.add.nineslice(0, 0, 'ui:dark', undefined, 280, 60, 12, 12, 12, 12).setAlpha(0.85));
      c.add(this.add.image(-112, 0, `icon:${icon}`).setDisplaySize(44, 44));
      const t = text(this, -82, 0, value, { size: 28, bold: true, color: CSS.cream }).setOrigin(0, 0.5);
      c.add(t);
      const plus = this.add.container(112, 0);
      plus.add([this.add.circle(0, 0, 20, C.amber), this.add.image(0, 0, 'icon:plus').setDisplaySize(24, 24)]);
      plus.setSize(48, 48).setInteractive({ useHandCursor: true });
      plus.on('pointerup', () => {
        audio.sfx('tap');
        onPlus();
      });
      c.add(plus);
      this.ui.add(c);
      return t;
    };
    pill(1300, 'star4', `${totalStars(save)} / ${STAGES.length * 3}`, () => goTo(this, 'Story'));
    this.glimmerText = pill(1610, 'glimmer', save.glimmer.toLocaleString('en-US'), () => openAchievements(this, () => this.refreshDots()));
  }

  // ===================================================================== right column

  private buildRight(): void {
    const save = saves.get();
    const stage = frontierStage(save);
    const chapter = CHAPTERS.find((c) => c.id === stage.chapter)!;
    const allClear = Object.keys(save.stars).length >= STAGES.length;
    const x = 1560;

    // Promo banner: the newest Luminaries (or a painted banners/rite image).
    const promo = this.add.container(x, 236);
    const painted = dropIn(this, 'banners', 'rite');
    if (painted) {
      promo.add(this.add.image(0, 0, painted).setDisplaySize(560, 170));
    } else {
      promo.add(this.add.nineslice(0, 0, 'ui:dark', undefined, 560, 170, 12, 12, 12, 12));
      promo.add(this.add.image(-60, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(520, 200).setAlpha(0.2));
      FEATURED.forEach((id, i) => promo.add(this.add.image(-210 + i * 64, 6, `head:${id}`).setDisplaySize(92, 92)));
      promo.add(text(this, -40, -50, 'NEW LUMINARIES', { size: 26, font: 'display', bold: true, color: CSS.firefly, spacing: 2 }));
      promo.add(text(this, -40, -10, FEATURED.map((id) => getCharacter(id).name.replace(/^(Lady|Sir|Dr\.?|Madame)\s+/, '').split(' ')[0]).join(' · '), { size: 24, color: CSS.cream }));
      promo.add(text(this, -40, 30, 'now answering the Lantern Rite', { size: 20, italic: true, color: CSS.creamDim }));
    }
    promo.add(this.add.rectangle(0, 0, 560, 170).setStrokeStyle(2, C.gold, 0.6));
    promo.setSize(560, 170).setInteractive({ useHandCursor: true });
    promo.on('pointerup', () => {
      audio.sfx('tap');
      goTo(this, 'Summon');
    });
    this.ui.add(promo);

    // Chapter title + ticket.
    this.ui.add(text(this, x + 270, 360, allClear ? 'EVERY LAMP IS LIT' : `CHAPTER ${stage.chapter}`, { size: 26, font: 'display', bold: true, color: CSS.goldLight, spacing: 6, shadow: true }).setOrigin(1, 0));
    this.ui.add(text(this, x + 270, 398, chapter.name, { size: 58, font: 'display', bold: true, color: CSS.cream, shadow: true, align: 'right', wrap: 620 }).setOrigin(1, 0));
    this.ui.add(text(this, x + 270, 476, allClear ? 'Replay any stage from the Story map' : `${stage.id}  ·  ${stage.name}`, { size: 26, italic: true, color: CSS.creamDim, shadow: true }).setOrigin(1, 0));
    this.ticket(x + 85, 576, allClear ? 'STORY' : 'ENTER THE STAGE', () => (allClear ? goTo(this, 'Story') : goTo(this, 'Formation', { stageId: stage.id })));

    // Two small tiles.
    const tile = (tx: number, icon: string, label: string, sub: string, go: () => void) => {
      const c = this.add.container(tx, 720);
      c.add(this.add.nineslice(0, 0, 'ui:paper', undefined, 268, 110, 12, 12, 12, 12));
      c.add(this.add.image(-88, 0, `icon:${icon}`).setDisplaySize(64, 64));
      c.add(text(this, -44, -16, label, { size: 28, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0, 0.5));
      c.add(text(this, -44, 20, sub, { size: 20, color: CSS.paperSub }).setOrigin(0, 0.5));
      c.setSize(268, 110).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => c.setScale(1.04));
      c.on('pointerout', () => c.setScale(1));
      c.on('pointerup', () => {
        audio.sfx('tap');
        go();
      });
      this.ui.add(c);
    };
    tile(x - 146, 'story', 'Story', `${CHAPTERS.length} chapters`, () => goTo(this, 'Story'));
    tile(x + 146, 'roster', 'Troupe', `${Object.keys(save.roster).length} / ${CHARACTERS.length}`, () => goTo(this, 'Roster'));

    // Big Lantern Rite button with a turning wheel.
    const rite = this.add.container(x, 900);
    const glow = this.add.image(0, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(640, 260).setAlpha(0.2);
    this.tweens.add({ targets: glow, alpha: 0.36, duration: 1400, yoyo: true, repeat: -1 });
    const plate = this.add.nineslice(0, 0, 'ui:dark', undefined, 560, 170, 14, 14, 14, 14);
    const wheel = this.add.graphics({ x: -190, y: 0 });
    wheel.lineStyle(4, C.gold, 0.85).strokeCircle(0, 0, 66).strokeCircle(0, 0, 44);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      wheel.lineBetween(Math.cos(a) * 44, Math.sin(a) * 44, Math.cos(a) * 66, Math.sin(a) * 66);
    }
    this.tweens.add({ targets: wheel, angle: 360, duration: 16000, repeat: -1 });
    const icon = this.add.image(-190, 0, 'icon:summon').setDisplaySize(96, 96);
    const pulls = Math.floor(save.glimmer / RITE.cost);
    rite.add([glow, plate, wheel, icon,
      text(this, -100, -34, 'LANTERN RITE', { size: 40, font: 'display', bold: true, color: CSS.firefly, spacing: 3 }).setOrigin(0, 0.5),
      text(this, -98, 22, pulls > 0 ? `Glimmer for ${pulls} light${pulls > 1 ? 's' : ''}` : 'Clear stages to earn Glimmer', { size: 24, color: CSS.cream }).setOrigin(0, 0.5),
    ]);
    rite.setSize(560, 170).setInteractive({ useHandCursor: true });
    rite.on('pointerover', () => rite.setScale(1.03));
    rite.on('pointerout', () => rite.setScale(1));
    rite.on('pointerup', () => {
      audio.sfx('tap');
      goTo(this, 'Summon');
    });
    this.ui.add(rite);
  }

  /** Amber admission ticket with notched ends (the reference's "ENTER THE SHOW"). */
  private ticket(x: number, y: number, label: string, onClick: () => void): void {
    const w = 430;
    const h = 92;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(C.amber, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, 0xffe6c0, 0.7);
    g.strokeRoundedRect(-w / 2 + 10, -h / 2 + 8, w - 20, h - 16, 6);
    // Perforation.
    for (let i = -3; i <= 3; i++) g.fillStyle(0xffe6c0, 0.6).fillCircle(w / 2 - 70, i * 10, 2);
    const t = text(this, -34, 0, label, { size: 30, font: 'display', bold: true, color: '#fff4e4', spacing: 3 }).setOrigin(0.5);
    const arrow = this.add.image(w / 2 - 36, 0, 'icon:back').setDisplaySize(34, 34).setFlipX(true);
    c.add([g, t, arrow]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: arrow, x: arrow.x + 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.on('pointerover', () => c.setScale(1.04));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerup', () => {
      audio.sfx('tap');
      onClick();
    });
    this.ui.add(c);
  }

  // ===================================================================== Nixie clock

  private buildClock(): void {
    // Nixie tubes in the corner, showing the player's real time.
    const x0 = 72;
    const y = 990;
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x140d09, 0.9).fillRoundedRect(x0 - 30, y + 34, 4 * 54 + 64, 20, 6);
    c.add(this.add.image(x0 + 100, y - 4, 'fx:glow').setTint(0xff8a3a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(380, 200).setAlpha(0.18));
    c.add(g);
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * 54 + (i > 1 ? 14 : 0);
      g.fillStyle(0x1a1410, 0.9).fillRoundedRect(x - 22, y - 44, 44, 78, 18);
      g.lineStyle(2, 0xc9a070, 0.35).strokeRoundedRect(x - 22, y - 44, 44, 78, 18);
      const d = text(this, x, y - 4, '0', { size: 54, color: '#ffae5a' }).setOrigin(0.5);
      d.setShadow(0, 0, '#ff7a2a', 18, false, true);
      this.digits.push(d);
      c.add(d);
    }
    const colon = text(this, x0 + 2 * 54 - 13, y - 6, ':', { size: 44, color: '#ffae5a' }).setOrigin(0.5);
    colon.setShadow(0, 0, '#ff7a2a', 14, false, true);
    c.add(colon);
    this.tweens.add({ targets: colon, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.ui.add(c);
    this.tickClock();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });
  }

  private tickClock(): void {
    const d = new Date();
    const s = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    this.digits.forEach((t, i) => t.setText(s[i]));
  }

  private say(line: string): void {
    if (this.hidden) return;
    this.bubble?.destroy();
    const t = text(this, 0, 0, line, { size: 28, italic: true, color: CSS.paperText, wrap: 360 });
    const w = t.width + 44;
    const h = t.height + 30;
    const c = this.add.container(1010, 250).setDepth(80);
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
