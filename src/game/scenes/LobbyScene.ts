import Phaser from 'phaser';
import { dropIn } from '../art/assets';
import { ensureBg, ensurePortrait } from '../art/registry';
import { clockFaceCanvas, clockHandCanvas } from '../art/clockFace';
import { audio } from '../audio/AudioController';
import { CHARACTERS, getCharacter } from '../data/characters';
import { CHAPTERS, STAGES } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { claimableCount, playerLevel, totalStars } from '../systems/achievements';
import { frontierStage } from '../systems/progression';
import { goToStage } from '../systems/storyFlow';
import { RITE } from '../systems/gacha';
import { Atmosphere, fadeIn, goTo, softPress, text, toast } from '../ui/kit';
import { stagePortrait } from '../ui/LivingSprite';
import { LOBBY_GREETINGS, LOBBY_LINES } from '../data/story';
import { openAchievements, openAtlas, openGramophone, openNotice, openProfile } from '../ui/Panels';

/** The newest Luminaries, advertised on the lobby banner. */
const FEATURED = ['ottoline', 'marigold', 'ichabod'];
/** Right-hand column: centre x and shared width. */
const RIGHT_X = 1620;
const COL_W = 470;

/** Shrinks a text object so it never runs past `maxWidth` (no cut-off labels). */
function fit(t: Phaser.GameObjects.Text, maxWidth: number): Phaser.GameObjects.Text {
  if (t.width > maxWidth) t.setScale(maxWidth / t.width);
  return t;
}

/**
 * The Lamplighter's parlour, laid out like the reference lobby: profile badge top-left, shortcut
 * column on the left, the leader centre stage, currencies top-right, and the way onward on the right.
 */
export class LobbyScene extends Phaser.Scene {
  private bubble?: Phaser.GameObjects.Container;
  private ui!: Phaser.GameObjects.Container;
  private glimmerText!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private hidden = false;
  private hands: Phaser.GameObjects.Image[] = [];
  private clockTime!: Phaser.GameObjects.Text;
  private clockDate!: Phaser.GameObjects.Text;

  constructor() {
    super('Lobby');
  }

  create(): void {
    fadeIn(this);
    this.dots = [];
    this.bubble = undefined;
    this.hidden = false;
    const save = saves.get();
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 60, fireflies: 7 });

    // Leader, centre stage. Painted portraits stand nearly full height.
    const leader = getCharacter(save.team[0]);
    this.add.image(810, H - 24, 'fx:shadow').setDisplaySize(520, 64).setDepth(19);
    const lead = stagePortrait(this, 810, H + 34, leader.id, ensurePortrait(this, leader.id), 0.92, 1110, 1140).setDepth(20);
    const lines = LOBBY_LINES[leader.id] ?? [leader.quote];
    let lineAt = Phaser.Math.Between(0, lines.length - 1);
    lead.hit.setInteractive({ useHandCursor: true });
    lead.hit.on('pointerup', () => {
      if (this.hidden) return this.toggleUi();
      lead.pose();
      lineAt = (lineAt + 1) % lines.length;
      this.say(lines[lineAt]);
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
    const hour = new Date().getHours();
    this.time.delayedCall(900, () => this.say(save.totalPulls === 0 && save.glimmer >= RITE.cost * 10
      ? LOBBY_GREETINGS.rite
      : hour >= 1 && hour < 5 ? LOBBY_GREETINGS.night : lines[lineAt]));
  }

  // ===================================================================== helpers

  /** Round icon button with a label underneath (and an optional red notice dot). */
  private iconButton(x: number, y: number, icon: string, label: string, onClick: () => void, size = 84, dot = false): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const plate = this.add.circle(0, 0, size / 2, 0x0c0e11, 0.38).setStrokeStyle(1.5, 0xe8dcc0, 0.32);
    const ic = this.add.image(0, 0, `icon:${icon}`).setDisplaySize(size * 0.56, size * 0.56).setAlpha(0.72);
    c.add([plate, ic]);
    if (label) c.add(text(this, 0, size / 2 + 14, label, { size: 17, font: 'display', bold: true, color: CSS.creamDim, spacing: 1, shadow: true }).setOrigin(0.5).setAlpha(0.85));
    if (dot) {
      const d = this.add.circle(size * 0.34, -size * 0.34, 10, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
      c.add(d);
      this.dots.push(d);
    }
    c.setSize(size + 20, size + (label ? 40 : 10)).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => ic.setAlpha(1));
    c.on('pointerout', () => ic.setAlpha(0.72));
    softPress(c, onClick, 'tap', 1.06);
    this.ui.add(c);
    return c;
  }

  /** Painted menu button (ui/menu_<id>, name plate included) or the line-icon fallback. */
  private artButton(x: number, y: number, art: string, icon: string, label: string, onClick: () => void, size: number, dot = false): Phaser.GameObjects.Container {
    if (!art || !this.textures.exists(`menu:${art}`)) return this.iconButton(x, y - 8, icon, label, onClick, Math.round(size * 0.6), dot);
    const c = this.add.container(x, y);
    const glow = this.add.image(0, -size * 0.08, 'fx:glow').setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(size * 1.3, size * 1.1).setAlpha(0);
    const img = this.add.image(0, 0, `menu:${art}`).setDisplaySize(size, size);
    c.add([glow, img]);
    if (dot) {
      const d = this.add.circle(size * 0.36, -size * 0.36, 9, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
      c.add(d);
      this.dots.push(d);
    }
    c.setSize(size, size).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: glow, alpha: 0.35, duration: 180 }));
    c.on('pointerout', () => this.tweens.add({ targets: glow, alpha: 0, duration: 220 }));
    softPress(c, onClick, 'tap', 1.06);
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
    c.input!.hitArea.setTo(220, 56, 440, 112);
    c.on('pointerup', () => {
      audio.sfx('tap');
      openProfile(this);
    });
    this.ui.add(c);

    // Shortcut row under the badge.
    const row: [string, string, () => void][] = [
      ['profile', 'profile', () => openProfile(this)],
      ['gramophone', 'gramophone', () => openGramophone(this)],
      ['settings', 'gear', () => this.openSettings()],
    ];
    row.forEach(([art, icon, go], i) => this.artButton(92 + i * 104, 206, art, icon, '', go, 96));
  }

  private buildLeftColumn(): void {
    // One column of painted buttons (each carries its own name plate).
    const items: [string, string, string, () => void, boolean?][] = [
      ['notice', 'notice', 'Notice', () => openNotice(this)],
      ['achievements', 'trophy', 'Tasks', () => openAchievements(this, () => this.refreshDots()), true],
      ['atlas', 'atlas', 'Atlas', () => openAtlas(this)],
      ['troupe', 'roster', 'Troupe', () => goTo(this, 'Roster')],
      ['pawnshop', 'shop', 'Shop', () => goTo(this, 'Shop')],
      ['', 'menu', 'Menu', () => goTo(this, 'Menu')],
    ];
    items.forEach(([art, icon, label, go, dot], i) => this.artButton(96, 314 + i * 98, art, icon, label, go, 112, !!dot));
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
    // Thin currency strip aligned with the right-hand column.
    const pw = (COL_W - 18) / 2;
    const pill = (x: number, icon: string, value: string, onPlus: () => void) => {
      const c = this.add.container(x, 70);
      c.add(this.add.rectangle(0, 0, pw, 48, 0x0b0c10, 0.5).setStrokeStyle(1.5, 0xe8dcc0, 0.45));
      c.add(this.add.image(-pw / 2 + 26, 0, `icon:${icon}`).setDisplaySize(34, 34));
      const t = fit(text(this, -pw / 2 + 50, 0, value, { size: 24, bold: true, color: CSS.cream }).setOrigin(0, 0.5), pw - 100);
      c.add(t);
      const plus = this.add.container(pw / 2 - 24, 0);
      plus.add([this.add.circle(0, 0, 15, 0x0b0c10, 0.6).setStrokeStyle(1.5, 0xe8dcc0, 0.6), this.add.image(0, 0, 'icon:plus').setDisplaySize(16, 16)]);
      plus.setSize(44, 44).setInteractive({ useHandCursor: true });
      plus.on('pointerup', () => {
        audio.sfx('tap');
        onPlus();
      });
      c.add(plus);
      this.ui.add(c);
      return t;
    };
    pill(RIGHT_X - COL_W / 2 + pw / 2, 'starp', `${totalStars(save)} / ${STAGES.length * 3}`, () => goTo(this, 'Story'));
    this.glimmerText = pill(RIGHT_X + COL_W / 2 - pw / 2, 'glimmer', save.glimmer.toLocaleString('en-US'), () => goTo(this, 'Shop'));
  }

  // ===================================================================== right column

  private buildRight(): void {
    const save = saves.get();
    const stage = frontierStage(save);
    const chapter = CHAPTERS.find((c) => c.id === stage.chapter)!;
    const allClear = Object.keys(save.stars).length >= STAGES.length;
    // One column, one width, everything left-aligned to the same edge (as in the reference).
    const x = RIGHT_X;
    const left = x - COL_W / 2;

    // Promo banner, tilted like a pasted poster.
    const promo = this.add.container(x, 222).setAngle(-2.5);
    const painted = dropIn(this, 'banners', 'rite');
    if (painted) {
      promo.add(this.add.image(0, 0, painted).setDisplaySize(COL_W, 132));
    } else {
      promo.add(this.add.rectangle(0, 0, COL_W, 132, 0x0b0c10, 0.72));
      promo.add(this.add.image(-COL_W / 2 + 120, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(320, 170).setAlpha(0.22));
      FEATURED.forEach((id, i) => {
        const hx = -COL_W / 2 + 54 + i * 58;
        promo.add(this.add.circle(hx, 4, 37, 0x0b0c10).setStrokeStyle(2, C.gold, 0.7));
        promo.add(this.add.image(hx, 4, `head:${id}`).setDisplaySize(70, 70));
      });
      const tx = -COL_W / 2 + 222;
      const room = COL_W / 2 - tx - 16;
      promo.add(fit(text(this, tx, -40, 'NEW LUMINARIES', { size: 24, font: 'display', bold: true, color: CSS.firefly, spacing: 2 }), room));
      promo.add(fit(text(this, tx, -6, FEATURED.map((id) => getCharacter(id).name.replace(/^(Lady|Sir|Dr\.?|Madame)\s+/, '').split(' ')[0]).join(' · '), { size: 20, color: CSS.cream }), room));
      promo.add(fit(text(this, tx, 24, 'answering the Lantern Rite', { size: 18, italic: true, color: CSS.creamDim }), room));
    }
    promo.add(this.add.rectangle(0, 0, COL_W, 132).setStrokeStyle(1.5, 0xe8dcc0, 0.55));
    promo.setSize(COL_W, 132).setInteractive({ useHandCursor: true });
    promo.on('pointerup', () => {
      audio.sfx('tap');
      goTo(this, 'Summon');
    });
    this.ui.add(promo);

    // Admission ticket: chapter + next stage, with a torn-off "Enter" stub.
    this.ticket(x, 372, allClear ? 'EVERY LAMP IS LIT' : `CHAPTER ${stage.chapter} · ${chapter.name.toUpperCase()}`,
      allClear ? 'Replay any stage' : `${stage.id}  ${stage.name}`,
      () => (allClear ? goTo(this, 'Story') : goToStage(this, stage.id)));

    // Two outlined tiles.
    const tw = (COL_W - 18) / 2;
    const tile = (tx: number, icon: string, label: string, sub: string, go: () => void) => {
      const c = this.add.container(tx, 528);
      c.add(this.add.rectangle(0, 0, tw, 118, 0x0b0c10, 0.5).setStrokeStyle(1.5, 0xe8dcc0, 0.55));
      c.add(this.add.image(tw / 2 - 52, -6, `icon:${icon}`).setDisplaySize(78, 78).setAlpha(0.28));
      c.add(text(this, -tw / 2 + 18, 18, label, { size: 30, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0, 0.5));
      c.add(text(this, -tw / 2 + 20, -30, sub, { size: 17, italic: true, color: CSS.creamDim }).setOrigin(0, 0.5));
      c.setSize(tw, 118).setInteractive({ useHandCursor: true });
      softPress(c, () => { go(); }, 'tap', 1.03);
      this.ui.add(c);
    };
    tile(left + tw / 2, 'story', 'Story', `${CHAPTERS.length} chapters`, () => goTo(this, 'Story'));
    tile(left + COL_W - tw / 2, 'roster', 'Troupe', `${Object.keys(save.roster).length} / ${CHARACTERS.length} found`, () => goTo(this, 'Roster'));

    // Lantern Rite: wide outlined tile with a turning wheel bleeding off its right edge.
    const rite = this.add.container(x, 676);
    const glow = this.add.image(COL_W / 2 - 90, 0, 'fx:glow').setTint(C.firefly).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(300, 200).setAlpha(0.16);
    this.tweens.add({ targets: glow, alpha: 0.3, duration: 1400, yoyo: true, repeat: -1 });
    const plate = this.add.rectangle(0, 0, COL_W, 132, 0x0b0c10, 0.55).setStrokeStyle(1.5, 0xe8dcc0, 0.55);
    const wheel = this.add.graphics({ x: COL_W / 2 - 90, y: 0 });
    wheel.lineStyle(3, 0xe8dcc0, 0.75).strokeCircle(0, 0, 56).strokeCircle(0, 0, 18);
    wheel.lineStyle(2, 0xe8dcc0, 0.5).strokeCircle(0, 0, 44);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      wheel.lineBetween(Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 56, Math.sin(a) * 56);
    }
    this.tweens.add({ targets: wheel, angle: 360, duration: 18000, repeat: -1 });
    const icon = this.add.image(COL_W / 2 - 90, 0, 'icon:summon').setDisplaySize(44, 44);
    const pulls = Math.floor(save.glimmer / RITE.cost);
    rite.add([glow, plate, wheel, icon,
      text(this, -COL_W / 2 + 22, -18, 'Lantern Rite', { size: 36, font: 'display', bold: true, color: CSS.cream, shadow: true }).setOrigin(0, 0.5),
      text(this, -COL_W / 2 + 24, 26, pulls > 0 ? `Glimmer for ${pulls} light${pulls > 1 ? 's' : ''}` : 'Clear stages to earn Glimmer', { size: 19, italic: true, color: CSS.firefly }).setOrigin(0, 0.5),
    ]);
    rite.setSize(COL_W, 132).setInteractive({ useHandCursor: true });
    softPress(rite, () => { goTo(this, 'Summon'); }, 'tap', 1.02);
    this.ui.add(rite);
  }

  /** Cream admission ticket with a perforated "Enter" stub (the reference's "ENTER THE SHOW"). */
  private ticket(x: number, y: number, head: string, sub: string, onClick: () => void): void {
    const w = COL_W;
    const h = 112;
    const stub = 118;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xefe6d2, 0.96).fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1.5, 0x2a241c, 0.35).strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    for (let i = -h / 2 + 10; i < h / 2 - 6; i += 9) g.fillStyle(0x2a241c, 0.4).fillCircle(w / 2 - stub, i, 1.6);
    const room = w - stub - 44;
    const k = fit(text(this, -w / 2 + 22, -30, head, { size: 15, font: 'display', bold: true, color: CSS.amber, spacing: 2 }), room);
    const t = fit(text(this, -w / 2 + 20, -6, 'ENTER THE STAGE', { size: 34, font: 'display', bold: true, color: CSS.paperText }), room);
    const st = fit(text(this, -w / 2 + 22, 30, sub, { size: 18, italic: true, color: CSS.paperSub }), room);
    const enter = text(this, w / 2 - stub / 2, -2, 'Enter', { size: 30, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0.5);
    const arrow = this.add.image(w / 2 - stub / 2, 30, 'icon:back').setDisplaySize(22, 22).setFlipX(true).setTint(0x2a241c);
    c.add([g, k, t, st, enter, arrow]);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: arrow, x: arrow.x + 5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    softPress(c, () => { onClick(); }, 'tap', 1.03);
    this.ui.add(c);
  }

  // ===================================================================== Nixie clock

  /** Brass carriage clock in the corner, keeping the player's real time (with the lore's 13th mark). */
  private buildClock(): void {
    if (!this.textures.exists('ui:clockFace')) {
      this.textures.addCanvas('ui:clockFace', clockFaceCanvas());
      this.textures.addCanvas('ui:clockHour', clockHandCanvas(84, 22));
      this.textures.addCanvas('ui:clockMin', clockHandCanvas(118, 16));
      this.textures.addCanvas('ui:clockSec', clockHandCanvas(126, 6, '#9a1e22', 26));
    }
    const s = 0.56;
    const cx = 100;
    const cy = 988;
    const c = this.add.container(0, 0);
    c.add(this.add.image(cx, cy, 'fx:glow').setTint(0xffc070).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(330, 300).setAlpha(0.16));
    c.add(this.add.image(cx, cy, 'ui:clockFace').setScale(s));
    const hand = (key: string, counter = 0) => this.add.image(cx, cy, key).setOrigin(0.5, 1 - counter / this.textures.get(key).getSourceImage().height).setScale(s);
    this.hands = [hand('ui:clockHour'), hand('ui:clockMin'), hand('ui:clockSec', 26)];
    c.add(this.hands);
    c.add(this.add.circle(cx, cy, 6, 0xd8b060).setStrokeStyle(1.5, 0x3a2208));
    // Date and time beside the dial, set like a ticket stub.
    this.clockTime = text(this, cx + 104, cy - 20, '', { size: 46, font: 'display', color: '#f4ead4', spacing: 2, shadow: true }).setOrigin(0, 0.5);
    this.clockDate = text(this, cx + 106, cy + 26, '', { size: 22, font: 'letter', italic: true, color: CSS.creamDim, shadow: true }).setOrigin(0, 0.5);
    c.add([this.clockTime, this.clockDate, this.add.rectangle(cx + 114, cy + 4, 190, 1, 0xe8dcc0, 0.45).setOrigin(0, 0.5)]);
    this.ui.add(c);
    this.tickClock();
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.tickClock() });
  }

  private tickClock(): void {
    const d = new Date();
    const sec = d.getSeconds() + d.getMilliseconds() / 1000;
    const min = d.getMinutes() + sec / 60;
    const hr = (d.getHours() % 12) + min / 60;
    const [h, m, s2] = this.hands;
    h.setAngle(hr * 30);
    m.setAngle(min * 6);
    // The second hand ticks, with a tiny overshoot like a real escapement.
    const target = Math.floor(sec) * 6;
    if (Math.abs(((s2.angle - target + 540) % 360) - 180) > 0.5) {
      this.tweens.add({ targets: s2, angle: target === 0 && s2.angle > 300 ? 360 : target, duration: 140, ease: 'Back.easeOut', onComplete: () => s2.setAngle(target) });
    }
    this.clockTime.setText(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    this.clockDate.setText(d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  private say(line: string): void {
    if (this.hidden) return;
    this.bubble?.destroy();
    const t = text(this, 0, 0, line, { size: 28, italic: true, color: CSS.paperText, wrap: 360 });
    const w = t.width + 44;
    const h = t.height + 30;
    const c = this.add.container(960, 150).setDepth(80);
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
