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
    const disc = this.add.image(560, 520, 'fx:glow').setTint(d.won ? 0x9a2a26 : 0x3a3050).setDisplaySize(980, 980).setAlpha(0.85);
    this.add.circle(560, 520, 330, d.won ? 0x7a1f1d : 0x2a2436, 1).setAlpha(0.9);
    this.tweens.add({ targets: disc, alpha: 0.6, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const portrait = fitPortrait(this.add.image(560, H + 30, ensurePortrait(this, mvp.id)).setOrigin(0.5, 1), 0.98, 1060);
    if (!d.won) portrait.setTint(0x8a8aa0);
    portrait.setAlpha(0).setX(500);
    this.tweens.add({ targets: portrait, alpha: 1, x: 560, duration: 600, ease: 'Cubic.easeOut' });
    new Atmosphere(this, { depth: 50, fireflies: d.won ? 10 : 0 });

    const rx = 1340;
    const emblem = this.add.image(rx, 170, 'ui:emblem').setScale(1.15).setAlpha(0).setDepth(60);
    this.tweens.add({ targets: emblem, alpha: d.won ? 0.4 : 0.2, angle: 30, duration: 1200, ease: 'Cubic.easeOut' });
    if (d.won) {
      const rays = this.add.image(rx, 170, 'fx:glow').setTint(C.gold).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(520, 520).setAlpha(0).setDepth(59);
      this.tweens.add({ targets: rays, alpha: 0.35, duration: 900 });
    }
    const title = text(this, rx, 170, d.won ? 'VICTORY' : 'DEFEAT', {
      size: 120, font: 'display', bold: true, color: d.won ? CSS.gold : '#b8a8c8', spacing: 14, shadow: true,
    }).setOrigin(0.5).setDepth(61).setAlpha(0).setScale(1.3);
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
      const st = this.add.image(rx + 310, yy, 'icon:star4').setDisplaySize(40, 40).setTint(r.ok ? 0xf26b3a : 0x4a4a52).setDepth(61).setScale(0);
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
    const qt = text(this, 540, H - 66, quote, { size: 27, italic: true, color: CSS.cream, wrap: 880, align: 'center', shadow: true }).setOrigin(0.5).setDepth(70);
    this.add.rectangle(540, H - 66, Math.min(980, qt.width + 70), qt.height + 26, 0x050406, 0.7).setDepth(69);

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
