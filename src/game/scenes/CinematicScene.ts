import Phaser from 'phaser';
import { ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { CHARACTERS } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { getStage } from '../data/stages';
import { getCinematic } from '../data/story';
import { LETTER_H, LETTER_W, letterPaperCanvas } from '../art/letterPaper';
import type { SceneBg, Shot } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { Atmosphere, text } from '../ui/kit';
import { type LivingSprite, livingPortrait } from '../ui/LivingSprite';

export interface CinematicData {
  /** Cinematic ids from data/story, or `stage:<id>` for a stage's intro dialogue. */
  ids: string[];
  next: { scene: string; data?: object };
}

type Tone = 'warm' | 'cold' | 'dawn' | undefined;

interface Beat {
  shot: Shot;
  /** Index of the cinematic this beat belongs to (bell numbering restarts per cinematic). */
  seg: number;
  bg: SceneBg;
  tone: Tone;
  /** Clock stamp shown when this beat opens a cinematic (e.g. "23:59"). */
  clock?: string;
}

/** Bottom text block (the reference's dialogue layout: name, hairline, text). */
const TX = 420;
const NAME_Y = 892;
const RULE_Y = 930;
const BODY_Y = 948;
const WRAP = 1100;
const TONE: Record<string, { color: number; alpha: number; mode: Phaser.BlendModes }> = {
  cold: { color: 0x1a2c48, alpha: 0.55, mode: Phaser.BlendModes.MULTIPLY },
  warm: { color: 0x6a3a14, alpha: 0.32, mode: Phaser.BlendModes.MULTIPLY },
  dawn: { color: 0xffc890, alpha: 0.22, mode: Phaser.BlendModes.ADD },
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

/**
 * Letterboxed story cinematics: Ken Burns backdrops, narration, painted speakers sliding in,
 * handwritten letters, the bell that struck thirteen, and chapter title cards. Tap to advance
 * (the first tap finishes the line), SKIP to jump to the end.
 */
export class CinematicScene extends Phaser.Scene {
  private beats: Beat[] = [];
  private i = -1;
  private data_!: CinematicData;
  private bgImg?: Phaser.GameObjects.Image;
  private bgKey = '';
  private tone!: Phaser.GameObjects.Rectangle;
  private ui!: Phaser.GameObjects.Container;
  private typer?: Phaser.Time.TimerEvent;
  private full = '';
  private typing?: Phaser.GameObjects.Text;
  private busy = false;
  private ending = false;
  private bells = 0;
  private seg = -1;
  private cast: { who: string; side: 'L' | 'R'; obj: LivingSprite | Phaser.GameObjects.Image }[] = [];
  private nextMark!: Phaser.GameObjects.Text;
  private auto = false;
  private asking = false;

  constructor() {
    super('Cinematic');
  }

  create(data: CinematicData): void {
    this.data_ = data;
    this.beats = [];
    this.i = -1;
    this.cast = [];
    this.bells = 0;
    this.seg = -1;
    this.busy = false;
    this.ending = false;
    this.bgImg = undefined;
    this.bgKey = '';
    data.ids.forEach((id, seg) => {
      if (id.startsWith('stage:')) {
        const st = getStage(id.slice(6));
        for (const l of st.intro ?? []) this.beats.push({ shot: { kind: 'line', who: l.portrait ?? l.speaker, text: l.text }, seg, bg: st.bg, tone: st.boss ? 'cold' : undefined });
        if (st.intro?.length) this.beats.unshift({ shot: { kind: 'bg', bg: st.bg, tone: st.boss ? 'cold' : undefined }, seg, bg: st.bg, tone: undefined });
        return;
      }
      const cin = getCinematic(id);
      if (!cin) return;
      this.beats.push({ shot: { kind: 'bg', bg: cin.bg, tone: cin.tone }, seg, bg: cin.bg, tone: cin.tone, clock: cin.clock });
      for (const shot of cin.shots) this.beats.push({ shot, seg, bg: cin.bg, tone: cin.tone });
    });

    this.cameras.main.setBackgroundColor('#000000');
    this.tone = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(2);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.28).setDepth(1);
    new Atmosphere(this, { depth: 40, fireflies: 6 });
    this.ui = this.add.container(0, 0).setDepth(70);
    // Soft dark floor under the text, as in the reference (no letterbox bars).
    const floor = this.add.graphics().setDepth(20);
    floor.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.92, 0.92);
    floor.fillRect(0, H - 330, W, 190);
    floor.fillStyle(0x000000, 0.92).fillRect(0, H - 140, W, 140);
    const topShade = this.add.graphics().setDepth(20);
    topShade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0.5, 0, 0);
    topShade.fillRect(0, 0, W, 120);

    const corner = (x: number, label: string, onClick: () => void) => {
      const t = text(this, x, 48, label, { size: 22, font: 'display', color: CSS.creamDim, spacing: 3 }).setOrigin(1, 0.5).setDepth(90).setInteractive({ useHandCursor: true });
      t.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        onClick();
      });
      return t;
    };
    const autoT = corner(W - 190, 'AUTO  ▷', () => {
      this.auto = !this.auto;
      audio.sfx('tap');
      autoT.setText(this.auto ? 'AUTO  ▶' : 'AUTO  ▷').setColor(this.auto ? CSS.goldLight : CSS.creamDim);
      if (this.auto && !this.typer && !this.busy) this.time.delayedCall(600, () => this.auto && this.advance());
    });
    corner(W - 50, 'SKIP  ▸|', () => {
      audio.sfx('tap');
      this.confirmSkip();
    });
    this.nextMark = text(this, W - 360, H - 60, '▼', { size: 20, color: CSS.creamDim }).setOrigin(0.5).setDepth(90).setAlpha(0);
    this.tweens.add({ targets: this.nextMark, y: this.nextMark.y + 8, duration: 500, yoyo: true, repeat: -1 });

    this.auto = false;
    this.asking = false;
    this.input.on('pointerup', () => !this.asking && this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-ESC', () => this.confirmSkip());

    const boss = data.ids.some((id) => id.startsWith('stage:') && getStage(id.slice(6)).boss);
    audio.play(boss ? 'boss' : data.ids.some((id) => !id.startsWith('stage:')) ? 'rite' : 'lobby');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(450, () => this.advance());
  }

  // ===================================================================== flow

  private advance(): void {
    if (this.ending) return;
    if (this.typer && this.typing) {
      this.typer.remove();
      this.typer = undefined;
      this.typing.setText(this.full);
      this.nextMark.setAlpha(1);
      return;
    }
    if (this.busy) return;
    this.i++;
    if (this.i >= this.beats.length) return this.finish();
    this.nextMark.setAlpha(0);
    const b = this.beats[this.i];
    if (b.seg !== this.seg) {
      this.seg = b.seg;
      this.bells = 0;
    }
    const s = b.shot;
    switch (s.kind) {
      case 'bg':
        this.setBg(s.bg, s.tone);
        if (b.clock) this.stamp(b.clock);
        this.wait(b.clock ? 1400 : 500, () => this.advance());
        break;
      case 'narrate': this.narrate(s.text, s.bg, s.tone); break;
      case 'line': this.line(s.who, s.text); break;
      case 'letter': this.letter(s.text, s.sign); break;
      case 'title': this.title(s.kicker, s.title, s.sub); break;
      case 'bell': this.bell(s.strokes, !!s.ominous, s.text); break;
    }
  }

  private wait(ms: number, fn: () => void): void {
    this.busy = true;
    this.time.delayedCall(ms, () => {
      this.busy = false;
      fn();
    });
  }

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    for (const id of this.data_.ids) saves.markHint(`cine:${id}`);
    this.typer?.remove();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(this.data_.next.scene, this.data_.next.data));
  }

  private clearUi(): void {
    this.typer?.remove();
    this.typer = undefined;
    this.typing = undefined;
    // Old words leave at once so two lines never overlap, even on a slow frame; ornaments fade.
    const old = this.ui.list.slice();
    for (const o of old) {
      if (o instanceof Phaser.GameObjects.Text) {
        o.destroy();
        continue;
      }
      this.tweens.add({ targets: o, alpha: 0, duration: 160, onComplete: () => o.destroy() });
    }
  }

  private type(t: Phaser.GameObjects.Text, full: string, speed = 2): void {
    this.full = full;
    this.typing = t;
    t.setText('');
    let n = 0;
    this.typer?.remove();
    this.typer = this.time.addEvent({
      delay: 24, loop: true, callback: () => {
        if (!t.active) {
          this.typer?.remove();
          this.typer = undefined;
          return;
        }
        n = Math.min(full.length, n + speed);
        t.setText(full.slice(0, n));
        if (n >= full.length) {
          this.typer?.remove();
          this.typer = undefined;
          this.nextMark.setAlpha(1);
          const at = this.i;
          if (this.auto) this.time.delayedCall(1500 + full.length * 18, () => this.auto && this.i === at && !this.asking && this.advance());
        }
      },
    });
  }

  // ===================================================================== backdrop

  private setBg(bg: SceneBg, tone: Tone): void {
    const key = ensureBg(this, bg);
    if (key !== this.bgKey) {
      this.bgKey = key;
      const img = this.add.image(W / 2, H / 2, key).setDepth(0).setAlpha(0);
      const base = Math.max(W / img.width, H / img.height);
      img.setScale(base * 1.08);
      this.tweens.add({ targets: img, alpha: 1, duration: 900 });
      this.tweens.add({ targets: img, scale: base * 1.18, x: W / 2 + Phaser.Math.Between(-60, 60), duration: 22000, ease: 'Sine.easeInOut' });
      const prev = this.bgImg;
      if (prev) this.tweens.add({ targets: prev, alpha: 0, duration: 900, onComplete: () => prev.destroy() });
      this.bgImg = img;
    }
    const t = tone ? TONE[tone] : undefined;
    this.tone.setFillStyle(t?.color ?? 0x000000, 1).setBlendMode(t?.mode ?? Phaser.BlendModes.NORMAL);
    this.tweens.add({ targets: this.tone, alpha: t?.alpha ?? 0, duration: 900 });
  }

  // ===================================================================== shots

  private narrate(str: string, bg?: SceneBg, tone?: Tone): void {
    if (bg || tone) this.setBg(bg ?? this.beats[this.i].bg, tone ?? this.beats[this.i].tone);
    this.clearUi();
    this.dimCast(true);
    const rule = this.add.rectangle(TX, RULE_Y, WRAP, 1, 0xe8dcc0, 0.3).setOrigin(0, 0.5);
    const t = text(this, TX, BODY_Y, '', { size: 30, color: CSS.cream, wrap: WRAP, lineSpacing: 8, shadow: true });
    this.ui.add([rule, t]);
    this.fitBlock(t, str, [rule]);
    this.type(t, str, 1);
  }

  /** Raises the text block so long passages never run off the bottom of the screen. */
  private fitBlock(body: Phaser.GameObjects.Text, full: string, others: Phaser.GameObjects.Components.Transform[]): void {
    body.setText(full);
    const over = body.y + body.height - (H - 34);
    body.setText('');
    if (over <= 0) return;
    for (const o of [body, ...others]) o.y -= over;
  }

  private castFor(who: string): { name: string; key: string; enemy: boolean } {
    const ch = CHARACTERS.find((c) => c.id === who);
    if (ch) return { name: ch.name.split(' ')[0], key: ensurePortrait(this, ch.id), enemy: false };
    const en = ENEMIES.find((e) => e.id === who || e.name === who);
    if (en) return { name: en.name, key: `enemy:${en.kind}`, enemy: true };
    return { name: who, key: '', enemy: false };
  }

  private dimCast(all: boolean, except?: string): void {
    for (const c of this.cast) {
      const on = !all && c.who === except;
      this.tweens.add({ targets: c.obj, alpha: on ? 1 : all ? 0.0 : 0.45, duration: 260 });
    }
  }

  private line(who: string, str: string): void {
    this.clearUi();
    const info = this.castFor(who);
    if (info.key) this.enter(who, info.key, info.enemy);
    this.dimCast(!info.key, who);
    const name = text(this, TX, NAME_Y, info.name, { size: 32, color: info.enemy ? '#e7a0b8' : CSS.cream, spacing: 1, shadow: true }).setOrigin(0, 0.5);
    const rule = this.add.rectangle(TX, RULE_Y, WRAP, 1, info.enemy ? 0xb04a6a : 0xe8dcc0, 0.35).setOrigin(0, 0.5);
    const body = text(this, TX, BODY_Y, '', { size: 30, color: CSS.cream, wrap: WRAP, lineSpacing: 8, shadow: true });
    this.ui.add([rule, name, body]);
    // Speakers without art get a small head medallion beside their name.
    if (!info.key) {
      const hc = this.add.circle(TX - 70, NAME_Y + 34, 44, 0x15131a, 0.9).setStrokeStyle(1.5, 0xe8dcc0, 0.4);
      const q = text(this, TX - 70, NAME_Y + 34, '?', { size: 40, font: 'display', color: CSS.creamDim }).setOrigin(0.5);
      this.ui.add([hc, q]);
      this.fitBlock(body, str, [rule, name, hc, q]);
    } else {
      this.fitBlock(body, str, [rule, name]);
    }
    this.type(body, str, 2);
  }

  /** One speaker at a time, centre stage; a new speaker cross-fades in over the last. */
  private enter(who: string, key: string, enemy: boolean): void {
    if (this.cast.some((c) => c.who === who)) return;
    for (const old of this.cast) {
      const o = old.obj;
      this.tweens.add({ targets: o, alpha: 0, duration: 380, onComplete: () => o.destroy() });
    }
    this.cast = [];
    const x = W / 2 + 40;
    let obj: LivingSprite | Phaser.GameObjects.Image;
    if (enemy) {
      const glow = this.add.image(x, H / 2, 'fx:glow').setTint(0x6a2a8a).setDisplaySize(1000, 900).setAlpha(0.4).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      const img = this.add.image(x, H - 120, key).setOrigin(0.5, 1).setDepth(10);
      img.setScale(Math.min(760 / img.height, 760 / img.width));
      this.tweens.add({ targets: glow, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1 });
      img.once(Phaser.GameObjects.Events.DESTROY, () => glow.destroy());
      obj = img;
    } else {
      // Waist-up framing: tall portrait, feet below the frame edge.
      obj = livingPortrait(this, x, H + 220, key, 0.82, 1180, 1100).setDepth(10);
    }
    obj.setAlpha(0).setY(obj.y + 12);
    this.tweens.add({ targets: obj, alpha: 1, y: obj.y - 12, duration: 460, ease: 'Sine.easeOut' });
    this.cast.push({ who, side: 'L', obj });
  }

  /** Segmented clock stamp in the corner, the way the reference opens a scene. */
  private stamp(time: string): void {
    const t = text(this, 70, 150, time.split('').join(' '), { size: 46, font: 'body', color: '#e8dcc0', spacing: 4 }).setDepth(80).setAlpha(0);
    t.setFontFamily('"Courier New", monospace');
    this.tweens.add({ targets: t, alpha: 0.85, duration: 800 });
    this.tweens.add({ targets: t, alpha: 0, delay: 5200, duration: 1200, onComplete: () => t.destroy() });
  }

  private confirmSkip(): void {
    if (this.asking || this.ending) return;
    this.asking = true;
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive());
    c.add(text(this, W / 2, H / 2 - 150, 'NOTICE', { size: 34, font: 'display', color: CSS.cream, spacing: 6 }).setOrigin(0.5));
    c.add(this.add.rectangle(W / 2, H / 2 - 40, W, 96, 0xefe6d2, 0.95));
    c.add(text(this, W / 2, H / 2 - 40, 'Skip this story?', { size: 30, color: CSS.paperSub }).setOrigin(0.5));
    const btn = (bx: number, label: string, fill: number, color: string, fn: () => void) => {
      const b = this.add.container(bx, H / 2 + 80);
      b.add(this.add.rectangle(0, 0, 300, 60, fill, 0.95));
      b.add(text(this, 0, 0, label, { size: 28, font: 'display', color }).setOrigin(0.5));
      b.setSize(300, 60).setInteractive({ useHandCursor: true }).on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        fn();
      });
      c.add(b);
    };
    btn(W / 2 - 170, 'Cancel', 0xd8d0c0, CSS.paperText, () => {
      audio.sfx('back');
      c.destroy();
      this.time.delayedCall(50, () => (this.asking = false));
    });
    btn(W / 2 + 170, 'Confirm', C.amber, '#fff4e4', () => {
      audio.sfx('tap');
      c.destroy();
      this.finish();
    });
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
  }

  private letter(str: string, sign: string): void {
    this.clearUi();
    this.dimCast(true);
    if (!this.textures.exists('ui:letterPaper')) this.textures.addCanvas('ui:letterPaper', letterPaperCanvas());
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x050302, 0);
    this.tweens.add({ targets: shade, alpha: 0.55, duration: 500 });
    this.ui.add(shade);
    const c = this.add.container(W / 2, H / 2 + 60).setAngle(-1.2).setAlpha(0).setScale(0.96);
    const paper = this.add.image(0, 0, 'ui:letterPaper');
    const hw = LETTER_W / 2;
    const hh = LETTER_H / 2;
    // Ink: a dark iron-gall brown in a period typeface, slightly uneven.
    const long = str.length > 260;
    const body = text(this, -hw + 120, -hh + 92, '', { size: long ? 30 : 34, font: 'letter', italic: true, color: '#2e1d0e', wrap: LETTER_W - 210, lineSpacing: long ? 8 : 12 });
    body.setShadow(0, 0, 'rgba(46,29,14,0.35)', 1.5, false, true);
    // Shrink the hand until the whole letter sits on the paper, clear of the signature.
    body.setText(str);
    for (let size = long ? 30 : 34; size > 20 && body.height > LETTER_H - 200; size -= 2) body.setFontSize(size).setLineSpacing(size > 26 ? 8 : 4);
    body.setText('');
    const sig = text(this, hw - 90, hh - 70, sign, { size: 32, font: 'letter', italic: true, color: '#3a2412' }).setOrigin(1, 0.5).setAlpha(0).setAngle(-3);
    sig.setShadow(0, 0, 'rgba(46,29,14,0.35)', 1.5, false, true);
    const blot = this.add.circle(hw - 80 - sig.width - 18, hh - 62, 5, 0x2e1d0e, 0).setScale(1, 0.8);
    c.add([paper, body, blot, sig]);
    this.ui.add(c);
    this.tweens.add({ targets: c, alpha: 1, y: H / 2 + 10, scale: 1, angle: -0.6, duration: 650, ease: 'Cubic.easeOut' });
    this.type(body, str, 1);
    const reveal = this.time.addEvent({
      delay: 120, loop: true, callback: () => {
        if (!this.typer) {
          this.tweens.add({ targets: sig, alpha: 1, duration: 700 });
          this.tweens.add({ targets: blot, fillAlpha: 0.7, duration: 500, delay: 500 });
          reveal.remove();
        }
      },
    });
  }

  /** Chapter card: emblem, kicker, title and a gilt rule that opens from the centre. */
  private title(kicker: string, title: string, sub?: string): void {
    this.clearUi();
    this.dimCast(true);
    const black = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    const emblem = this.add.image(W / 2, H / 2 - 190, 'ui:emblem').setScale(0.7).setAlpha(0);
    const k = text(this, W / 2, H / 2 - 70, kicker, { size: 30, font: 'display', bold: true, color: CSS.gold, spacing: 14 }).setOrigin(0.5).setAlpha(0);
    const t = text(this, W / 2, H / 2 + 10, title, { size: 92, font: 'display', bold: true, color: CSS.cream, spacing: 4, shadow: true }).setOrigin(0.5).setAlpha(0);
    if (t.width > W - 200) t.setScale((W - 200) / t.width);
    const ruleW = Math.min(W - 240, Math.max(560, t.displayWidth * 0.8));
    const r = this.add.rectangle(W / 2, H / 2 + 82, ruleW, 2, C.gold, 0.9).setScale(0, 1);
    const dl = this.add.rectangle(W / 2 - ruleW / 2 - 14, H / 2 + 82, 8, 8, C.gold, 0.9).setAngle(45).setAlpha(0);
    const dr = this.add.rectangle(W / 2 + ruleW / 2 + 14, H / 2 + 82, 8, 8, C.gold, 0.9).setAngle(45).setAlpha(0);
    const s = text(this, W / 2, H / 2 + 124, sub ?? '', { size: 32, italic: true, color: CSS.creamDim }).setOrigin(0.5).setAlpha(0);
    this.ui.add([black, emblem, k, t, r, dl, dr, s]);
    this.tweens.add({ targets: black, alpha: 0.82, duration: 600 });
    this.tweens.add({ targets: emblem, alpha: 0.5, duration: 900, delay: 200 });
    this.tweens.add({ targets: k, alpha: 1, duration: 600, delay: 300 });
    this.tweens.add({ targets: t, alpha: 1, duration: 900, delay: 500 });
    this.tweens.add({ targets: r, scaleX: 1, duration: 900, delay: 600, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: [dl, dr], alpha: 1, duration: 400, delay: 1300 });
    this.tweens.add({ targets: s, alpha: 1, duration: 700, delay: 900 });
    audio.sfx('reveal4');
    this.busy = true;
    this.time.delayedCall(1500, () => {
      this.busy = false;
      this.nextMark.setAlpha(1);
      const at = this.i;
      if (this.auto) this.time.delayedCall(1500, () => this.auto && this.i === at && this.advance());
    });
  }

  private bell(strokes: number, ominous: boolean, caption?: string): void {
    this.clearUi();
    this.dimCast(true);
    this.busy = true;
    const numeral = text(this, W / 2, H / 2 - 60, '', { size: ominous ? 220 : 170, font: 'display', bold: true, color: ominous ? '#d0505a' : CSS.cream, shadow: true }).setOrigin(0.5).setAlpha(0);
    this.ui.add(numeral);
    if (caption) {
      const t = text(this, W / 2, H / 2 + 150, '', { size: 38, italic: true, color: ominous ? '#f0b0b0' : CSS.cream, wrap: 1300, align: 'center', shadow: true }).setOrigin(0.5);
      this.ui.add(t);
      this.type(t, caption, 1);
    }
    const gap = ominous ? 0 : 320;
    for (let k = 0; k < strokes; k++) {
      this.time.delayedCall(k * gap + (ominous ? 700 : 0), () => {
        if (!numeral.active) return;
        this.bells = Math.min(13, this.bells + 1);
        numeral.setText(ROMAN[this.bells - 1]).setAlpha(1).setScale(ominous ? 1.6 : 1.25);
        this.tweens.add({ targets: numeral, scale: 1, duration: ominous ? 900 : 260, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: numeral, alpha: ominous ? 0.85 : 0.25, duration: ominous ? 1600 : 300 });
        const f = this.add.rectangle(W / 2, H / 2, W, H, ominous ? 0x7a0e18 : 0xfff2d8, ominous ? 0.55 : 0.18).setDepth(65);
        this.tweens.add({ targets: f, alpha: 0, duration: ominous ? 1400 : 280, onComplete: () => f.destroy() });
        this.cameras.main.shake(ominous ? 700 : 120, ominous ? 0.012 : 0.003);
        audio.sfx(ominous ? 'finale' : 'lantern');
      });
    }
    const total = (strokes - 1) * gap + (ominous ? 2300 : 500);
    this.time.delayedCall(total, () => {
      this.busy = false;
      if (!caption) this.advance();
      else if (!this.typer) this.nextMark.setAlpha(1);
    });
  }
}
