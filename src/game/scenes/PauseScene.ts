import Phaser from 'phaser';
import { audio } from '../audio/AudioController';
import { STATUS_INFO } from '../battle/describe';
import { LANTERN, MOOD_ADV } from '../battle/rules';
import { getEnemy } from '../data/enemies';
import { getStage } from '../data/stages';
import type { StatusId } from '../data/types';
import { applyTheme, C, CSS, H, MOOD_NAME, THEMES, W } from '../config/theme';
import { refreshThemeTextures } from '../art/registry';
import { saves } from '../persistence/SaveService';
import { Button, ornament, text, toast } from '../ui/kit';
import type { BattleScene } from './BattleScene';
import { startPrologue } from '../systems/storyFlow';

export interface PauseData {
  mode: 'pause' | 'intel' | 'settings';
  stageId?: string;
  /** Scene to resume when closing a settings panel opened from a menu. */
  from?: string;
}

/** Overlay for pause, battle intel and settings. The scene underneath is paused while open. */
export class PauseScene extends Phaser.Scene {
  private data_!: PauseData;

  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    this.data_ = data;
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.78).setInteractive();
    shade.setAlpha(0);
    this.tweens.add({ targets: shade, alpha: 1, duration: 180 });
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    if (data.mode === 'intel') this.buildIntel();
    else this.buildPause();
  }

  private close(): void {
    audio.sfx('back');
    const from = this.data_.from ?? 'Battle';
    if (from === 'Battle') (this.scene.get('Battle') as BattleScene).resumeFromPause();
    else this.scene.resume(from);
    this.scene.stop();
  }

  private buildPause(): void {
    const inBattle = this.data_.mode === 'pause';
    const pw = 760;
    const ph = inBattle ? 700 : 800;
    const x = W / 2;
    const y = H / 2;
    this.add.nineslice(x, y, 'ui:paper', undefined, pw, ph, 16, 16, 16, 16);
    text(this, x, y - ph / 2 + 64, inBattle ? 'PAUSED' : 'SETTINGS', { size: 52, font: 'display', bold: true, color: CSS.paperText, spacing: 10 }).setOrigin(0.5);
    ornament(this, x, y - ph / 2 + 112, 420, C.goldDeep, 0.8);
    let cy = y - ph / 2 + 190;
    if (inBattle) {
      new Button(this, x, cy, { w: 440, h: 84, label: 'Resume', style: 'amber', onClick: () => this.close() });
      cy += 104;
      new Button(this, x, cy, {
        w: 440, h: 76, label: 'Retry Stage', style: 'cream', onClick: () => {
          this.scene.stop('Battle');
          this.scene.start('Battle', { stageId: this.data_.stageId });
        },
      });
      cy += 96;
      new Button(this, x, cy, {
        w: 440, h: 76, label: 'Retreat', style: 'cream', sfx: 'back', onClick: () => {
          this.scene.stop('Battle');
          this.scene.start('Story', { stageId: this.data_.stageId });
        },
      });
      cy += 110;
    }
    const save = saves.get();
    const toggle = (label: string, key: 'music' | 'sfx', yy: number) => {
      const on = () => save.settings[key] > 0;
      const b = new Button(this, x, yy, {
        w: 440, h: 70, label: `${label}: ${on() ? 'On' : 'Off'}`, style: 'dark', size: 28, icon: key === 'music' ? 'music' : 'sound',
        onClick: () => {
          save.settings[key] = on() ? 0 : key === 'music' ? 0.6 : 0.8;
          audio.setVolumes(save.settings.music, save.settings.sfx);
          saves.commit();
          b.setLabel(`${label}: ${on() ? 'On' : 'Off'}`);
        },
      });
    };
    toggle('Music', 'music', cy);
    toggle('Sound effects', 'sfx', cy + 86);
    if (!inBattle) {
      // Local save: the game writes to this browser after every change; files are a portable backup.
      const stamp = () => (save.savedAt ? `Saved on this device · ${new Date(save.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : 'Not saved yet');
      const saved = text(this, x, cy + 168, stamp(), { size: 20, italic: true, color: CSS.paperSub }).setOrigin(0.5);
      new Button(this, x - 112, cy + 218, {
        w: 216, h: 60, label: 'Export save', style: 'dark', size: 22, onClick: () => {
          saves.exportFile();
          saved.setText(stamp());
          toast(this, 'Save file downloaded');
        },
      });
      new Button(this, x + 112, cy + 218, {
        w: 216, h: 60, label: 'Import save', style: 'dark', size: 22, onClick: () => {
          void saves.importFile().then((ok) => {
            if (!ok) {
              toast(this, 'That file is not a Project Firefly save');
              return;
            }
            toast(this, 'Save loaded');
            this.scene.stop(this.data_.from ?? 'Lobby');
            this.scene.start('Lobby');
          });
        },
      });
      const reset = new Button(this, x, cy + 300, {
        w: 440, h: 64, label: 'Reset progress', style: 'cream', size: 26, sfx: 'back', onClick: () => {
          if (reset.getData('armed')) {
            saves.reset();
            this.scene.stop(this.data_.from ?? 'Lobby');
            startPrologue(this);
            return;
          }
          reset.setData('armed', true);
          reset.setLabel('Tap again to erase');
        },
      });
      // Colour theme: a row of swatches; the room repaints at once.
      text(this, x, cy + 378, 'THEME', { size: 20, font: 'display', bold: true, color: CSS.paperSub, spacing: 6 }).setOrigin(0.5);
      const ids = Object.keys(THEMES);
      ids.forEach((id, i) => {
        const t = THEMES[id];
        const sx = x + (i - (ids.length - 1) / 2) * 128;
        const sy = cy + 440;
        const on = (save.settings.theme ?? 'verdigris') === id;
        const sw = this.add.container(sx, sy);
        const g = this.add.graphics();
        g.fillGradientStyle(t.light, t.light, t.dark, t.dark, 1).fillRoundedRect(-44, -26, 88, 52, 8);
        g.lineStyle(on ? 3 : 1.5, on ? 0x2a241c : 0x9a8660, on ? 1 : 0.7).strokeRoundedRect(-44, -26, 88, 52, 8);
        sw.add(g);
        if (on) sw.add(text(this, 0, 0, '✓', { size: 26, bold: true, color: '#fff6e0' }).setOrigin(0.5));
        sw.add(text(this, 0, 44, t.name, { size: 16, italic: true, color: on ? CSS.paperText : CSS.paperSub }).setOrigin(0.5));
        sw.setSize(96, 60).setInteractive({ useHandCursor: true }).on('pointerup', () => {
          if (on) return;
          audio.sfx('tap');
          save.settings.theme = id;
          saves.commit();
          applyTheme(id);
          refreshThemeTextures(this);
          const from = this.data_.from ?? 'Lobby';
          this.scene.stop(from);
          this.scene.start(from);
        });
      });
      new Button(this, x + pw / 2 - 50, y - ph / 2 + 50, { w: 64, h: 64, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: () => this.close() });
      text(this, x, y + ph / 2 - 36, 'Project Firefly · Vellmoor, 1929', { size: 22, italic: true, color: CSS.paperSub }).setOrigin(0.5);
    }
  }

  private buildIntel(): void {
    const stage = getStage(this.data_.stageId ?? '1-1');
    const pw = 1640;
    const ph = 900;
    const x0 = W / 2 - pw / 2;
    const y0 = H / 2 - ph / 2;
    this.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, pw, ph, 14, 14, 14, 14);
    text(this, W / 2, y0 + 56, 'FIELD NOTES', { size: 46, font: 'display', bold: true, color: CSS.goldLight, spacing: 10 }).setOrigin(0.5);
    ornament(this, W / 2, y0 + 100, 520);
    new Button(this, x0 + pw - 60, y0 + 56, { w: 68, h: 68, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: () => this.close() });

    // Moods
    const mx = x0 + 250;
    const my = y0 + 300;
    text(this, mx, y0 + 150, 'MOODS', { size: 28, font: 'display', bold: true, color: CSS.cream, spacing: 4 }).setOrigin(0.5);
    const pts = [
      { m: 'sun', x: mx, y: my - 90 },
      { m: 'moon', x: mx + 105, y: my + 80 },
      { m: 'star', x: mx - 105, y: my + 80 },
    ] as const;
    const g = this.add.graphics();
    g.lineStyle(4, C.gold, 0.7);
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % 3];
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const sx = p.x + Math.cos(ang) * 50;
      const sy = p.y + Math.sin(ang) * 50;
      const ex = q.x - Math.cos(ang) * 50;
      const ey = q.y - Math.sin(ang) * 50;
      g.lineBetween(sx, sy, ex, ey);
      g.fillStyle(C.gold, 0.9);
      g.fillTriangle(ex, ey, ex - Math.cos(ang - 0.4) * 22, ey - Math.sin(ang - 0.4) * 22, ex - Math.cos(ang + 0.4) * 22, ey - Math.sin(ang + 0.4) * 22);
    });
    for (const p of pts) {
      this.add.image(p.x, p.y, `icon:${p.m}`).setDisplaySize(74, 74);
      text(this, p.x, p.y + 52, MOOD_NAME[p.m], { size: 24, color: CSS.cream }).setOrigin(0.5);
    }
    text(this, mx, my + 180, `Arrows point to the mood they overpower: ×${MOOD_ADV} damage. Hitting against the arrow deals less.`, {
      size: 24, color: CSS.creamDim, wrap: 400, align: 'center',
    }).setOrigin(0.5, 0);

    // Statuses
    const sx = x0 + 520;
    text(this, sx, y0 + 150, 'STATUSES', { size: 28, font: 'display', bold: true, color: CSS.cream, spacing: 4 });
    (Object.keys(STATUS_INFO) as StatusId[]).forEach((id, i) => {
      const yy = y0 + 220 + i * 70;
      this.add.image(sx + 22, yy, `icon:${id}`).setDisplaySize(44, 44);
      text(this, sx + 60, yy - 16, STATUS_INFO[id].name, { size: 26, bold: true, color: STATUS_INFO[id].good ? CSS.goldLight : '#d8a8f0' });
      text(this, sx + 60, yy + 12, STATUS_INFO[id].text, { size: 22, color: CSS.creamDim });
    });
    text(this, sx, y0 + 660, 'FIREFLIES', { size: 28, font: 'display', bold: true, color: CSS.firefly, spacing: 4 });
    text(this, sx, y0 + 700, `Each round a firefly lights one Verse: +${Math.round(LANTERN.litBonus * 100)}% power. Casting it sends the firefly to your Lantern. At ${LANTERN.capacity} fireflies, tap the Lantern for an extra Beat.`, {
      size: 24, color: CSS.cream, wrap: 470, lineSpacing: 2,
    });

    // Enemies of this stage
    const ex = x0 + 1060;
    text(this, ex, y0 + 150, `ENEMIES · ${stage.id}`, { size: 28, font: 'display', bold: true, color: CSS.cream, spacing: 4 });
    const ids = [...new Set(stage.waves.flat())];
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const yy = y0 + 210 + i * 150;
      const img = this.add.image(ex + 50, yy + 60, `enemy:${e.kind}`).setOrigin(0.5, 1);
      img.setScale(Math.min(110 / img.height, 100 / img.width));
      this.add.image(ex + 120, yy + 4, `icon:${e.mood}`).setDisplaySize(34, 34);
      text(this, ex + 146, yy - 12, e.name, { size: 28, bold: true, color: e.boss ? '#ffb0a0' : CSS.cream });
      const moves = e.pattern.map((m) => e.moves.find((x) => x.id === m)!.name).join(' → ');
      text(this, ex + 120, yy + 26, `${moves}  ·  Finale: ${e.finale.name}`, { size: 22, color: CSS.creamDim, wrap: 440 });
      text(this, ex + 120, yy + 82, e.blurb, { size: 22, italic: true, color: CSS.muted, wrap: 440 });
    });

    text(this, W / 2, y0 + ph - 50, `★ Win   ★ Win within ${stage.starRounds} rounds   ★ No Luminary falls   ·   Round limit ${stage.roundLimit}`, {
      size: 26, color: CSS.goldLight,
    }).setOrigin(0.5);
  }
}
