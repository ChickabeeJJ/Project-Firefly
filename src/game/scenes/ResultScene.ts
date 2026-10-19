import Phaser from 'phaser';
import { fitPortrait } from '../art/assets';
import { ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getCharacter } from '../data/characters';
import { getStage, nextStageId, stageCode } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { formatQty } from '../systems/growth';
import { RITE } from '../systems/gacha';
import { goToStage, storyAfter } from '../systems/storyFlow';
import { Atmosphere, Button, fadeIn, goTo, ornament, text } from '../ui/kit';
import type { ResultData } from './BattleScene';

/** Victory / defeat summary: big portrait, emblem, objectives, EXP and rewards. */
export class ResultScene extends Phaser.Scene {
  private data_!: ResultData;

  constructor() {
    super('Result');
  }

  create(d: ResultData): void {
    this.data_ = d;
    fadeIn(this);
    const stage = getStage(d.stageId);
    const save = saves.get();
    const mvp = getCharacter(d.mvp);

    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0c0f);
    // A low sun behind the MVP: deep red at its heart, sinking to black at the rim.
    const sunKey = d.won ? 'ui:resultSunWon' : 'ui:resultSunLost';
    if (!this.textures.exists(sunKey)) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 720;
      const g = cv.getContext('2d')!;
      const grad = g.createRadialGradient(360, 300, 20, 360, 360, 360);
      const [a, b] = d.won ? ['rgba(150,36,32,0.78)', 'rgba(70,14,14,0.55)'] : ['rgba(70,60,96,0.7)', 'rgba(36,30,52,0.5)'];
      grad.addColorStop(0, a);
      grad.addColorStop(0.62, b);
      grad.addColorStop(0.9, 'rgba(8,6,8,0.35)');
      grad.addColorStop(1, 'rgba(8,6,8,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(360, 360, 360, 0, Math.PI * 2);
      g.fill();
      this.textures.addCanvas(sunKey, cv);
    }
    const disc = this.add.image(560, 520, 'fx:glow').setTint(d.won ? 0x7a2420 : 0x3a3050).setDisplaySize(980, 980).setAlpha(0.45);
    this.add.image(560, 520, sunKey).setDisplaySize(700, 700);
    this.tweens.add({ targets: disc, alpha: 0.28, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const portrait = fitPortrait(this.add.image(560, H + 30, ensurePortrait(this, mvp.id)).setOrigin(0.5, 1), 0.98, 1060);
    if (!d.won) portrait.setTint(0x8a8aa0);
    portrait.setAlpha(0).setX(500);
    this.tweens.add({ targets: portrait, alpha: 1, x: 560, duration: 600, ease: 'Cubic.easeOut' });
    new Atmosphere(this, { depth: 50, fireflies: d.won ? 10 : 0 });

    const rx = 1340;
    // The painted lantern hangs behind the title, lit for a win and guttering for a loss.
    const lanternArt = this.textures.exists('hf:ui/obj_lantern') ? 'hf:ui/obj_lantern' : this.textures.exists('hf:ui/lantern1') ? 'hf:ui/lantern1' : null;
    const glow = this.add.image(rx, 160, 'fx:glow').setTint(d.won ? 0xffc878 : 0x8a7aa8).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(620, 460).setAlpha(0).setDepth(59);
    this.tweens.add({ targets: glow, alpha: d.won ? 0.42 : 0.18, duration: 1000 });
    if (d.won) this.tweens.add({ targets: glow, alpha: 0.3, duration: 1800, yoyo: true, repeat: -1, delay: 1000, ease: 'Sine.easeInOut' });
    if (lanternArt) {
      const lamp = this.add.image(rx, 40, lanternArt).setOrigin(0.5, 0.1).setDepth(60).setAlpha(0);
      lamp.setScale(250 / lamp.height);
      if (!d.won) lamp.setTint(0x6a6478);
      this.tweens.add({ targets: lamp, alpha: d.won ? 0.34 : 0.2, duration: 1100, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: lamp, angle: { from: -3, to: 3 }, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.add.image(rx, 170, 'ui:emblem').setScale(1.15).setAlpha(0.3).setDepth(60);
    }
    const title = text(this, rx, 170, d.won ? 'VICTORY' : 'DEFEAT', {
      size: 120, font: 'display', bold: true, color: d.won ? '#ffffff' : '#b8a8c8', spacing: 14, shadow: true,
    }).setOrigin(0.5).setDepth(61).setAlpha(0).setScale(1.3);
    if (d.won) title.setTint(0xfff3c8, 0xfff3c8, 0xd0a048, 0xd0a048);
    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 520, ease: 'Back.easeOut' });

    let y = 320;
    text(this, rx - 330, y, stageCode(stage), { size: 34, font: 'display', bold: true, color: CSS.creamDim }).setOrigin(0, 0.5).setDepth(61);
    text(this, rx - 240, y, stage.name, { size: 40, font: 'display', color: CSS.cream }).setOrigin(0, 0.5).setDepth(61);
    ornament(this, rx, y + 44, 680).setDepth(61);
    y += 96;

    const rows = [
      { label: 'Drive back the Dimming', ok: d.outcome.stars.won },
      { label: `Win within ${stage.starRounds} rounds`, ok: d.outcome.stars.inTime },
      { label: 'No Luminary falls', ok: d.outcome.stars.noneFallen },
    ];
    rows.forEach((r, i) => {
      const yy = y + i * 58;
      this.add.rectangle(rx, yy, 680, 50, 0xffffff, 0.04).setDepth(60);
      text(this, rx - 320, yy, r.label, { size: 28, color: r.ok ? CSS.cream : CSS.muted }).setOrigin(0, 0.5).setDepth(61);
      const st = this.add.image(rx + 310, yy, 'icon:star4').setDisplaySize(40, 40).setTint(r.ok ? C.accentStar : 0x4a4a52).setDepth(61).setScale(0);
      this.time.delayedCall(700 + i * 260, () => {
        this.tweens.add({ targets: st, scale: 40 / 96, duration: 300, ease: 'Back.easeOut' });
        if (r.ok) audio.sfx('reveal3');
      });
    });
    y += 210;

    if (d.won) {
      // Team strip (who fought) and reward tiles, as on R1999's victory screen.
      text(this, rx - 330, y, 'TROUPE', { size: 22, font: 'display', bold: true, color: CSS.creamDim, spacing: 4 }).setOrigin(0, 0.5).setDepth(61);
      save.team.forEach((id, i) => {
        const o = save.roster[id];
        const xx = rx - 330 + 170 + i * 150;
        this.add.image(xx, y, `head:${id}`).setDisplaySize(58, 58).setDepth(61);
        if (o) text(this, xx + 38, y, `Lv ${o.level}`, { size: 22, color: CSS.cream }).setOrigin(0, 0.5).setDepth(61);
      });
      y += 70;
      text(this, rx - 330, y, d.outcome.firstClear ? 'REWARDS  ·  FIRST CLEAR' : 'REWARDS', { size: 22, font: 'display', bold: true, color: d.outcome.firstClear ? CSS.goldLight : CSS.creamDim, spacing: 4 }).setOrigin(0, 0.5).setDepth(61);
      y += 80;
      const tiles: [string, number][] = [['icon:glimmer', d.outcome.glimmer], ...Object.entries(d.outcome.items).map(([k, v]) => [`item:${k}`, v as number] as [string, number])];
      tiles.forEach(([key, qty], i) => {
        const tx = rx - 330 + 54 + i * 124;
        const t = this.add.container(tx, y).setDepth(61).setAlpha(0);
        t.add(this.add.rectangle(0, 0, 108, 108, 0x15131a, 0.85).setStrokeStyle(1.5, C.gold, 0.55));
        t.add(this.add.image(0, -8, key).setDisplaySize(key.startsWith('icon') ? 54 : 78, key.startsWith('icon') ? 54 : 78));
        t.add(this.add.rectangle(0, 40, 108, 26, 0x000000, 0.6));
        t.add(text(this, 0, 40, formatQty(qty), { size: 20, bold: true, color: CSS.cream }).setOrigin(0.5));
        this.tweens.add({ targets: t, alpha: 1, y: { from: y + 16, to: y }, delay: 1000 + i * 120, duration: 300, ease: 'Cubic.easeOut' });
      });
    } else {
      text(this, rx - 330, y + 10, d.reason === 'time'
        ? 'The night ran out of rounds. Spend Beats on the strongest Verses and save Finales for the toughest foes.'
        : 'Level your Luminaries by replaying cleared stages, recruit new ones at the Lantern Rite, and watch the enemy intent chips.', {
        size: 28, color: CSS.creamDim, wrap: 680, lineSpacing: 4,
      }).setDepth(61);
      y += 160;
    }

    const quote = d.won ? (stage.outro ? stage.outro : `“${mvp.quote}”  — ${mvp.name.split(' ')[0]}`) : '“We will light it again tomorrow.”';
    // The quote sits on a soft wash that fades out at either end, framed by two hairline rules.
    const qt = text(this, 540, H - 70, quote, { size: 27, italic: true, color: CSS.cream, wrap: 860, align: 'center', shadow: true }).setOrigin(0.5).setDepth(70);
    const qw = Math.min(1040, qt.width + 220);
    const qh = qt.height + 40;
    if (this.textures.exists('ui:bannerBand')) this.add.image(540, H - 70, 'ui:bannerBand').setDisplaySize(qw, qh).setAlpha(0.95).setDepth(69);
    else this.add.rectangle(540, H - 70, qw, qh, 0x050406, 0.5).setDepth(69);
    const qr = this.add.graphics().setDepth(69);
    for (const ry of [H - 70 - qh / 2, H - 70 + qh / 2]) {
      qr.fillStyle(C.gold, 0.5).fillRect(540 - qw * 0.32, ry, qw * 0.64, 1);
      qr.fillStyle(C.gold, 0.9).fillPoints([new Phaser.Math.Vector2(540, ry - 4), new Phaser.Math.Vector2(544, ry), new Phaser.Math.Vector2(540, ry + 4), new Phaser.Math.Vector2(536, ry)], true);
    }

    const next = nextStageId(stage.id);
    const firstRite = save.totalPulls === 0 && save.glimmer >= RITE.cost * 10;
    const by = H - 110;
    if (d.won) {
      if (stage.mode) {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Again', sub: stage.name, style: 'amber', onClick: () => goToStage(this, stage.id) }).setDepth(80);
      } else if (firstRite) {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Continue', sub: 'A Lantern Rite awaits', style: 'amber', onClick: () => this.leave(() => goTo(this, 'Lobby')) }).setDepth(80);
      } else if (next) {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Next Stage', sub: next, style: 'amber', onClick: () => this.leave(() => goToStage(this, next)) }).setDepth(80);
      } else {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Return Home', style: 'amber', onClick: () => this.leave(() => goTo(this, 'Lobby')) }).setDepth(80);
      }
      new Button(this, rx - 190, by, { w: 300, h: 80, label: stage.mode ? 'Trials' : 'Story', style: 'cream', onClick: () => goTo(this, 'Story', { stageId: stage.id }) }).setDepth(80);
    } else {
      new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Retry', style: 'amber', onClick: () => goTo(this, 'Battle', { stageId: stage.id }) }).setDepth(80);
      new Button(this, rx - 190, by, { w: 300, h: 80, label: 'Team', style: 'cream', onClick: () => goTo(this, 'Formation', { stageId: stage.id }) }).setDepth(80);
    }
    audio.play(d.won ? 'lobby' : null);
  }

  /** After a chapter boss falls for the first time, its ending cinematic plays before anything else. */
  private leave(then: () => void): void {
    const d = this.data_;
    const owed = d.won ? storyAfter(d.stageId) : null;
    if (owed) goTo(this, 'Cinematic', { ids: [owed.id], next: owed.chapterEnd ? { scene: 'Lobby' } : { scene: 'Story', data: { stageId: d.stageId } } });
    else then();
  }
}
