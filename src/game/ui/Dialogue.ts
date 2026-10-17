import Phaser from 'phaser';
import { audio } from '../audio/AudioController';
import type { DialogueLine } from '../data/types';
import { CSS, H, W } from '../config/theme';
import { text } from './kit';

/**
 * Story dialogue overlay: letterboxed scene, portrait, name and typewriter text.
 * Tap advances (first completes the current line); SKIP ends it. Resolves when finished.
 */
export function playDialogue(scene: Phaser.Scene, lines: DialogueLine[], title?: string): Promise<void> {
  return new Promise((resolve) => {
    const root = scene.add.container(0, 0).setDepth(5000);
    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    const top = scene.add.rectangle(W / 2, 0, W, 110, 0x000000, 1).setOrigin(0.5, 0);
    const box = scene.add.image(W / 2, H, 'fx:glow').setOrigin(0.5, 1).setTint(0x000000).setDisplaySize(W * 1.4, 620).setAlpha(0.95);
    const band = scene.add.rectangle(W / 2, H - 150, W, 300, 0x07080a, 0.82);
    const portrait = scene.add.image(230, H - 150, 'ui:white').setDisplaySize(190, 190).setVisible(false);
    const name = text(scene, 360, H - 250, '', { size: 36, font: 'display', bold: true, color: CSS.goldLight, spacing: 2 });
    const body = text(scene, 360, H - 196, '', { size: 34, color: CSS.cream, wrap: 1380, lineSpacing: 6 });
    const next = text(scene, W - 120, H - 60, '▼', { size: 26, color: CSS.creamDim }).setOrigin(0.5);
    scene.tweens.add({ targets: next, y: H - 50, duration: 500, yoyo: true, repeat: -1 });
    const skip = text(scene, W - 80, 56, 'SKIP  ▸▸', { size: 28, font: 'display', bold: true, color: CSS.creamDim, spacing: 3 }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    root.add([shade, box, band, top, portrait, name, body, next, skip]);
    if (title) {
      const t = text(scene, W / 2, H * 0.36, title, { size: 64, font: 'display', color: CSS.cream, spacing: 8, shadow: true }).setOrigin(0.5);
      root.add(t);
      scene.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 500 });
    }

    let i = -1;
    let full = '';
    let shown = 0;
    let typer: Phaser.Time.TimerEvent | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      typer?.remove();
      scene.tweens.add({ targets: root, alpha: 0, duration: 220, onComplete: () => { root.destroy(); resolve(); } });
    };
    const show = () => {
      i++;
      if (i >= lines.length) return finish();
      const l = lines[i];
      name.setText(l.speaker);
      if (l.portrait) {
        portrait.setTexture(`head:${l.portrait}`).setDisplaySize(190, 190).setVisible(true);
        name.setX(360);
        body.setX(360);
      } else {
        portrait.setVisible(false);
        name.setX(160);
        body.setX(160);
      }
      full = l.text;
      shown = 0;
      body.setText('');
      typer?.remove();
      typer = scene.time.addEvent({
        delay: 22, loop: true, callback: () => {
          shown = Math.min(full.length, shown + 2);
          body.setText(full.slice(0, shown));
          if (shown >= full.length) typer?.remove();
        },
      });
    };
    shade.on('pointerup', () => {
      if (shown < full.length) {
        shown = full.length;
        body.setText(full);
        typer?.remove();
      } else {
        audio.sfx('tap');
        show();
      }
    });
    skip.on('pointerup', () => {
      audio.sfx('back');
      finish();
    });
    root.setAlpha(0);
    scene.tweens.add({ targets: root, alpha: 1, duration: 260 });
    scene.time.delayedCall(title ? 900 : 0, show);
  });
}
