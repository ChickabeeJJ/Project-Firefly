import Phaser from 'phaser';
import { ART_FACES_LEFT, ensureBg, ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { CHARACTERS } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { getStage } from '../data/stages';
import { getCinematic } from '../data/story';
import type { SceneBg, Shot } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { Atmosphere, ornament, text } from '../ui/kit';
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
}

const BAR = 104;
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
      this.beats.push({ shot: { kind: 'bg', bg: cin.bg, tone: cin.tone }, seg, bg: cin.bg, tone: cin.tone });
      for (const shot of cin.shots) this.beats.push({ shot, seg, bg: cin.bg, tone: cin.tone });
    });

    this.cameras.main.setBackgroundColor('#000000');
    this.tone = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(2);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.28).setDepth(1);
    new Atmosphere(this, { depth: 40, fireflies: 6 });
    this.ui = this.add.container(0, 0).setDepth(70);
    const top = this.add.rectangle(W / 2, -BAR, W, BAR, 0x000000).setOrigin(0.5, 0).setDepth(60);
    const bot = this.add.rectangle(W / 2, H + BAR, W, BAR, 0x000000).setOrigin(0.5, 1).setDepth(60);
    this.tweens.add({ targets: top, y: 0, duration: 700, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: bot, y: H, duration: 700, ease: 'Cubic.easeOut' });

    const skip = text(this, W - 60, BAR / 2, 'SKIP  ▸▸', { size: 26, font: 'display', bold: true, color: CSS.creamDim, spacing: 4 }).setOrigin(1, 0.5).setDepth(90).setInteractive({ useHandCursor: true });
    skip.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      audio.sfx('back');
      this.finish();
    });
    this.nextMark = text(this, W - 80, H - BAR - 30, '▼', { size: 24, color: CSS.creamDim }).setOrigin(0.5).setDepth(90).setAlpha(0);
    this.tweens.add({ targets: this.nextMark, y: this.nextMark.y + 8, duration: 500, yoyo: true, repeat: -1 });

    this.input.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-ESC', () => this.finish());

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
      case 'bg': this.setBg(s.bg, s.tone); this.wait(500, () => this.advance()); break;
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
    const old = this.ui.list.slice();
    for (const o of old) {
      this.tweens.add({ targets: o, alpha: 0, duration: 220, onComplete: () => o.destroy() });
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
    const t = text(this, W / 2, H / 2, '', { size: 40, italic: true, color: CSS.cream, wrap: 1300, align: 'center', lineSpacing: 10, shadow: true }).setOrigin(0.5);
    const r1 = ornament(this, W / 2, H / 2 - 120, 460).setAlpha(0);
    const r2 = ornament(this, W / 2, H / 2 + 120, 460).setAlpha(0);
    this.ui.add([r1, r2, t]);
    this.tweens.add({ targets: [r1, r2], alpha: 0.7, duration: 600 });
    this.type(t, str, 1);
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
    // dialogue panel
    const panelY = H - BAR - 190;
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.88, 0.88);
    shade.fillRect(0, panelY - 150, W, 90);
    shade.fillStyle(0x000000, 0.88);
    shade.fillRect(0, panelY - 60, W, H - BAR - panelY + 60);
    const name = text(this, W / 2 - 600, panelY - 52, info.name, { size: 38, font: 'display', bold: true, color: info.enemy ? '#e7a0b8' : CSS.goldLight, spacing: 3, shadow: true });
    const rule = this.add.rectangle(W / 2 - 600, panelY + 2, 1200, 2, info.enemy ? 0xb04a6a : C.gold, 0.6).setOrigin(0, 0.5);
    const body = text(this, W / 2 - 600, panelY + 22, '', { size: 34, color: CSS.cream, wrap: 1200, lineSpacing: 8, shadow: true });
    this.ui.add([shade, rule, name, body]);
    this.type(body, str, 2);
  }

  /** Brings a speaker on stage: allies alternate sides (Corvin stage left), foes take stage right. */
  private enter(who: string, key: string, enemy: boolean): void {
    if (this.cast.some((c) => c.who === who)) return;
    let side: 'L' | 'R';
    if (enemy) side = 'R';
    else if (who === 'wren') side = 'L';
    else {
      const left = this.cast.find((c) => c.side === 'L');
      const right = this.cast.find((c) => c.side === 'R');
      side = !right ? 'R' : !left ? 'L' : right.who === 'wren' ? 'L' : 'R';
    }
    const old = this.cast.find((c) => c.side === side);
    if (old) {
      const o = old.obj;
      this.tweens.add({ targets: o, alpha: 0, x: o.x + (side === 'L' ? -120 : 120), duration: 320, onComplete: () => o.destroy() });
      this.cast = this.cast.filter((c) => c !== old);
    }
    const x = side === 'L' ? 360 : W - 360;
    let obj: LivingSprite | Phaser.GameObjects.Image;
    if (enemy) {
      const glow = this.add.image(x, H / 2 + 40, 'fx:glow').setTint(0x6a2a8a).setDisplaySize(900, 900).setAlpha(0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      const img = this.add.image(x, H - BAR + 30, key).setOrigin(0.5, 1).setDepth(10);
      img.setScale(Math.min(760 / img.height, 720 / img.width)).setFlipX(false);
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1 });
      img.once(Phaser.GameObjects.Events.DESTROY, () => glow.destroy());
      obj = img;
    } else {
      const ls = livingPortrait(this, x, H + 40, key, 0.7, 920, 820).setDepth(10);
      // speakers face each other
      if ((side === 'R') !== ART_FACES_LEFT.has(who)) ls.setScale(-ls.scaleX, ls.scaleY);
      obj = ls;
    }
    const tx = obj.x;
    obj.setAlpha(0).setX(tx + (side === 'L' ? -160 : 160));
    this.tweens.add({ targets: obj, x: tx, alpha: 1, duration: 520, ease: 'Cubic.easeOut' });
    this.cast.push({ who, side, obj });
  }

  private letter(str: string, sign: string): void {
    this.clearUi();
    this.dimCast(true);
    const c = this.add.container(W / 2, H / 2 + 40).setAngle(-1.5).setAlpha(0);
    const paper = this.add.nineslice(0, 0, 'ui:paperPlain', undefined, 980, 540, 14, 14, 14, 14);
    const edge = this.add.rectangle(0, 0, 940, 500).setStrokeStyle(1.5, 0x9a8660, 0.55);
    const seal = this.add.circle(0, -270, 30, 0x8a1e22).setStrokeStyle(3, 0x5a0e10);
    const sealMark = text(this, 0, -270, 'V', { size: 30, font: 'display', bold: true, color: '#e8b0a0' }).setOrigin(0.5);
    const body = text(this, -430, -200, '', { size: 33, italic: true, color: '#2a221a', wrap: 860, lineSpacing: 10 });
    const sig = text(this, 430, 210, sign, { size: 28, italic: true, color: '#5a4a38' }).setOrigin(1, 0.5).setAlpha(0);
    c.add([paper, edge, seal, sealMark, body, sig]);
    this.ui.add(c);
    this.tweens.add({ targets: c, alpha: 1, y: H / 2, duration: 500, ease: 'Cubic.easeOut' });
    this.type(body, str, 1);
    const reveal = this.time.addEvent({
      delay: 120, loop: true, callback: () => {
        if (!this.typer) {
          this.tweens.add({ targets: sig, alpha: 1, duration: 400 });
          reveal.remove();
        }
      },
    });
  }

  private title(kicker: string, title: string, sub?: string): void {
    this.clearUi();
    this.dimCast(true);
    const black = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    const emblem = this.add.image(W / 2, H / 2 - 190, 'ui:emblem').setScale(0.7).setAlpha(0);
    const k = text(this, W / 2, H / 2 - 70, kicker, { size: 30, font: 'display', bold: true, color: CSS.gold, spacing: 14 }).setOrigin(0.5).setAlpha(0);
    const t = text(this, W / 2, H / 2 + 10, title, { size: 92, font: 'display', bold: true, color: CSS.cream, spacing: 4, shadow: true }).setOrigin(0.5).setAlpha(0);
    if (t.width > W - 200) t.setScale((W - 200) / t.width);
    const r = this.add.rectangle(W / 2, H / 2 + 80, 10, 2, C.gold, 0.9);
    const s = text(this, W / 2, H / 2 + 120, sub ?? '', { size: 32, italic: true, color: CSS.creamDim }).setOrigin(0.5).setAlpha(0);
    this.ui.add([black, emblem, k, t, r, s]);
    this.tweens.add({ targets: black, alpha: 0.82, duration: 600 });
    this.tweens.add({ targets: emblem, alpha: 0.5, duration: 900, delay: 200 });
    this.tweens.add({ targets: k, alpha: 1, duration: 600, delay: 300 });
    this.tweens.add({ targets: t, alpha: 1, duration: 900, delay: 500 });
    this.tweens.add({ targets: r, width: 760, duration: 900, delay: 600, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: s, alpha: 1, duration: 700, delay: 900 });
    audio.sfx('reveal4');
    this.busy = true;
    this.time.delayedCall(1400, () => {
      this.busy = false;
      this.nextMark.setAlpha(1);
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
