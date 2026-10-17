import Phaser from 'phaser';
import { ensureBg } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getEnemy } from '../data/enemies';
import { CHAPTERS, STAGES, getStage } from '../data/stages';
import type { StageDef } from '../data/types';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { frontierStage, isUnlocked, REWARDS } from '../systems/progression';
import { formatQty, fromLegacyLevel, insightLabel, stageItems } from '../systems/growth';
import { CINEMATICS } from '../data/story';
import { goToStage } from '../systems/storyFlow';
import { Atmosphere, Button, fadeIn, goTo, ornament, text } from '../ui/kit';

/** Chapter timeline of stages (adapted from the reference's stage line), with a detail panel. */
export class StoryScene extends Phaser.Scene {
  private chapter = 1;
  private selected!: StageDef;
  private timeline?: Phaser.GameObjects.Container;
  private detail?: Phaser.GameObjects.Container;
  private header?: Phaser.GameObjects.Container;

  constructor() {
    super('Story');
  }

  create(data: { stageId?: string } = {}): void {
    fadeIn(this);
    const save = saves.get();
    const pick = data.stageId ? getStage(data.stageId) : frontierStage(save);
    this.selected = pick;
    this.chapter = pick.chapter;
    this.timeline = undefined;
    this.detail = undefined;
    this.header = undefined;
    this.add.image(W / 2, H / 2, ensureBg(this, 'map')).setDisplaySize(W, H);
    new Atmosphere(this, { depth: 40, fireflies: 4 });
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Lobby') }).setDepth(90);
    new Button(this, 330, 70, { w: 250, h: 64, label: 'Memories', icon: 'story', style: 'dark', size: 24, onClick: () => this.openMemories() }).setDepth(90);
    CHAPTERS.forEach((ch, i) => {
      const unlocked = isUnlocked(save, STAGES.find((s) => s.chapter === ch.id)!.id);
      const b = new Button(this, W - 130 - (CHAPTERS.length - 1 - i) * 210, 70, {
        w: 200, h: 64, label: `Chapter ${ch.id}`, style: ch.id === this.chapter ? 'gold' : 'dark', size: 21, icon: unlocked ? undefined : 'lock',
        onClick: () => {
          if (!unlocked) {
            audio.sfx('deny');
            return;
          }
          this.chapter = ch.id;
          this.selected = STAGES.find((s) => s.chapter === ch.id && isUnlocked(save, s.id) && !(s.id in save.stars)) ?? STAGES.find((s) => s.chapter === ch.id)!;
          this.scene.restart({ stageId: this.selected.id });
        },
      }).setDepth(90);
      if (!unlocked) b.setAlpha(0.6);
    });
    this.render();
    audio.play('lobby');
  }

  private render(): void {
    this.header?.destroy();
    this.timeline?.destroy();
    const ch = CHAPTERS.find((c) => c.id === this.chapter)!;
    this.header = this.add.container(0, 0).setDepth(50);
    this.header.add(text(this, W / 2, 168, `CHAPTER ${ch.id}`, { size: 28, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0.5));
    this.header.add(text(this, W / 2, 226, ch.name.toUpperCase(), { size: 72, font: 'display', bold: true, color: CSS.cream, spacing: 8, shadow: true }).setOrigin(0.5));
    this.header.add(text(this, W / 2, 290, ch.subtitle, { size: 28, italic: true, color: CSS.creamDim }).setOrigin(0.5));
    this.header.add(ornament(this, W / 2, 330, 600));

    const save = saves.get();
    const stages = STAGES.filter((s) => s.chapter === this.chapter);
    const tl = this.add.container(0, 0).setDepth(50);
    const y = 470;
    const x0 = 190;
    const gap = (W - 380) / (stages.length - 1);
    const line = this.add.graphics();
    line.lineStyle(3, C.gold, 0.5).lineBetween(x0 - 60, y, W - x0 + 60, y);
    tl.add(line);
    stages.forEach((s, i) => {
      const x = x0 + i * gap;
      const unlocked = isUnlocked(save, s.id);
      const cleared = s.id in save.stars;
      const sel = s.id === this.selected.id;
      const size = s.boss ? 50 : 38;
      const node = this.add.graphics();
      node.fillStyle(sel ? C.amber : cleared ? 0x2a2620 : 0x15171c, 1);
      node.lineStyle(3, s.boss ? C.danger : sel ? C.gold : cleared ? C.goldDeep : 0x4a4a52, 1);
      const pts = [new Phaser.Math.Vector2(x, y - size), new Phaser.Math.Vector2(x + size, y), new Phaser.Math.Vector2(x, y + size), new Phaser.Math.Vector2(x - size, y)];
      node.fillPoints(pts, true).strokePoints(pts, true);
      tl.add(node);
      tl.add(text(this, x, y, unlocked ? String(s.index).padStart(2, '0') : '', { size: s.boss ? 34 : 28, font: 'display', bold: true, color: sel ? '#fff4e4' : CSS.cream }).setOrigin(0.5));
      if (!unlocked) tl.add(this.add.image(x, y, 'icon:lock').setDisplaySize(34, 34).setAlpha(0.7));
      tl.add(text(this, x, y + 74, unlocked ? s.name : '— locked —', {
        size: 24, color: unlocked ? (sel ? CSS.goldLight : CSS.cream) : CSS.muted, align: 'center', wrap: 200,
      }).setOrigin(0.5, 0));
      if (cleared) {
        for (let k = 0; k < 3; k++) {
          tl.add(this.add.image(x + (k - 1) * 30, y - size - 26, 'icon:star4').setDisplaySize(26, 26).setTint(k < save.stars[s.id] ? 0xf26b3a : 0x3a3a42));
        }
      }
      if (sel) {
        const ring = this.add.image(x, y, 'fx:glow').setTint(C.amberLight).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(220, 220).setAlpha(0.5);
        this.tweens.add({ targets: ring, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
        tl.addAt(ring, 0);
      }
      const zone = this.add.zone(x, y + 40, gap * 0.9, 220).setInteractive({ useHandCursor: unlocked });
      zone.on('pointerup', () => {
        if (!unlocked) {
          audio.sfx('deny');
          return;
        }
        audio.sfx('tap');
        this.selected = s;
        this.render();
      });
      tl.add(zone);
    });
    this.timeline = tl;
    this.renderDetail();
  }

  private renderDetail(): void {
    this.detail?.destroy();
    const s = this.selected;
    const save = saves.get();
    const c = this.add.container(W / 2, 830).setDepth(60);
    const w = 1500;
    c.add(this.add.nineslice(0, 0, 'ui:paper', undefined, w, 330, 16, 16, 16, 16));
    const lx = -w / 2 + 50;
    c.add(text(this, lx, -122, `${s.id}${s.boss ? '  ·  BOSS' : ''}`, { size: 28, font: 'display', bold: true, color: s.boss ? '#a8322a' : CSS.paperSub, spacing: 3 }));
    c.add(text(this, lx, -82, s.name, { size: 50, font: 'display', bold: true, color: CSS.paperText }));
    const rec = fromLegacyLevel(s.level, 4);
    c.add(text(this, lx, -12, `Recommended ${insightLabel(rec.insight)} Lv ${rec.level}   ·   Round limit ${s.roundLimit}   ·   ${s.waves.length} wave${s.waves.length > 1 ? 's' : ''}`, { size: 26, color: CSS.paperSub }));
    const cleared = s.id in save.stars;
    const reward = cleared ? `+${REWARDS.repeatClear} Glimmer` : `+${REWARDS.firstClear} Glimmer first clear (+${REWARDS.perfectBonus} for ★★★)`;
    c.add(this.add.image(lx + 20, 44, 'icon:glimmer').setDisplaySize(40, 40));
    const rt = text(this, lx + 50, 44, reward, { size: 26, color: CSS.paperText }).setOrigin(0, 0.5);
    c.add(rt);
    let ix = lx + 50 + rt.width + 40;
    for (const [id, n] of Object.entries(stageItems(s.level, s.chapter, !cleared, false))) {
      c.add(this.add.image(ix, 44, `item:${id}`).setDisplaySize(46, 46));
      const q = text(this, ix + 26, 44, `×${formatQty(n as number)}`, { size: 22, bold: true, color: CSS.paperText }).setOrigin(0, 0.5);
      c.add(q);
      ix += 26 + q.width + 26;
    }
    const goals = `★ Win   ★ Within ${s.starRounds} rounds   ★ No one falls`;
    c.add(text(this, lx, 90, goals, { size: 26, color: '#9a5a2a' }));
    if (s.rule) {
      c.add(text(this, lx + 620, -122, s.rule === 'fireflyBloom' ? '✦ Firefly Bloom: two fireflies per round' : '✦ Restless Dim: enemies start with 2 Ardor', { size: 24, italic: true, color: '#6a7a2a' }));
    }

    // Enemy line-up
    const ids = [...new Set(s.waves.flat())];
    ids.forEach((id, i) => {
      const e = getEnemy(id);
      const ex = 230 + i * 140;
      const img = this.add.image(ex, 30, `enemy:${e.kind}`).setOrigin(0.5, 1);
      img.setScale(Math.min(120 / img.height, 120 / img.width));
      c.add(this.add.circle(ex, -30, 66, 0x1a1c22, 0.85));
      c.add(img);
      c.add(this.add.image(ex + 46, -80, `icon:${e.mood}`).setDisplaySize(34, 34));
      const lbl = text(this, ex, 50, e.name.replace(/^The /, ''), { size: 20, color: CSS.paperSub }).setOrigin(0.5);
      if (lbl.width > 128) lbl.setScale(128 / lbl.width);
      c.add(lbl);
    });

    const start = new Button(this, w / 2 - 170, 104, {
      w: 280, h: 80, label: 'Begin', style: 'amber', size: 36, onClick: () => void this.begin(s),
    });
    c.add(start);
    if (cleared && s.outro) c.add(text(this, 0, 205, `“${s.outro}”`, { size: 24, italic: true, color: CSS.creamDim, align: 'center' }).setOrigin(0.5));
    this.detail = c;
  }

  private async begin(s: StageDef): Promise<void> {
    goToStage(this, s.id);
  }

  /** Archive of story cinematics already watched, to replay at will. */
  private openMemories(): void {
    const c = this.add.container(0, 0).setDepth(3000);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 0.85).setInteractive();
    const panel = this.add.nineslice(W / 2, H / 2, 'ui:dark', undefined, 1100, 820, 14, 14, 14, 14);
    const title = text(this, W / 2, H / 2 - 360, 'MEMORIES', { size: 48, font: 'display', bold: true, color: CSS.goldLight, spacing: 8 }).setOrigin(0.5);
    c.add([dim, panel, title, ornament(this, W / 2, H / 2 - 312, 520)]);
    const close = () => c.destroy();
    dim.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Math.abs(p.x - W / 2) > 550 || Math.abs(p.y - H / 2) > 410) close();
    });
    c.add(new Button(this, W / 2 + 490, H / 2 - 360, { w: 64, h: 64, label: '', icon: 'close', style: 'dark', sfx: 'back', onClick: close }));
    CINEMATICS.forEach((cin, i) => {
      const y = H / 2 - 250 + i * 76;
      const seen = saves.hasHint(`cine:${cin.id}`);
      const row = this.add.container(W / 2, y);
      row.add(this.add.rectangle(0, 0, 960, 64, seen ? 0x1a1820 : 0x101014, 0.9).setStrokeStyle(1.5, C.gold, seen ? 0.5 : 0.15));
      row.add(text(this, -450, 0, seen ? cin.name : '— not yet witnessed —', { size: 28, font: 'display', bold: seen, color: seen ? CSS.cream : CSS.muted }).setOrigin(0, 0.5));
      if (seen) {
        row.add(text(this, 450, 0, 'Replay ▸', { size: 24, italic: true, color: CSS.goldLight }).setOrigin(1, 0.5));
        row.setSize(960, 64).setInteractive({ useHandCursor: true });
        row.on('pointerup', () => {
          audio.sfx('tap');
          goTo(this, 'Cinematic', { ids: [cin.id], next: { scene: 'Story' } });
        });
      }
      c.add(row);
    });
  }
}
