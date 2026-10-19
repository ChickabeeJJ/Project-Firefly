import Phaser from 'phaser';
import { dropIn } from '../art/assets';
import { ensureBg, ensurePortrait, FACE_POINTS } from '../art/registry';
import { clockFaceCanvas, clockHandCanvas } from '../art/clockFace';
import { audio } from '../audio/AudioController';
import { CHARACTERS, getCharacter } from '../data/characters';
import { CHAPTERS, STAGES } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { claimableCount, playerLevel, totalStars } from '../systems/achievements';
import { frontierStage } from '../systems/progression';
import { RITE } from '../systems/gacha';
import { Atmosphere, fadeIn, goTo, iconPlinth, softPress, text, toast } from '../ui/kit';
import { stagePortrait } from '../ui/LivingSprite';
import { openSignIn } from '../ui/SignIn';
import { signedToday } from '../systems/signin';
import { LOBBY_GREETINGS, LOBBY_LINES } from '../data/story';
import { openAchievements, openAtlas, openGramophone, openNotice, openProfile } from '../ui/Panels';

/** The newest Luminaries, advertised on the lobby banner. */
const FEATURED = ['cassian', 'rook', 'nell'];
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
  private face = { x: 960, y: 260 };
  private hands: Phaser.GameObjects.Image[] = [];
  /** Set while the midnight chime holds the hands on the thirteenth mark. */
  private striking = false;
  private signDot?: Phaser.GameObjects.Arc;
  private struckOn = '';
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
    const leadKey = ensurePortrait(this, leader.id);
    const lead = stagePortrait(this, 810, H + 34, leader.id, leadKey, 0.92, 1110, 1140).setDepth(20);
    // Speech bubble anchor: just beside the leader's face.
    const fr = this.textures.getFrame(leadKey);
    const k = Math.min(1110 / fr.height, 1140 / fr.width);
    const [fx, fy] = FACE_POINTS[leader.id] ?? [0.5, 0.14];
    this.face = { x: 810 - (fr.width * k) / 2 + fx * fr.width * k, y: H + 34 - fr.height * k + fy * fr.height * k };
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
    // First visit of the day: the sign-in sheet opens by itself, as the reference's does. The
    // one-time tour of the parlour (after the first battle) waits until it is put away.
    if (!signedToday(save)) this.time.delayedCall(1300, () => (this.bubble?.destroy(), openSignIn(this, () => { this.refreshSignDot(); this.refreshDots(); this.maybeTour(); })));
    else this.time.delayedCall(1400, () => this.maybeTour());
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
    const img = this.add.image(0, label ? -8 : 0, `menu:${art}`).setDisplaySize(size, size);
    c.add([glow, iconPlinth(this, 0, img.y + (size * 150) / 360, size * 0.86), img]);
    if (label) {
      // A small engraved caption on a soft dark band, so it reads over any backdrop.
      const cap = text(this, 0, size / 2 + 2, label, { size: 15, font: 'display', color: CSS.cream, spacing: 2, shadow: true }).setOrigin(0.5);
      c.add([this.add.rectangle(0, size / 2 + 2, cap.width + 18, 20, 0x0b0c10, 0.45), cap]);
    }
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

  /**
   * The parlour tour, shown once after the guided first battle: each stop outlines one part of
   * the lobby with a note on what it is for. Tap to go on; Skip ends it.
   */
  private maybeTour(): void {
    if (!saves.hasHint('tutorialDone') || saves.hasHint('tour:lobby') || this.hidden) return;
    saves.markHint('tour:lobby');
    const left = RIGHT_X - COL_W / 2;
    const tw = (COL_W - 18) / 2;
    const stops: { x: number; y: number; w: number; h: number; msg: string; side: 'left' | 'right' }[] = [
      { x: RIGHT_X, y: 372, w: COL_W + 20, h: 132, side: 'left', msg: 'Enter the Stage carries the story on. Each stage you clear opens the next — and the tale of Vellmoor with it.' },
      { x: RIGHT_X, y: 676, w: COL_W + 20, h: 152, side: 'left', msg: 'The Lantern Rite calls new Luminaries with Glimmer. You earn Glimmer from stages, tasks and the daily sign-in.' },
      { x: left + COL_W - tw / 2, y: 528, w: tw + 20, h: 138, side: 'left', msg: 'The Troupe is where your Luminaries grow: spend Wick Dust and Sovereigns to level them, and materials to Kindle them.' },
      { x: left + tw / 2, y: 528, w: tw + 20, h: 138, side: 'left', msg: 'Story holds every chapter, plus Supplies and Kindling stages that pay out levelling materials.' },
      { x: 84, y: 400, w: 120, h: 118, side: 'right', msg: 'Tasks pay Glimmer for milestones — a red dot means something is ready to claim.' },
      { x: 384, y: 196, w: 110, h: 108, side: 'right', msg: 'Sign in each day for rewards, with bonuses at 7, 15 and 25 days. That is the whole parlour — good luck, Lamplighter.' },
    ];
    const root = this.add.container(0, 0).setDepth(3000);
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x050608, 0.45).setInteractive();
    root.add(veil);
    let i = -1;
    let stopC: Phaser.GameObjects.Container | undefined;
    const end = () => {
      this.tweens.add({ targets: root, alpha: 0, duration: 300, onComplete: () => root.destroy() });
    };
    const next = () => {
      i++;
      stopC?.destroy();
      if (i >= stops.length) {
        end();
        return;
      }
      const st = stops[i];
      const c = this.add.container(0, 0);
      // Outline with corner brackets around the stop.
      const ring = this.add.container(st.x, st.y);
      const g = this.add.graphics();
      const hw = st.w / 2;
      const hh = st.h / 2;
      g.lineStyle(3, C.gold, 0.95).strokeRoundedRect(-hw, -hh, st.w, st.h, 10);
      g.lineStyle(5, 0xfff0c0, 1);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const cx = sx * (hw + 9);
        const cy = sy * (hh + 9);
        g.beginPath();
        g.moveTo(cx, cy - sy * 26);
        g.lineTo(cx, cy);
        g.lineTo(cx - sx * 26, cy);
        g.strokePath();
      }
      ring.add(g);
      this.tweens.add({ targets: ring, scale: 1.04, alpha: 0.6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // The note, on paper, beside the stop.
      const t = text(this, 0, 0, st.msg, { size: 25, color: CSS.paperText, wrap: 470, lineSpacing: 3 });
      const bw = t.width + 48;
      const bh = t.height + 74;
      const bx = st.side === 'left' ? st.x - hw - 40 - bw : st.x + hw + 40;
      const by = Phaser.Math.Clamp(st.y - bh / 2, 30, H - bh - 30);
      c.add(this.add.nineslice(bx, by, 'ui:paperPlain', undefined, bw, bh, 12, 12, 12, 12).setOrigin(0));
      c.add(t.setPosition(bx + 24, by + 18));
      c.add(text(this, bx + 24, by + bh - 26, `${i + 1} / ${stops.length}`, { size: 18, color: CSS.paperSub }).setOrigin(0, 0.5));
      c.add(text(this, bx + bw - 24, by + bh - 26, i === stops.length - 1 ? 'Done ▸' : 'Tap to continue ▸', { size: 19, italic: true, color: CSS.accentInk }).setOrigin(1, 0.5));
      c.add(ring);
      c.setAlpha(0);
      this.tweens.add({ targets: c, alpha: 1, duration: 320, ease: 'Sine.easeOut' });
      root.add(c);
      stopC = c;
    };
    veil.on('pointerup', () => {
      audio.sfx('tap');
      next();
    });
    const skip = text(this, W - 60, H - 40, 'Skip tour', { size: 22, italic: true, color: CSS.creamDim }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    skip.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      audio.sfx('back');
      end();
    });
    root.add(skip);
    root.setAlpha(0);
    this.tweens.add({ targets: root, alpha: 1, duration: 300 });
    this.bubble?.destroy();
    next();
  }

  private refreshSignDot(): void {
    this.signDot?.setVisible(!signedToday(saves.get()));
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
    const row: [string, string, string, () => void][] = [
      ['profile', 'profile', 'Profile', () => openProfile(this)],
      ['gramophone', 'gramophone', 'Music', () => openGramophone(this)],
      ['settings', 'gear', 'Settings', () => this.openSettings()],
      ['signin', 'calendar', 'Sign-in', () => (this.bubble?.destroy(), openSignIn(this, () => { this.refreshSignDot(); this.refreshDots(); }))],
    ];
    row.forEach(([art, icon, label, go], i) => {
      const b = this.artButton(84 + i * 100, 196, art, icon, label, go, 66);
      if (art === 'signin') {
        this.signDot = this.add.circle(24, -30, 8, C.danger).setStrokeStyle(2, 0xffffff, 0.9);
        b.add(this.signDot);
        this.refreshSignDot();
      }
    });
  }

  private buildLeftColumn(): void {
    // One column of painted buttons (each carries its own name plate).
    const items: [string, string, string, () => void, boolean?][] = [
      ['notice', 'notice', 'Notice', () => openNotice(this)],
      ['achievements', 'trophy', 'Tasks', () => openAchievements(this, () => this.refreshDots()), true],
      ['atlas', 'atlas', 'Atlas', () => openAtlas(this)],
      ['troupe', 'roster', 'Troupe', () => goTo(this, 'Roster')],
      ['pawnshop', 'shop', 'Shop', () => goTo(this, 'Shop')],
      ['menu', 'menu', 'Menu', () => goTo(this, 'Menu')],
    ];
    items.forEach(([art, icon, label, go, dot], i) => this.artButton(84, 298 + i * 100, art, icon, label, go, 74, !!dot));
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
    const promo = this.add.container(x, 222);
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
    // A pasted poster stirring in a draught: a slow, tiny rock either side of its tilt.
    this.tweens.add({ targets: promo, angle: { from: -0.7, to: 0.7 }, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    promo.setSize(COL_W, 132).setInteractive({ useHandCursor: true });
    promo.on('pointerup', () => {
      audio.sfx('tap');
      goTo(this, 'Summon');
    });
    this.ui.add(promo);

    // Admission ticket: chapter + next stage, with a torn-off "Enter" stub.
    this.ticket(x, 372, allClear ? 'EVERY LAMP IS LIT' : `CHAPTER ${stage.chapter} · ${chapter.name.toUpperCase()}`,
      allClear ? 'Replay any stage' : `${stage.id}  ${stage.name}`,
      () => goTo(this, 'Story', allClear ? {} : { stageId: stage.id }));

    // Two outlined tiles.
    const tw = (COL_W - 18) / 2;
    const tile = (tx: number, icon: string, label: string, sub: string, go: () => void) => {
      const c = this.add.container(tx, 528);
      c.add(this.add.rectangle(0, 0, tw, 118, 0x0b0c10, 0.5).setStrokeStyle(1.5, 0xe8dcc0, 0.55));
      const art = ({ story: 'menu:story', roster: 'menu:troupe' } as Record<string, string>)[icon];
      if (art && this.textures.exists(art)) {
        // The painted emblem, warmly lit, set into the tile's right-hand side like the Rite lantern.
        c.add(this.add.image(tw / 2 - 46, -8, 'fx:glow').setTint(0xffe2a0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(140, 110).setAlpha(0.14));
        const em = this.add.image(tw / 2 - 46, -12, art).setDisplaySize(84, 84).setAlpha(0.5).setTint(0xd8cfc0); // matches the Rite tile
        c.add(em);
        this.tweens.add({ targets: em, angle: { from: -2, to: 2 }, y: -15, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        c.add(this.add.image(tw / 2 - 52, -6, `icon:${icon}`).setDisplaySize(78, 78).setAlpha(0.28));
      }
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
    const riteArt = this.textures.exists('menu:rite');
    const icon = riteArt
      ? this.add.image(COL_W / 2 - 84, 0, 'menu:rite').setDisplaySize(150, 150).setAlpha(0.5).setTint(0xd8cfc0)
      : this.add.image(COL_W / 2 - 90, 0, 'icon:summon').setDisplaySize(44, 44);
    if (riteArt) {
      wheel.setVisible(false);
      this.tweens.add({ targets: icon, angle: { from: -3, to: 3 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
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
    // Three clean lines on the left (chapter · title · next stage); the stub holds only an arrow.
    const room = w - stub - 50;
    const lx = -w / 2 + 26;
    const k = fit(text(this, lx, -32, head, { size: 15, font: 'display', bold: true, color: CSS.accentInk, spacing: 2 }).setOrigin(0, 0.5), room);
    const t = fit(text(this, lx, 2, 'Enter the Stage', { size: 34, font: 'display', bold: true, color: CSS.paperText }).setOrigin(0, 0.5), room);
    const st = fit(text(this, lx, 36, sub, { size: 18, italic: true, color: CSS.paperSub }).setOrigin(0, 0.5), room);
    const enter = this.add.circle(w / 2 - stub / 2, 0, 30, 0x2a241c, 0.9);
    const arrow = this.add.image(w / 2 - stub / 2 + 2, 0, 'icon:back').setDisplaySize(26, 26).setFlipX(true).setTint(0xefe6d2);
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
    c.add(this.add.image(cx, cy, 'fx:glow').setTint(0xff9a40).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(330, 300).setAlpha(0.09));
    c.add(this.add.image(cx, cy, 'ui:clockFace').setScale(s));
    const hand = (key: string, counter = 0) => this.add.image(cx, cy, key).setOrigin(0.5, 1 - counter / this.textures.get(key).getSourceImage().height).setScale(s);
    this.hands = [hand('ui:clockHour'), hand('ui:clockMin'), hand('ui:clockSec', 26)];
    c.add(this.hands);
    c.add(this.add.circle(cx, cy, 6, 0xd8b060).setStrokeStyle(1.5, 0x3a2208));
    // Date and time beside the dial, set like a ticket stub.
    this.clockTime = text(this, cx + 104, cy - 20, '', { size: 46, font: 'display', color: '#e8cc9a', spacing: 2, shadow: true }).setOrigin(0, 0.5);
    this.clockDate = text(this, cx + 106, cy + 26, '', { size: 22, font: 'letter', italic: true, color: CSS.creamDim, shadow: true }).setOrigin(0, 0.5);
    c.add([this.clockTime, this.clockDate, this.add.rectangle(cx + 114, cy + 4, 190, 1, 0xe8dcc0, 0.45).setOrigin(0, 0.5)]);
    this.ui.add(c);
    this.tickClock();
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.tickClock() });
  }

  private tickClock(): void {
    const d = new Date();
    const key = d.toDateString();
    const forced = new URLSearchParams(location.search).has('midnight');
    if ((forced || (d.getHours() === 0 && d.getMinutes() === 0)) && this.struckOn !== key) {
      this.struckOn = key;
      this.thirteenthStroke();
    }
    if (this.striking) return;
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

  /**
   * Easter egg: at midnight the lobby clock strikes twelve, and then once more — the Thirteenth
   * Stroke from the night of the Dimming. The hands stand on the red mark until it passes.
   */
  private thirteenthStroke(): void {
    const [h, m, sec] = this.hands;
    const cx = h.x;
    const cy = h.y;
    const gap = 420;
    for (let k = 0; k < 12; k++) {
      this.time.delayedCall(k * gap, () => {
        audio.sfx('lantern');
        const ring = this.add.circle(cx, cy, 56, 0xffc070, 0).setStrokeStyle(2, 0xffc070, 0.5).setDepth(50);
        this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
      });
    }
    this.time.delayedCall(12 * gap + 900, () => {
      this.striking = true;
      audio.sfx('finale');
      this.cameras.main.shake(600, 0.006);
      const a13 = 15; // half an hour past XII: the red lozenge
      this.tweens.add({ targets: [h, m, sec], angle: a13, duration: 500, ease: 'Back.easeOut' });
      this.clockTime.setText('XIII').setColor('#d0505a');
      const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x3a0a14, 0.5).setDepth(45);
      this.tweens.add({ targets: veil, alpha: 0, duration: 2600, ease: 'Sine.easeOut', onComplete: () => veil.destroy() });
      // Thirteen fireflies slip out of the dial and drift up into the room.
      for (let i = 0; i < 13; i++) {
        const f = this.add.image(cx, cy, 'fx:glow').setTint(0xffe08a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(26, 26).setDepth(60);
        this.tweens.add({
          targets: f, x: cx + Phaser.Math.Between(60, 760), y: cy - Phaser.Math.Between(220, 820), alpha: 0,
          duration: Phaser.Math.Between(2600, 4200), delay: i * 90, ease: 'Sine.easeOut', onComplete: () => f.destroy(),
        });
      }
      this.say('Thirteen. Did you hear it? There is no thirteenth hour — and yet, every midnight, the clocks remember one.');
      if (!saves.hasHint('egg:thirteenth')) {
        saves.get().glimmer += 130;
        saves.markHint('egg:thirteenth');
        this.refreshDots();
        toast(this, 'The Thirteenth Stroke  ·  +130 Glimmer', 'glimmer');
      }
      this.time.delayedCall(4200, () => {
        this.clockTime.setColor('#e8cc9a');
        this.striking = false;
      });
    });
  }

  private say(line: string): void {
    if (this.hidden) return;
    this.bubble?.destroy();
    const t = text(this, 0, 0, line, { size: 28, italic: true, color: CSS.paperText, wrap: 360 });
    const w = t.width + 44;
    const h = t.height + 30;
    // Beside the face: to its right if there is room before the menus, otherwise to its left.
    const right = this.face.x + 90 + w < 1360;
    const bx = right ? this.face.x + 90 : this.face.x - 90 - w;
    const by = Phaser.Math.Clamp(this.face.y - h - 20, 40, H - h - 40);
    const c = this.add.container(bx, by).setDepth(80);
    // Body and tail are one outline, so the tail grows out of the bubble's side towards the mouth.
    const pts = speechOutline(w, h, right);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.28).fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x + 3, p.y + 5)), true);
    g.fillStyle(C.paper, 1).fillPoints(pts, true);
    g.lineStyle(2, C.paperLine, 1).strokePoints(pts, true, true);
    c.add([g, t.setPosition(22, 15)]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 220, yoyo: true, hold: 4200, onComplete: () => c.destroy() });
    this.bubble = c;
  }

  private openSettings(): void {
    this.scene.launch('Pause', { mode: 'settings', from: 'Lobby' });
    this.scene.pause();
  }
}

/** Rounded speech bubble with its tail on the left (or right) side, near the bottom, as one closed path. */
function speechOutline(w: number, h: number, tailLeft: boolean): Phaser.Math.Vector2[] {
  const r = 12;
  const pts: Phaser.Math.Vector2[] = [];
  const arc = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 5; k++) {
      const a = a0 + (k / 5) * (Math.PI / 2);
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  };
  const v = (x: number, y: number) => pts.push(new Phaser.Math.Vector2(x, y));
  arc(r, r, Math.PI); // top-left
  arc(w - r, r, -Math.PI / 2); // top-right
  if (!tailLeft) {
    v(w, h - 46);
    v(w + 30, h + 6);
    v(w, h - 20);
  }
  arc(w - r, h - r, 0); // bottom-right
  arc(r, h - r, Math.PI / 2); // bottom-left
  if (tailLeft) {
    v(0, h - 20);
    v(-30, h + 6);
    v(0, h - 46);
  }
  return pts;
}
