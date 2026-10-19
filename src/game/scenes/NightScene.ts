import Phaser from 'phaser';
import { clockHandCanvas } from '../art/clockFace';
import { dropIn } from '../art/assets';
import { ensureBg } from '../art/registry';
import { audio } from '../audio/AudioController';
import { getCharacter } from '../data/characters';
import { getEnemy } from '../data/enemies';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { Rng } from '../battle/rng';
import { formatQty, type ItemId } from '../systems/growth';
import {
  afterBattle, aliveTeam, CURIO, ENDINGS, ending, HOUR_TALES, KIND_TALES, currentNode, draftKeepsakes, endRun, HOURS, keepsake, letter, MILESTONES, type NightNode,
  type NightRun, type NodeKind, omen, ordinal, reachable, runRewards, startRun, stageFor,
} from '../systems/longnight';
import { Atmosphere, Button, fadeIn, goTo, ornament, softPress, text, toast } from '../ui/kit';
import type { NightResult } from './BattleScene';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
const KIND: Record<NodeKind, { name: string; icon: string; tint: number; blurb: string }> = {
  skirmish: { name: 'Skirmish', icon: 'stat_atk', tint: 0xe8dcc0, blurb: 'A landing held by the Dimmed. Win to earn Embers and choose a Keepsake.' },
  omen: { name: 'Omen', icon: 'motif_fire', tint: 0xe06a5a, blurb: 'A harder fight under an Omen. Better Embers, and a rare Keepsake among the spoils.' },
  sanctuary: { name: 'Sanctuary', icon: 'motif_lantern', tint: 0xf2d27a, blurb: 'A lit chapel on the stair. Rest the troupe, or keep vigil for Embers.' },
  curio: { name: 'Curio', icon: 'motif_key', tint: 0x9ac0e0, blurb: 'A clockmaker’s cabinet. Spend Embers on Keepsakes or mending.' },
  letter: { name: 'Letter', icon: 'motif_scroll', tint: 0xd8c8a8, blurb: 'A letter left on the stair, asking something of you.' },
  boss: { name: 'The Thirteenth Hour', icon: 'motif_watch', tint: 0xffc070, blurb: 'The Hourless King waits at the top of the clock. Win, and the night ends at dawn.' },
};
const MAP_X0 = 200;
const MAP_DX = 128;
const LANE_Y = [380, 520, 660];
const nodeXY = (n: NightNode) => ({ x: MAP_X0 + (n.hour - 1) * MAP_DX, y: LANE_Y[n.lane] });

/**
 * THE LONG NIGHT: the hub (records, rules, Begin), and the run's map — thirteen hours of doors
 * up the Cathedral Clock, with the troupe's wounds, Embers and Keepsakes always in view.
 */
export class NightScene extends Phaser.Scene {
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Night');
  }

  create(data: { result?: NightResult } = {}): void {
    fadeIn(this);
    this.overlay = undefined;
    const save = saves.get();
    // The clock's interior: dark, cold, with a warm light high above.
    this.add.image(W / 2, H / 2, ensureBg(this, 'clocktower')).setDisplaySize(W, H).setTint(0x8a8ea0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x05070c, 0.62);
    this.add.image(W / 2, -80, 'fx:glow').setTint(0xffc078).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(1500, 700).setAlpha(0.16);
    new Atmosphere(this, { depth: 40, fireflies: 7 });
    new Button(this, 110, 70, { w: 150, h: 64, label: 'Back', icon: 'back', style: 'dark', size: 26, sfx: 'back', onClick: () => goTo(this, 'Story', { mode: 'story' }) }).setDepth(90);
    if (save.night.run && !data.result) {
      new Button(this, 290, 70, { w: 190, h: 64, label: 'End Run', icon: 'close', style: 'dark', size: 26, sfx: 'back', onClick: () => this.confirmEnd() }).setDepth(90);
    }
    audio.play('boss');

    if (data.result && save.night.run) {
      this.resolveBattle(save.night.run, data.result);
      return;
    }
    if (save.night.run) this.drawMap(save.night.run);
    else this.drawHub();
  }

  // ================================================================== hub

  private drawHub(): void {
    const save = saves.get();
    const rec = save.night;
    text(this, W / 2, 104, 'THE LONG NIGHT', { size: 64, font: 'display', bold: true, color: CSS.goldLight, spacing: 14, shadow: true }).setOrigin(0.5);
    ornament(this, W / 2, 152, 620);
    text(this, W / 2, 190, 'Climb the Cathedral Clock, one hour at a time, to dawn.', { size: 28, italic: true, color: CSS.creamDim }).setOrigin(0.5);

    // The great dial: its hand rests on your best hour.
    const cx = 470;
    const cy = 470;
    const ornate = dropIn(this, 'ui', 'clock_ornate');
    if (ornate) this.add.image(cx, cy, ornate).setDisplaySize(440, 440);
    else this.add.circle(cx, cy, 230, 0x2a2016).setStrokeStyle(6, C.gold);
    const best = rec.best;
    if (!this.textures.exists('ui:nightHand')) this.textures.addCanvas('ui:nightHand', clockHandCanvas(140, 30));
    const hand = this.add.image(cx, cy, 'ui:nightHand').setOrigin(0.5, 1);
    const angle = (best / HOURS) * 360;
    hand.setAngle(0);
    this.tweens.add({ targets: hand, angle, duration: 1600, ease: 'Cubic.easeOut', delay: 300 });
    this.add.circle(cx, cy, 12, 0xd6b264).setStrokeStyle(2, 0x3a2410);
    text(this, cx, cy + 260, best ? (best >= HOURS ? 'You have seen the dawn' : `Furthest: the ${ordinal(best)} Hour`) : 'The clock has not been climbed', { size: 30, font: 'display', color: CSS.cream }).setOrigin(0.5);
    text(this, cx, cy + 298, `${rec.clears} dawn${rec.clears === 1 ? '' : 's'}  ·  ${rec.runs} night${rec.runs === 1 ? '' : 's'} climbed`, { size: 22, italic: true, color: CSS.creamDim }).setOrigin(0.5);

    // The rules, on a slip of parchment.
    const px = 1240;
    const py = 520;
    const pw = 900;
    const ph = 560;
    this.add.nineslice(px, py, 'ui:paper', undefined, pw, ph, 16, 16, 16, 16);
    text(this, px, py - ph / 2 + 52, 'HOW THE NIGHT IS WALKED', { size: 26, font: 'display', bold: true, color: CSS.paperText, spacing: 6 }).setOrigin(0.5);
    const rules: [string, string][] = [
      ['motif_compass', 'Thirteen hours, a door at a time. Each hour you choose your way: fights, Omens, Sanctuaries, Curio cabinets and Letters.'],
      ['stat_hp', 'Wounds carry over. A Luminary who falls stays fallen — unless a Sanctuary or a Keepsake brings them back.'],
      ['motif_hourglass', 'Every win pays Embers and lets you keep one Keepsake: relics that bend the rules of battle and stack as you climb.'],
      ['motif_watch', 'The Thirteenth Hour holds the Hourless King. The higher you climb, the richer the reward — even if the light fades.'],
    ];
    rules.forEach(([icon, line], i) => {
      const y = py - ph / 2 + 128 + i * 98;
      const key = dropIn(this, 'ui', icon);
      if (key) this.add.image(px - pw / 2 + 74, y, key).setDisplaySize(64, 64);
      text(this, px - pw / 2 + 124, y, line, { size: 23, color: CSS.paperText, wrap: pw - 180, lineSpacing: 3 }).setOrigin(0, 0.5);
    });
    // Rewards preview.
    const r = runRewards(HOURS, true);
    text(this, px, py + ph / 2 - 52, `At dawn: ${r.glimmer} Glimmer · ${formatQty(r.items.dust ?? 0)} Wick Dust · ${formatQty(r.items.sovereign ?? 0)} Sovereigns · materials`, { size: 20, italic: true, color: CSS.paperSub }).setOrigin(0.5);

    // The troupe that will climb.
    const team = save.team.filter((id) => save.roster[id]);
    text(this, px - pw / 2, 876, 'YOUR TROUPE', { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 4 }).setOrigin(0, 0.5);
    team.forEach((id, i) => {
      const x = px - pw / 2 + 30 + i * 96;
      this.add.circle(x + 20, 940, 40, 0x0b0c10, 0.6).setStrokeStyle(1.5, C.gold, 0.6);
      this.add.image(x + 20, 940, `head:${id}`).setDisplaySize(74, 74);
    });
    text(this, px - pw / 2, 1004, 'Your current team climbs.', { size: 22, italic: true, color: CSS.cream }).setOrigin(0, 0.5);
    new Button(this, px + pw / 2 - 210, 930, {
      w: 420, h: 100, label: 'Begin the Night', sub: 'A fresh clock each time', style: 'amber', onClick: () => {
        startRun(saves.get(), (Date.now() ^ (Math.random() * 1e9)) >>> 0);
        saves.commit();
        audio.sfx('lantern');
        this.scene.restart({});
      },
    });
    // Ending badges: earned ones shine; the rest are silhouettes with a hint.
    text(this, cx, 852, `ENDINGS  ·  ${rec.badges.length} / ${ENDINGS.length}`, { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 4 }).setOrigin(0.5);
    ENDINGS.forEach((e, i) => {
      const bx = cx + (i - 2) * 96;
      const got = rec.badges.includes(e.id);
      const key = dropIn(this, 'ui', e.badge);
      const b = this.add.container(bx, 930);
      if (got) b.add(this.add.image(0, 0, 'fx:glow').setTint(0xffe2a0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(110, 110).setAlpha(0.3));
      if (key) {
        const im = this.add.image(0, 0, key).setDisplaySize(84, 84);
        if (!got) im.setTint(0x8a8494).setAlpha(0.55);
        b.add(im);
      }
      b.setSize(90, 90).setInteractive({ useHandCursor: true }).on('pointerup', () => toast(this, got ? `${e.name} — earned` : `${e.name}: ${e.hint}`, 'star4'));
    });
    // Milestones.
    const ms = Object.entries(MILESTONES).map(([h, g]) => `${ordinal(+h)} Hour: ${g}${rec.milestones.includes(+h) ? ' ✓' : ''}`).join('   ·   ');
    text(this, W / 2, H - 46, `First-time bonuses (Glimmer) — ${ms}`, { size: 22, italic: true, color: CSS.cream }).setAlpha(0.85).setOrigin(0.5);
  }

  // ================================================================== map

  private drawMap(run: NightRun): void {
    const cur = currentNode(run);
    const doors = run.pending ? [] : reachable(run);
    const hour = cur?.hour ?? 0;
    text(this, W / 2, 70, 'THE LONG NIGHT', { size: 40, font: 'display', bold: true, color: CSS.goldLight, spacing: 10, shadow: true }).setOrigin(0.5);
    text(this, W / 2, 118, hour ? `The ${ordinal(hour)} Hour has passed` : 'The first stair waits', { size: 26, italic: true, color: CSS.cream }).setOrigin(0.5);

    // Embers.
    const ember = dropIn(this, 'ui', 'motif_fire');
    const ec = this.add.container(W - 210, 70);
    ec.add(this.add.rectangle(0, 0, 300, 56, 0x0b0c10, 0.6).setStrokeStyle(1.5, C.gold, 0.5));
    if (ember) ec.add(this.add.image(-112, 0, ember).setDisplaySize(46, 46));
    ec.add(text(this, -80, 0, `${run.embers} Embers`, { size: 28, bold: true, color: CSS.cream }).setOrigin(0, 0.5));

    // Hour numerals along the top of the map.
    for (let h = 1; h <= HOURS; h++) {
      const x = MAP_X0 + (h - 1) * MAP_DX;
      const passed = h <= hour;
      text(this, x, 270, ROMAN[h - 1], { size: h === HOURS ? 30 : 24, font: 'display', bold: h === HOURS, color: passed ? CSS.goldLight : h === HOURS ? '#e08a7a' : CSS.creamDim }).setOrigin(0.5).setAlpha(passed ? 1 : 0.7);
      this.add.rectangle(x, 300, 1, 16, C.gold, passed ? 0.8 : 0.3);
    }
    this.add.rectangle(W / 2, 300, MAP_DX * (HOURS - 1), 1, C.gold, 0.3);
    if (hour) this.add.rectangle(MAP_X0, 300, MAP_DX * (hour - 1), 2, C.gold, 0.9).setOrigin(0, 0.5);

    // Paths: faint for the unwalked stair, gilt for the way you came.
    const g = this.add.graphics();
    const walked = new Set<string>();
    for (let i = 1; i < run.path.length; i++) walked.add(`${run.path[i - 1]}>${run.path[i]}`);
    for (const n of run.nodes) {
      const a = nodeXY(n);
      for (const id of n.next) {
        const m = run.nodes.find((x) => x.id === id)!;
        const b = nodeXY(m);
        const on = walked.has(`${n.id}>${m.id}`);
        const open = cur?.id === n.id && doors.some((d) => d.id === m.id);
        g.lineStyle(on ? 4 : open ? 3 : 2, on ? C.gold : open ? 0xf2d892 : 0xe8dcc0, on ? 0.95 : open ? 0.7 : 0.16);
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }

    // Doors.
    for (const n of run.nodes) this.drawNode(run, n, doors.some((d) => d.id === n.id), run.path.includes(n.id), cur?.id === n.id);

    // Legend.
    (['skirmish', 'omen', 'sanctuary', 'curio', 'letter', 'boss'] as NodeKind[]).forEach((k, i) => {
      const x = 260 + i * 250;
      const key = dropIn(this, 'ui', KIND[k].icon);
      if (key) this.add.image(x, 790, key).setDisplaySize(40, 40);
      text(this, x + 28, 790, KIND[k].name, { size: 22, color: CSS.cream }).setOrigin(0, 0.5);
    });

    this.drawTroupe(run);
    this.drawKeepsakes(run);

    if (run.pending?.kind === 'spoils') this.showSpoils(run);
    else if (run.pending?.kind === 'event') this.openEvent(run, run.nodes.find((n) => n.id === (run.pending as { node: string }).node)!);
  }

  /** Ending a run early keeps what the climb has earned so far. */
  private confirmEnd(): void {
    if (this.overlay) return;
    const run = saves.get().night.run;
    if (!run) return;
    const { c, x, y, close } = this.panel(980, 500, 'End the Night?', 'LEAVE THE CLOCK');
    const hours = Math.max(0, run.path.length);
    c.add(text(this, x, y - 20, hours ? `The troupe has climbed ${hours} hour${hours === 1 ? '' : 's'}. You keep every reward earned so far; the clock resets for the next night.` : 'Nothing has been climbed yet. The clock resets for the next night.', { size: 25, italic: true, color: CSS.cream, wrap: 800, align: 'center', lineSpacing: 5 }).setOrigin(0.5));
    c.add(new Button(this, x - 190, y + 140, { w: 320, h: 80, label: 'Keep climbing', style: 'dark', size: 26, sfx: 'back', onClick: close }));
    c.add(new Button(this, x + 190, y + 140, { w: 320, h: 80, label: 'End the night', style: 'amber', size: 26, onClick: () => {
      close();
      audio.sfx('back');
      this.finish(false, true);
    } }));
  }

  private drawNode(run: NightRun, n: NightNode, open: boolean, visited: boolean, here: boolean): void {
    const { x, y } = nodeXY(n);
    const k = KIND[n.kind];
    const big = n.kind === 'boss';
    const r = big ? 58 : 42;
    const c = this.add.container(x, y);
    if (open) {
      const halo = this.add.image(0, 0, 'fx:glow').setTint(0xffd890).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(r * 4, r * 4).setAlpha(0.3);
      c.add(halo);
      this.tweens.add({ targets: halo, alpha: 0.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    c.add(this.add.circle(0, 0, r, visited ? 0x2a2418 : 0x0b0c10, 0.92).setStrokeStyle(here ? 4 : open ? 3 : 1.5, here || open ? C.gold : k.tint, here || open ? 1 : 0.45));
    if (n.kind === 'omen') c.add(this.add.circle(0, 0, r + 7, 0, 0).setStrokeStyle(1.5, 0xe06a5a, open ? 0.9 : 0.4));
    const key = dropIn(this, 'ui', k.icon);
    if (key) c.add(this.add.image(0, 0, key).setDisplaySize(r * 1.35, r * 1.35).setAlpha(open || here ? 1 : visited ? 0.55 : 0.4));
    if (visited && !here) c.add(text(this, r * 0.55, r * 0.55, '✓', { size: 22, bold: true, color: CSS.goldLight }).setOrigin(0.5));
    if (here) {
      // The troupe's lantern marks where you stand.
      const lamp = this.add.image(0, -r - 34, 'fx:firefly').setScale(1.1);
      c.add(lamp);
      this.tweens.add({ targets: lamp, y: -r - 42, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (open) {
      c.setSize(r * 2 + 16, r * 2 + 16).setInteractive({ useHandCursor: true });
      softPress(c, () => this.openDoor(run, n), 'tap', 1.08);
      this.tweens.add({ targets: c, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private drawTroupe(run: NightRun): void {
    text(this, 90, 860, 'TROUPE', { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 4 }).setOrigin(0, 0.5);
    run.team.forEach((id, i) => {
      const x = 90 + i * 250;
      const y = 950;
      const f = run.hp[id] ?? 0;
      const fallen = f <= 0;
      this.add.rectangle(x + 110, y, 230, 104, 0x0b0c10, 0.6).setStrokeStyle(1, C.gold, 0.35);
      const head = this.add.image(x + 46, y, `head:${id}`).setDisplaySize(76, 76);
      if (fallen) head.setTint(0x55505a);
      text(this, x + 94, y - 24, getCharacter(id).name.split(' ')[0], { size: 22, font: 'display', color: fallen ? CSS.muted : CSS.cream }).setOrigin(0, 0.5);
      this.add.rectangle(x + 94, y + 12, 118, 12, 0x000000, 0.7).setOrigin(0, 0.5);
      if (!fallen) this.add.rectangle(x + 95, y + 12, 116 * f, 8, f > 0.5 ? 0x6fbf73 : f > 0.25 ? 0xd8b04a : C.danger).setOrigin(0, 0.5);
      text(this, x + 94, y + 36, fallen ? 'Fallen' : `${Math.round(f * 100)}%`, { size: 21, italic: !fallen, color: fallen ? '#e8a090' : CSS.cream }).setOrigin(0, 0.5);
    });
  }

  private drawKeepsakes(run: NightRun): void {
    const x0 = 90 + Math.max(3, run.team.length) * 250 + 30;
    text(this, x0, 860, `KEEPSAKES  ·  ${run.keepsakes.length}`, { size: 22, font: 'display', bold: true, color: CSS.cream, spacing: 4 }).setOrigin(0, 0.5);
    if (!run.keepsakes.length) text(this, x0, 950, 'Win a fight to choose your first.', { size: 23, italic: true, color: CSS.cream }).setAlpha(0.85).setOrigin(0, 0.5);
    run.keepsakes.forEach((id, i) => {
      const k = keepsake(id);
      const x = x0 + 40 + (i % 10) * 82;
      const y = 920 + Math.floor(i / 10) * 74;
      const c = this.add.container(x, y);
      c.add(this.add.circle(0, 0, 34, 0x0b0c10, 0.7).setStrokeStyle(1.5, k.rare ? 0xffd890 : C.gold, k.rare ? 1 : 0.5));
      if (this.textures.exists(k.icon)) c.add(this.add.image(0, 0, k.icon).setDisplaySize(52, 52));
      c.setSize(70, 70).setInteractive({ useHandCursor: true }).on('pointerup', () => toast(this, `${k.name} — ${k.blurb}`, 'star4'));
    });
  }

  // ================================================================== doors

  private openDoor(run: NightRun, n: NightNode): void {
    if (this.overlay) return;
    if (n.kind === 'skirmish' || n.kind === 'omen' || n.kind === 'boss') this.battlePanel(run, n);
    else {
      run.path.push(n.id);
      run.pending = { kind: 'event', node: n.id };
      saves.commit();
      this.scene.restart({});
    }
  }

  private panel(w: number, h: number, title: string, kicker?: string): { c: Phaser.GameObjects.Container; x: number; y: number; close: () => void } {
    const c = this.add.container(0, 0).setDepth(500);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.66).setInteractive());
    const x = W / 2;
    const y = H / 2 - 20;
    c.add(this.add.nineslice(x, y, 'ui:dark', undefined, w, h, 14, 14, 14, 14));
    if (kicker) c.add(text(this, x, y - h / 2 + 40, kicker, { size: 20, font: 'display', color: CSS.creamDim, spacing: 6 }).setOrigin(0.5));
    c.add(text(this, x, y - h / 2 + (kicker ? 84 : 56), title, { size: 44, font: 'display', bold: true, color: CSS.goldLight, spacing: 4 }).setOrigin(0.5));
    c.add(ornament(this, x, y - h / 2 + (kicker ? 124 : 96), Math.min(560, w - 120)));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 260, ease: 'Sine.easeOut' });
    this.overlay = c;
    const close = () => {
      this.overlay = undefined;
      this.tweens.add({ targets: c, alpha: 0, duration: 180, onComplete: () => c.destroy() });
    };
    return { c, x, y, close };
  }

  /** The hour's little scene, as on a page: the landing, then what waits behind this door. */
  private tale(c: Phaser.GameObjects.Container, x: number, y: number, n: NightNode): number {
    const t = text(this, x, y, HOUR_TALES[n.hour - 1], { size: 23, font: 'letter', italic: true, color: CSS.cream, wrap: 1000, align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    c.add(t);
    const k = text(this, x, y + t.height / 2 + 26, KIND_TALES[n.kind], { size: 21, italic: true, color: n.kind === 'omen' ? '#e8a090' : CSS.goldLight, wrap: 1000, align: 'center' }).setOrigin(0.5);
    c.add(k);
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 900, ease: 'Sine.easeOut' });
    return k.y + k.height / 2;
  }

  private battlePanel(run: NightRun, n: NightNode): void {
    const k = KIND[n.kind];
    const stage = stageFor(run, n);
    const { c, x, y, close } = this.panel(1160, 780, n.kind === 'boss' ? k.name : `${k.name} · the ${ordinal(n.hour)} Hour`, n.kind === 'boss' ? 'THE TOP OF THE CLOCK' : 'A DOOR ON THE STAIR');
    this.tale(c, x, y - 196, n);
    // Who waits behind it.
    const foes = [...new Set((n.waves ?? []).flat())];
    foes.forEach((id, i) => {
      const e = getEnemy(id);
      const fx = x + (i - (foes.length - 1) / 2) * 170;
      c.add(this.add.circle(fx, y + 10, 62, 0x15131a, 0.9).setStrokeStyle(1.5, e.boss ? C.danger : C.gold, 0.6));
      const img = this.add.image(fx, y + 10, `enemy:${e.kind}`);
      img.setScale(Math.min(112 / img.width, 112 / img.height));
      c.add(img);
      c.add(text(this, fx, y + 92, e.name, { size: 19, color: e.boss ? '#e8a090' : CSS.cream }).setOrigin(0.5));
    });
    let info = `Level ${stage.level}  ·  ${stage.waves.length} wave${stage.waves.length > 1 ? 's' : ''}  ·  ${aliveTeam(run).length} Luminaries standing`;
    if (n.omen) info += run.keepsakes.includes('umbrella') ? '  ·  Omen sheltered by the Black Umbrella' : `  ·  Omen: ${omen(n.omen).name} — ${omen(n.omen).blurb}`;
    c.add(text(this, x, y + 148, info, { size: 21, color: n.omen ? '#e8b0a0' : CSS.creamDim, wrap: 960, align: 'center' }).setOrigin(0.5));
    c.add(new Button(this, x - 170, y + 270, { w: 260, h: 76, label: 'Not yet', style: 'dark', size: 26, sfx: 'back', onClick: close }));
    c.add(new Button(this, x + 170, y + 270, {
      w: 320, h: 86, label: 'Open the door', style: 'amber', onClick: () => {
        run.path.push(n.id);
        saves.commit();
        goTo(this, 'Battle', { stageId: stage.id, night: true });
      },
    }));
  }

  // ================================================================== after a fight

  private resolveBattle(run: NightRun, res: NightResult): void {
    const node = currentNode(run);
    if (!node) {
      this.drawMap(run);
      return;
    }
    const alive = afterBattle(run, node, res.won, res.hp);
    saves.commit();
    if (!alive || aliveTeam(run).length === 0) {
      this.finish(false);
      return;
    }
    if (node.kind === 'boss') {
      this.finish(true);
      return;
    }
    this.drawMap(run);
  }

  private showSpoils(run: NightRun): void {
    const sp = run.pending as { kind: 'spoils'; choices: string[]; embers: number };
    const { c, x, y, close } = this.panel(1300, 760, 'Spoils of the Hour', `+${sp.embers} EMBERS`);
    c.add(text(this, x, y - 230, 'Keep one Keepsake. It lasts for the rest of the night.', { size: 24, italic: true, color: CSS.creamDim }).setOrigin(0.5));
    const take = (id: string | null) => {
      if (id) run.keepsakes.push(id);
      else run.embers += 15;
      run.pending = undefined;
      saves.commit();
      audio.sfx(id ? 'reveal4' : 'tap');
      close();
      this.time.delayedCall(220, () => this.scene.restart({}));
    };
    sp.choices.forEach((id, i) => {
      const card = this.keepsakeCard(x + (i - (sp.choices.length - 1) / 2) * 360, y + 30, id);
      card.setAlpha(0).setY(card.y + 30);
      this.tweens.add({ targets: card, alpha: 1, y: card.y - 30, duration: 420, delay: 120 + i * 110, ease: 'Sine.easeOut' });
      softPress(card, () => take(id), 'tap', 1.04);
      c.add(card);
    });
    c.add(new Button(this, x, y + 320, { w: 360, h: 64, label: 'Take 15 Embers instead', style: 'dark', size: 22, onClick: () => take(null) }));
  }

  private keepsakeCard(x: number, y: number, id: string, price?: number): Phaser.GameObjects.Container {
    const k = keepsake(id);
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a2420, 0x2a2420, 0x110f0d, 0x110f0d, 1).fillRect(-150, -190, 300, 380);
    g.lineStyle(k.rare ? 3 : 1.5, k.rare ? 0xffd890 : C.gold, k.rare ? 1 : 0.55).strokeRect(-150, -190, 300, 380);
    g.lineStyle(1, C.gold, 0.25).strokeRect(-140, -180, 280, 360);
    c.add(g);
    c.add(this.add.image(0, -88, 'fx:glow').setTint(k.rare ? 0xffd890 : 0xe8dcc0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(240, 200).setAlpha(k.rare ? 0.4 : 0.22));
    if (this.textures.exists(k.icon)) c.add(this.add.image(0, -88, k.icon).setDisplaySize(140, 140));
    if (k.rare) c.add(text(this, 0, -170, 'RARE', { size: 16, font: 'display', bold: true, color: '#ffd890', spacing: 6 }).setOrigin(0.5));
    c.add(text(this, 0, 14, k.name, { size: 27, font: 'display', bold: true, color: CSS.cream, wrap: 270, align: 'center' }).setOrigin(0.5));
    c.add(text(this, 0, 46, k.blurb, { size: 21, color: CSS.cream, wrap: 262, align: 'center', lineSpacing: 2 }).setOrigin(0.5, 0).setAlpha(0.88));
    if (price !== undefined) {
      c.add(this.add.rectangle(0, 166, 300, 48, 0xe8dcc0, 0.95));
      c.add(text(this, 0, 166, `${price} Embers`, { size: 24, bold: true, color: CSS.paperText }).setOrigin(0.5));
    }
    c.setSize(300, 380).setInteractive({ useHandCursor: true });
    return c;
  }

  // ================================================================== events

  private openEvent(run: NightRun, n: NightNode): void {
    if (n.kind === 'sanctuary') this.sanctuary(run, n);
    else if (n.kind === 'curio') this.curio(run, n);
    else this.letterEvent(run, n);
  }

  private done(run: NightRun, msg?: string): void {
    run.pending = undefined;
    saves.commit();
    if (msg) toast(this, msg, 'check');
    this.time.delayedCall(msg ? 900 : 200, () => this.scene.restart({}));
  }

  private sanctuary(run: NightRun, _n: NightNode): void {
    const { c, x, y, close } = this.panel(1100, 700, 'Sanctuary', 'A LIT CHAPEL ON THE STAIR');
    this.tale(c, x, y - 170, _n);
    run.stats ??= { omens: 0, letters: 0, fell: false, sanctuaries: 0 };
    run.stats.sanctuaries++;
    const fallen = run.team.filter((id) => run.hp[id] <= 0).length;
    const opt = (bx: number, title: string, desc: string, fn: () => string) => {
      const b = this.add.container(bx, y + 110);
      b.add(this.add.rectangle(0, 0, 420, 230, 0x15131a, 0.9).setStrokeStyle(1.5, C.gold, 0.6));
      b.add(text(this, 0, -70, title, { size: 32, font: 'display', bold: true, color: CSS.goldLight }).setOrigin(0.5));
      b.add(text(this, 0, 20, desc, { size: 22, color: CSS.cream, wrap: 360, align: 'center', lineSpacing: 3 }).setOrigin(0.5));
      b.setSize(420, 230).setInteractive({ useHandCursor: true });
      softPress(b, () => {
        const m = fn();
        audio.sfx('heal');
        close();
        this.done(run, m);
      }, 'tap', 1.03);
      c.add(b);
    };
    opt(x - 240, 'Rest', `The troupe heals 40%.${fallen ? ' The fallen rise at 30%.' : ''}`, () => {
      for (const id of run.team) run.hp[id] = run.hp[id] <= 0 ? 0.3 : Math.min(1, run.hp[id] + 0.4);
      return 'The troupe rests by the votive light.';
    });
    opt(x + 240, 'Keep vigil', 'Stay awake and tend the flame: +45 Embers and one Keepsake drawn at random.', () => {
      run.embers += 45;
      const rng = new Rng(run.seed ^ 0x5eed ^ run.path.length);
      const k = draftKeepsakes(run, rng, 1)[0];
      if (k) run.keepsakes.push(k);
      return k ? `+45 Embers · ${keepsake(k).name}` : '+45 Embers';
    });
  }

  private curio(run: NightRun, n: NightNode): void {
    const { c, x, y, close } = this.panel(1480, 940, 'Curio Cabinet', 'A CLOCKMAKER’S CABINET');
    const below = this.tale(c, x, y - 270, n);
    const rng = new Rng(run.seed ^ (n.hour * 104729));
    const stock = [...draftKeepsakes(run, rng, 2), ...draftKeepsakes(run, rng, 1, true)].filter((v, i, a) => a.indexOf(v) === i);
    const embers = text(this, x, Math.max(y - 172, below + 30), `You carry ${run.embers} Embers`, { size: 26, bold: true, color: CSS.goldLight }).setOrigin(0.5);
    c.add(embers);
    stock.forEach((id, i) => {
      const price = keepsake(id).rare ? CURIO.rareKeepsake : CURIO.keepsake;
      const card = this.keepsakeCard(x + (i - 1.5) * 340, y + 60, id, price);
      softPress(card, () => {
        if (card.getData('sold')) return;
        if (run.embers < price) {
          audio.sfx('deny');
          toast(this, 'Not enough Embers', 'star4');
          return;
        }
        run.embers -= price;
        run.keepsakes.push(id);
        saves.commit();
        audio.sfx('reveal4');
        card.setData('sold', true).setAlpha(0.35);
        embers.setText(`You carry ${run.embers} Embers`);
      }, 'tap', 1.03);
      c.add(card);
    });
    // Mending at the bench.
    const mend = this.add.container(x + (stock.length - 1.5) * 340, y + 60);
    const mg = this.add.graphics();
    mg.fillGradientStyle(0x2a2420, 0x2a2420, 0x110f0d, 0x110f0d, 1).fillRect(-150, -190, 300, 380);
    mg.lineStyle(1.5, C.gold, 0.55).strokeRect(-150, -190, 300, 380);
    mg.lineStyle(1, C.gold, 0.25).strokeRect(-140, -180, 280, 360);
    mend.add(mg);
    mend.add(this.add.image(0, -88, 'fx:glow').setTint(0x9ad0ff).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(240, 200).setAlpha(0.22));
    const pot = dropIn(this, 'ui', 'obj_potion');
    if (pot) mend.add(this.add.image(0, -88, pot).setDisplaySize(140, 140));
    mend.add(text(this, 0, 14, 'Mend', { size: 27, font: 'display', bold: true, color: CSS.cream }).setOrigin(0.5));
    mend.add(text(this, 0, 46, 'The troupe heals 30%.', { size: 21, color: CSS.cream, wrap: 262, align: 'center' }).setOrigin(0.5, 0).setAlpha(0.88));
    mend.add(this.add.rectangle(0, 166, 300, 48, 0xe8dcc0, 0.95));
    mend.add(text(this, 0, 166, `${CURIO.mend} Embers`, { size: 24, bold: true, color: CSS.paperText }).setOrigin(0.5));
    mend.setSize(300, 380).setInteractive({ useHandCursor: true });
    softPress(mend, () => {
      if (run.embers < CURIO.mend) {
        audio.sfx('deny');
        return;
      }
      run.embers -= CURIO.mend;
      for (const id of run.team) if (run.hp[id] > 0) run.hp[id] = Math.min(1, run.hp[id] + 0.3);
      saves.commit();
      audio.sfx('heal');
      embers.setText(`You carry ${run.embers} Embers`);
    }, 'tap', 1.03);
    c.add(mend);
    c.add(new Button(this, x, y + 362, { w: 300, h: 74, label: 'Leave', style: 'amber', size: 28, onClick: () => {
      close();
      this.done(run);
    } }));
  }

  private letterEvent(run: NightRun, n: NightNode): void {
    const l = letter(n.letter ?? 'debt');
    const c = this.add.container(0, 0).setDepth(500);
    this.overlay = c;
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
    const x = W / 2;
    const y = H / 2 - 40;
    c.add(this.add.nineslice(x, y, 'ui:paper', undefined, 1100, 640, 16, 16, 16, 16));
    c.add(text(this, x, y - 260, l.title, { size: 40, font: 'letter', italic: true, color: CSS.paperText }).setOrigin(0.5));
    const body = text(this, x, y - 40, l.text, { size: 28, font: 'letter', color: '#3a2e20', wrap: 920, lineSpacing: 8, align: 'left' }).setOrigin(0.5);
    c.add(body);
    c.add(text(this, x + 460, Math.min(y + 128, body.y + body.height / 2 + 34), l.sign, { size: 25, font: 'letter', italic: true, color: CSS.paperSub }).setOrigin(1, 0.5));
    l.choices.forEach((ch, i) => {
      const bx = x + (i === 0 ? -250 : 250);
      c.add(new Button(this, bx, y + 200, { w: 460, h: 84, label: ch.label, sub: ch.effect, style: i === 0 ? 'amber' : 'dark', size: 26, onClick: () => {
        const rng = new Rng(run.seed ^ 0x1e77e5);
        const msg = ch.apply(run, rng);
        run.stats ??= { omens: 0, letters: 0, fell: false, sanctuaries: 0 };
        run.stats.letters++;
        audio.sfx('tap');
        this.overlay = undefined;
        c.destroy();
        this.done(run, msg);
      } }));
    });
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 320 });
  }

  // ================================================================== the end of the night

  private finish(cleared: boolean, abandoned = false): void {
    const save = saves.get();
    const res = endRun(save, cleared, abandoned);
    saves.commit();
    audio.sfx(cleared ? 'victory' : 'defeat');
    this.children.removeAll(true);
    this.add.image(W / 2, H / 2, ensureBg(this, cleared ? 'lake' : 'clocktower')).setDisplaySize(W, H).setTint(cleared ? 0xffffff : 0x6a6e80);
    this.add.rectangle(W / 2, H / 2, W, H, 0x05070c, cleared ? 0.35 : 0.62);
    if (cleared) this.add.image(W / 2, H * 0.2, 'fx:glow').setTint(0xffd8a0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(1800, 800).setAlpha(0.5);
    new Atmosphere(this, { depth: 40, fireflies: cleared ? 14 : 3 });
    const title = text(this, W / 2, 170, cleared ? 'DAWN' : 'THE LIGHT FADES', { size: 110, font: 'display', bold: true, color: '#ffffff', spacing: 18, shadow: true }).setOrigin(0.5).setAlpha(0);
    if (cleared) title.setTint(0xfff3c8, 0xfff3c8, 0xd0a048, 0xd0a048);
    else title.setColor('#c8b8d8');
    this.tweens.add({ targets: title, alpha: 1, duration: 900, ease: 'Sine.easeOut' });
    ornament(this, W / 2, 262, 700);
    // The ending: its badge, its name and its short epilogue.
    const told = res.endings[0];
    let yy = 320;
    if (told) {
      const e = ending(told);
      const key = dropIn(this, 'ui', e.badge);
      if (key) {
        const bg = this.add.image(560, 470, 'fx:glow').setTint(0xffe2a0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(380, 380).setAlpha(0.35);
        const im = this.add.image(560, 470, key).setDisplaySize(220, 220).setAlpha(0).setScale(0.2);
        this.tweens.add({ targets: im, alpha: 1, displayWidth: 220, displayHeight: 220, duration: 900, delay: 500, ease: 'Back.easeOut' });
        this.tweens.add({ targets: bg, alpha: 0.15, duration: 1800, yoyo: true, repeat: -1 });
      }
      text(this, 720, 330, res.newBadges.includes(told) ? 'A NEW ENDING' : 'ENDING', { size: 20, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0, 0.5);
      text(this, 720, 380, e.name, { size: 48, font: 'display', bold: true, color: CSS.cream }).setOrigin(0, 0.5);
      const ep = text(this, 720, 420, e.epilogue.join('\n\n'), { size: 24, font: 'letter', italic: true, color: CSS.cream, wrap: 820, lineSpacing: 5 }).setAlpha(0);
      this.tweens.add({ targets: ep, alpha: 1, duration: 1400, delay: 900 });
      const more = res.endings.slice(1).filter((id) => res.newBadges.includes(id));
      if (more.length) text(this, 720, 440 + ep.height + 24, `Also earned: ${more.map((id) => ending(id).name).join(' · ')}`, { size: 21, italic: true, color: CSS.goldLight }).setOrigin(0, 0);
      yy = 700;
    } else {
      text(this, W / 2, 330, res.hours ? `The troupe held the clock until the ${ordinal(res.hours)} Hour.` : 'The night took the first stair.', { size: 30, italic: true, color: CSS.cream, wrap: 1300, align: 'center' }).setOrigin(0.5);
      yy = 560;
    }
    if (res.record) text(this, W / 2, yy + 186, 'A new record', { size: 24, font: 'display', bold: true, color: CSS.goldLight, spacing: 6 }).setOrigin(0.5);
    const tiles: [string, number][] = [['icon:glimmer', res.glimmer + res.bonus], ...Object.entries(res.items).map(([k, v]) => [`item:${k as ItemId}`, v as number] as [string, number])];
    tiles.forEach(([key, qty], i) => {
      const tx = W / 2 + (i - (tiles.length - 1) / 2) * 150;
      const t = this.add.container(tx, yy + 60).setAlpha(0);
      t.add(this.add.rectangle(0, 0, 128, 128, 0x15131a, 0.85).setStrokeStyle(1.5, C.gold, 0.55));
      t.add(this.add.image(0, -10, key).setDisplaySize(84, 84));
      t.add(this.add.rectangle(0, 48, 128, 30, 0x000000, 0.6));
      t.add(text(this, 0, 48, formatQty(qty), { size: 22, bold: true, color: CSS.cream }).setOrigin(0.5));
      this.tweens.add({ targets: t, alpha: 1, y: { from: yy + 80, to: yy + 60 }, duration: 380, delay: 600 + i * 120, ease: 'Sine.easeOut' });
    });
    if (res.bonus) text(this, W / 2, yy + 150, `Includes ${res.bonus} bonus Glimmer for firsts`, { size: 21, italic: true, color: CSS.goldLight }).setOrigin(0.5);
    new Button(this, W / 2, 990, { w: 420, h: 90, label: 'Return to the stair', style: 'amber', onClick: () => this.scene.restart({}) });
  }
}
