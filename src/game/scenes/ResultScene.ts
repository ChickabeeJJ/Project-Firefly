import Phaser from 'phaser';
import { fitPortrait } from '../art/assets';
import { ensurePortrait } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getCharacter } from '../data/characters';
import { getStage, nextStageId } from '../data/stages';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { expToNext } from '../systems/progression';
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
    text(this, rx - 330, y, stage.id, { size: 34, font: 'display', bold: true, color: CSS.creamDim }).setOrigin(0, 0.5).setDepth(61);
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
      text(this, rx - 330, y, 'TEAM', { size: 24, font: 'display', bold: true, color: CSS.creamDim, spacing: 4 }).setOrigin(0, 0.5).setDepth(61);
      d.outcome.levelUps.forEach((lu, i) => {
        const xx = rx - 230 + i * 230;
        const owned = save.roster[lu.id];
        this.add.image(xx, y + 64, `head:${lu.id}`).setDisplaySize(84, 84).setDepth(61);
        text(this, xx + 54, y + 40, `Lv ${lu.to}`, { size: 28, bold: true, color: lu.to > lu.from ? CSS.goldLight : CSS.cream }).setOrigin(0, 0.5).setDepth(61);
        const bw = 120;
        this.add.rectangle(xx + 54, y + 78, bw, 10, 0x2a2a30).setOrigin(0, 0.5).setDepth(61);
        const fill = this.add.rectangle(xx + 54, y + 78, 0, 10, C.gold).setOrigin(0, 0.5).setDepth(61);
        this.tweens.add({ targets: fill, width: bw * Math.min(1, owned.exp / expToNext(owned.level)), duration: 700, delay: 900 });
        text(this, xx + 54, y + 104, `+${lu.expGained} EXP`, { size: 22, color: CSS.creamDim }).setOrigin(0, 0.5).setDepth(61);
        if (lu.to > lu.from) {
          const up = text(this, xx, y + 4, 'LEVEL UP', { size: 22, font: 'display', bold: true, color: CSS.firefly, spacing: 3 }).setOrigin(0.5).setDepth(62).setAlpha(0);
          this.time.delayedCall(1300 + i * 150, () => {
            audio.sfx('levelup');
            this.tweens.add({ targets: up, alpha: 1, y: y - 6, duration: 300 });
          });
        }
      });
      y += 160;
      const reward = this.add.container(rx - 330, y).setDepth(61);
      reward.add(this.add.image(24, 0, 'icon:glimmer').setDisplaySize(52, 52));
      reward.add(text(this, 60, 0, `+${d.outcome.glimmer} Glimmer`, { size: 34, bold: true, color: CSS.firefly }).setOrigin(0, 0.5));
      if (d.outcome.firstClear) reward.add(text(this, 330, 0, 'First clear', { size: 24, italic: true, color: CSS.goldLight }).setOrigin(0, 0.5));
      reward.setAlpha(0);
      this.tweens.add({ targets: reward, alpha: 1, delay: 1100, duration: 300 });
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
      if (firstRite) {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Continue', sub: 'A Lantern Rite awaits', style: 'amber', onClick: () => this.leave(() => goTo(this, 'Lobby')) }).setDepth(80);
      } else if (next) {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Next Stage', sub: next, style: 'amber', onClick: () => this.leave(() => goToStage(this, next)) }).setDepth(80);
      } else {
        new Button(this, rx + 170, by, { w: 380, h: 92, label: 'Return Home', style: 'amber', onClick: () => this.leave(() => goTo(this, 'Lobby')) }).setDepth(80);
      }
      new Button(this, rx - 190, by, { w: 300, h: 80, label: 'Story', style: 'cream', onClick: () => goTo(this, 'Story', { stageId: stage.id }) }).setDepth(80);
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
    if (owed) goTo(this, 'Cinematic', { ids: [owed], next: { scene: 'Lobby' } });
    else then();
  }
}
