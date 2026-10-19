import Phaser from 'phaser';
import { fitPortrait } from '../art/assets';
import { C, CSS, H, W } from '../config/theme';
import { text } from './kit';

/** Reusable battle feedback. Functional effects (hits, heals, statuses) always win over decoration. */
export class BattleFx {
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private motes: Phaser.GameObjects.Particles.ParticleEmitter;
  readonly dim: Phaser.GameObjects.Rectangle;

  constructor(private scene: Phaser.Scene) {
    this.dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x05060a, 1).setAlpha(0).setDepth(15);
    this.sparks = scene.add.particles(0, 0, 'fx:spark', {
      lifespan: { min: 300, max: 600 }, speed: { min: 160, max: 520 }, scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 }, blendMode: Phaser.BlendModes.ADD, emitting: false,
    }).setDepth(55);
    this.motes = scene.add.particles(0, 0, 'fx:dot', {
      lifespan: { min: 600, max: 1100 }, speed: { min: 30, max: 140 }, scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 }, gravityY: -120, blendMode: Phaser.BlendModes.ADD, emitting: false,
    }).setDepth(55);
  }

  setDim(alpha: number, duration = 220): void {
    this.scene.tweens.add({ targets: this.dim, alpha, duration });
  }

  burst(x: number, y: number, color: number, count = 14): void {
    this.sparks.setParticleTint(color);
    this.sparks.explode(count, x, y);
  }

  rise(x: number, y: number, color: number, count = 16): void {
    this.motes.setParticleTint(color);
    this.motes.explode(count, x, y);
  }

  ring(x: number, y: number, color: number, size = 260, duration = 500, flat = false): void {
    const r = this.scene.add.image(x, y, 'fx:ring').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(54)
      .setDisplaySize(size * 0.3, flat ? size * 0.09 : size * 0.3).setAlpha(1);
    this.scene.tweens.add({
      targets: r, displayWidth: size, displayHeight: flat ? size * 0.3 : size, alpha: 0, duration, ease: 'Cubic.easeOut',
      onComplete: () => r.destroy(),
    });
  }

  glowAt(x: number, y: number, color: number, size = 300, duration = 500): void {
    const g = this.scene.add.image(x, y, 'fx:glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(53).setDisplaySize(size, size).setAlpha(0.9);
    this.scene.tweens.add({ targets: g, alpha: 0, scale: g.scale * 1.3, duration, onComplete: () => g.destroy() });
  }

  slash(x: number, y: number, color: number, flip = false, scale = 1): void {
    const s = this.scene.add.image(x, y, 'fx:slash').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(56)
      .setAngle(Phaser.Math.Between(-35, 15)).setFlipX(flip).setScale(0.4 * scale).setAlpha(1);
    this.scene.tweens.add({ targets: s, scale: 1.1 * scale, alpha: 0, duration: 280, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
  }

  beam(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, color: number): void {
    const len = Phaser.Math.Distance.BetweenPoints(from, to);
    const b = this.scene.add.image(from.x, from.y, 'fx:beam').setOrigin(0, 0.5).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(54)
      .setRotation(Phaser.Math.Angle.BetweenPoints(from, to)).setDisplaySize(len, 46).setAlpha(0);
    this.scene.tweens.add({ targets: b, alpha: 1, duration: 90, yoyo: true, hold: 120, onComplete: () => b.destroy() });
  }

  /**
   * Finale volley: light gathers at the caster, then one comet per target arcs across the field —
   * the verse's painted emblem at its head, a trail of mood-coloured motes and gold glints behind —
   * and bursts on arrival with a ring, turning rays and embers. Resolves when the last one lands.
   */
  async finaleVolley(from: Phaser.Math.Vector2, tos: Phaser.Math.Vector2[], color: number, emblem: string | null, hostile = true): Promise<void> {
    const sc = this.scene;
    // Charge: motes spiral in, a ring tightens, the glow swells.
    const charge = sc.add.image(from.x, from.y, 'fx:glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(57).setDisplaySize(80, 80).setAlpha(0.2);
    sc.tweens.add({ targets: charge, displayWidth: 320, displayHeight: 320, alpha: 1, duration: 420, ease: 'Sine.easeIn' });
    const ring = sc.add.image(from.x, from.y, 'fx:ring').setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(57).setDisplaySize(520, 520).setAlpha(0);
    sc.tweens.add({ targets: ring, displayWidth: 90, displayHeight: 90, alpha: 0.9, duration: 420, ease: 'Cubic.easeIn', onComplete: () => ring.destroy() });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 200 + Math.random() * 90;
      const m = sc.add.image(from.x + Math.cos(a) * r, from.y + Math.sin(a) * r, 'fx:dot').setTint(i % 3 ? color : 0xffe9a8).setBlendMode(Phaser.BlendModes.ADD).setDepth(57).setScale(0.3).setAlpha(0);
      sc.tweens.add({ targets: m, x: from.x, y: from.y, alpha: 1, scale: 0.12, angle: 180, duration: 380 + Math.random() * 80, ease: 'Cubic.easeIn', onComplete: () => m.destroy() });
    }
    await new Promise<void>((r) => sc.time.delayedCall(430, r));
    sc.tweens.add({ targets: charge, alpha: 0, duration: 300, onComplete: () => charge.destroy() });
    this.flash(color, 120, 0.18);
    // Launch.
    const shots = tos.map((to, i) => new Promise<void>((done) => {
      sc.time.delayedCall(i * 90, () => {
        const head = sc.add.container(from.x, from.y).setDepth(58);
        head.add(sc.add.image(0, 0, 'fx:glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(170, 170).setAlpha(0.9));
        head.add(sc.add.image(0, 0, 'fx:dot').setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(54, 54));
        if (emblem) {
          const em = sc.add.image(0, 0, emblem).setDisplaySize(84, 84);
          head.add(em);
          sc.tweens.add({ targets: em, angle: 360, duration: 900, repeat: -1 });
        }
        head.setScale(0.6);
        const trail = sc.add.particles(0, 0, 'fx:dot', {
          lifespan: 420, speed: { min: 10, max: 60 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 },
          frequency: 10, tint: color, blendMode: Phaser.BlendModes.ADD,
        }).setDepth(57);
        const glints = sc.add.particles(0, 0, 'fx:spark', {
          lifespan: 360, speed: { min: 40, max: 140 }, scale: { start: 0.35, end: 0 }, alpha: { start: 1, end: 0 },
          frequency: 45, tint: 0xffe9a8, rotate: { min: 0, max: 360 }, blendMode: Phaser.BlendModes.ADD,
        }).setDepth(57);
        trail.startFollow(head);
        glints.startFollow(head);
        // A high arc, each shot a little higher so a volley fans out.
        const ctrl = new Phaser.Math.Vector2((from.x + to.x) / 2, Math.min(from.y, to.y) - 240 - i * 40);
        const curve = new Phaser.Curves.QuadraticBezier(from.clone(), ctrl, to.clone());
        const p = { t: 0 };
        sc.tweens.add({
          targets: p, t: 1, duration: 520, ease: 'Sine.easeIn',
          onUpdate: () => {
            const pt = curve.getPoint(p.t);
            head.setPosition(pt.x, pt.y).setScale(0.6 + p.t * 0.5);
          },
          onComplete: () => {
            trail.stop();
            glints.stop();
            sc.time.delayedCall(500, () => { trail.destroy(); glints.destroy(); });
            head.destroy();
            this.finaleImpact(to.x, to.y, color, hostile);
            done();
          },
        });
      });
    }));
    await Promise.all(shots);
  }

  private finaleImpact(x: number, y: number, color: number, hostile: boolean): void {
    const sc = this.scene;
    this.ring(x, y, 0xfff0c0, 560, 520);
    this.ring(x, y, color, 380, 640, true);
    const rays = sc.add.image(x, y, 'fx:rays').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(55).setDisplaySize(140, 140).setAlpha(0.9);
    sc.tweens.add({ targets: rays, displayWidth: 520, displayHeight: 520, angle: 40, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => rays.destroy() });
    this.glowAt(x, y, 0xffffff, 260, 300);
    this.glowAt(x, y, color, 420, 700);
    this.burst(x, y, 0xffe9a8, 26);
    this.rise(x, y, color, 20);
    if (hostile) this.shake(0.007, 200);
  }

  /** Large italic serif number, gold for critical hits — the reference's signature feedback. */
  number(x: number, y: number, value: number, kind: 'dmg' | 'crit' | 'heal' | 'shield' | 'dot' | 'absorb'): void {
    const style = {
      dmg: { size: 58, color: '#fbf3e2', stroke: '#1a0e0c' },
      crit: { size: 80, color: CSS.goldLight, stroke: '#3a1a08' },
      heal: { size: 52, color: CSS.heal, stroke: '#0c2414' },
      shield: { size: 44, color: CSS.shield, stroke: '#0c1824' },
      dot: { size: 42, color: '#ffb070', stroke: '#2a1206' },
      absorb: { size: 38, color: CSS.shield, stroke: '#0c1824' },
    }[kind];
    const prefix = kind === 'heal' || kind === 'shield' ? '+' : '';
    const t = text(this.scene, x + Phaser.Math.Between(-24, 24), y, `${prefix}${value}`, {
      size: style.size, bold: true, italic: true, color: style.color, stroke: style.stroke, strokeThickness: kind === 'crit' ? 8 : 6,
    }).setOrigin(0.5).setDepth(60).setScale(1.5);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: kind === 'crit' ? 700 : 480, duration: 420, ease: 'Sine.easeIn', onComplete: () => t.destroy() });
    if (kind === 'crit') {
      const c = text(this.scene, t.x, y - 52, 'CRITICAL', { size: 24, font: 'display', bold: true, color: CSS.gold, spacing: 4, stroke: '#2a1206', strokeThickness: 4 }).setOrigin(0.5).setDepth(60);
      this.scene.tweens.add({ targets: c, y: y - 110, alpha: 0, delay: 600, duration: 400, onComplete: () => c.destroy() });
    }
  }

  label(x: number, y: number, str: string, color: string): void {
    const t = text(this.scene, x, y, str, { size: 32, italic: true, bold: true, color, stroke: '#0a0a0c', strokeThickness: 5 }).setOrigin(0.5).setDepth(61).setAlpha(0);
    this.scene.tweens.add({ targets: t, alpha: 1, y: y - 24, duration: 200 });
    this.scene.tweens.add({ targets: t, alpha: 0, y: y - 70, delay: 760, duration: 360, onComplete: () => t.destroy() });
  }

  /** Bezier flight of a firefly between two points. */
  flyFirefly(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, duration = 700): Promise<void> {
    return new Promise((resolve) => {
      const f = this.scene.add.image(from.x, from.y, 'fx:firefly').setBlendMode(Phaser.BlendModes.ADD).setDepth(400).setScale(1.4);
      const ctrl = new Phaser.Math.Vector2((from.x + to.x) / 2 + Phaser.Math.Between(-120, 120), Math.min(from.y, to.y) - 160);
      const curve = new Phaser.Curves.QuadraticBezier(from, ctrl, to);
      const o = { t: 0 };
      this.scene.tweens.add({
        targets: o, t: 1, duration, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const p = curve.getPoint(o.t);
          f.setPosition(p.x, p.y);
          if (Math.random() < 0.5) this.rise(p.x, p.y, C.firefly, 1);
        },
        onComplete: () => {
          f.destroy();
          resolve();
        },
      });
    });
  }

  shake(intensity = 0.004, duration = 160): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(color = 0xffffff, duration = 120, alpha = 0.5): void {
    const r = this.scene.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(700).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: r, alpha: 0, duration, onComplete: () => r.destroy() });
  }

  /** Short centred banner ("WAVE 2", "ROUND 3"). */
  banner(str: string, sub?: string, color: string = CSS.cream): Promise<void> {
    const sc = this.scene;
    if (!sc.textures.exists('ui:bannerBand')) {
      // A band of ink that fades out to both sides, rather than a hard-edged box.
      const cv = document.createElement('canvas');
      cv.width = 1024;
      cv.height = 8;
      const g = cv.getContext('2d')!;
      const grad = g.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, 'rgba(6,7,10,0)');
      grad.addColorStop(0.22, 'rgba(6,7,10,0.82)');
      grad.addColorStop(0.78, 'rgba(6,7,10,0.82)');
      grad.addColorStop(1, 'rgba(6,7,10,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 1024, 8);
      sc.textures.addCanvas('ui:bannerBand', cv);
    }
    const gold = color === CSS.gold;
    return new Promise((resolve) => {
      const bh = sub ? 190 : 160;
      const c = sc.add.container(W / 2, H * 0.42).setDepth(650).setAlpha(0);
      const band = sc.add.image(0, 0, 'ui:bannerBand').setDisplaySize(W * 1.1, bh);
      const glowL = sc.add.image(0, 0, 'fx:glow').setTint(gold ? 0xffd890 : 0x8a7aa8).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(1100, bh * 1.6).setAlpha(0.22);
      const rule = (y: number) => {
        const g = sc.add.graphics();
        g.fillStyle(C.gold, 0.85).fillRect(-560, y - 1, 1120, 2);
        g.fillStyle(C.gold, 0.35).fillRect(-470, y + 5, 940, 1);
        g.fillStyle(C.gold, 1).fillPoints([new Phaser.Math.Vector2(0, y - 8), new Phaser.Math.Vector2(8, y), new Phaser.Math.Vector2(0, y + 8), new Phaser.Math.Vector2(-8, y)], true);
        for (const sx of [-560, 560]) g.fillPoints([new Phaser.Math.Vector2(sx, y - 5), new Phaser.Math.Vector2(sx + 5, y), new Phaser.Math.Vector2(sx, y + 5), new Phaser.Math.Vector2(sx - 5, y)], true);
        return g;
      };
      const t = text(sc, 0, sub ? -20 : 0, str, { size: 84, font: 'display', bold: true, color: '#ffffff', spacing: 22, shadow: true }).setOrigin(0.5);
      if (gold) t.setTint(0xfff3c8, 0xfff3c8, 0xd0a048, 0xd0a048);
      else t.setColor(color);
      c.add([glowL, band, rule(-bh / 2 + 14), rule(bh / 2 - 14), t]);
      if (sub) c.add(text(sc, 0, 50, sub, { size: 28, italic: true, color: CSS.creamDim }).setOrigin(0.5));
      // A slow sheen across the letters.
      const sheen = sc.add.image(-700, sub ? -20 : 0, 'fx:glow').setTint(0xfff6dc).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(160, 140).setAlpha(0.55);
      c.add(sheen);
      sc.tweens.add({ targets: sheen, x: 700, duration: 1100, delay: 250, ease: 'Sine.easeInOut' });
      sc.tweens.add({ targets: c, alpha: 1, duration: 320, ease: 'Sine.easeOut' });
      sc.tweens.add({ targets: t, scaleX: { from: 1.18, to: 1 }, scaleY: { from: 1.18, to: 1 }, duration: 620, ease: 'Cubic.easeOut' });
      if (gold) {
        this.rise(W / 2, H * 0.42, 0xffe9a8, 26);
        sc.time.delayedCall(200, () => this.burst(W / 2, H * 0.42, 0xfff0c0, 14));
      }
      sc.tweens.add({ targets: c, alpha: 0, delay: 1500, duration: 420, ease: 'Sine.easeIn', onComplete: () => { c.destroy(); resolve(); } });
    });
  }

  /**
   * Finale cut-in, staged like a 1920s theatre poster caught on film: a tilted band of ink and
   * the caster's colour, a gilt sunburst, sprocketed film rails, the painted caster sweeping in,
   * gold Cinzel title and a ribbon with name and title. Flickers and scratches like old stock.
   */
  cutIn(portraitKey: string, verseName: string, charName: string, charTitle: string, color: number): Promise<void> {
    return new Promise((resolve) => {
      const sc = this.scene;
      const c = sc.add.container(0, 0).setDepth(680);
      const shade = sc.add.rectangle(W / 2, H / 2, W, H, 0x050304, 0.78);
      const sepia = sc.add.rectangle(W / 2, H / 2, W, H, 0x3a2410, 0.22).setBlendMode(Phaser.BlendModes.MULTIPLY);
      c.add([shade, sepia]);

      const band = sc.add.container(W / 2, H / 2 + 20).setAngle(-6);
      const BW = W * 1.5;
      const BH = 470;
      const deep = Phaser.Display.Color.IntegerToColor(color).darken(55).color;
      band.add(sc.add.rectangle(0, 0, BW, BH, 0x0e0a08, 1));
      band.add(sc.add.rectangle(0, 0, BW, BH, deep, 0.85));
      const wash = sc.add.image(-BW / 2, 0, 'fx:glow').setOrigin(0, 0.5).setDisplaySize(BW * 0.7, BH * 1.6).setTint(color).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
      const rays = sc.add.image(360, 0, 'fx:rays').setTint(C.gold).setAlpha(0.42).setDisplaySize(1200, 560).setBlendMode(Phaser.BlendModes.ADD);
      const grainT = sc.add.tileSprite(0, 0, BW, BH, 'fx:grain').setAlpha(0.14);
      band.add([wash, rays, grainT]);
      for (const y of [-BH / 2 + 34, BH / 2 - 34]) band.add(sc.add.rectangle(0, y, BW, 2, C.gold, 0.85));
      for (const y of [-BH / 2 + 40, BH / 2 - 40]) band.add(sc.add.rectangle(0, y, BW, 1, C.gold, 0.45));
      const film = [-BH / 2 - 10, BH / 2 + 10].map((y) => sc.add.tileSprite(0, y, BW, 56, 'fx:film'));
      band.add(film);

      // Caster: large painted art sweeping in from the left, lit by a warm glow.
      const halo = sc.add.image(-470, 40, 'fx:glow').setTint(color).setDisplaySize(900, 700).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
      // Centred on the band, so head and feet break its edges by the same amount.
      const portrait = fitPortrait(sc.add.image(-1100, 6, portraitKey).setOrigin(0.5, 0.5), 0.66, 720);
      band.add([halo, portrait]);

      // Title block.
      const tx = 360;
      const kicker = text(sc, tx + 400, -128, '◆   F I N A L E   ◆', { size: 28, font: 'display', bold: true, color: CSS.goldLight, spacing: 6, stroke: '#140c06', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
      const title = text(sc, tx + 400, -28, verseName, { size: 104, font: 'display', bold: true, color: '#f6dc8a', stroke: '#120a06', strokeThickness: 12, shadow: true }).setOrigin(0.5).setAlpha(0);
      if (title.width > 900) title.setScale(900 / title.width);
      const grad = title.context.createLinearGradient(0, 0, 0, title.height);
      grad.addColorStop(0, '#fff6d0');
      grad.addColorStop(0.5, '#e8bf5a');
      grad.addColorStop(1, '#a8741e');
      title.setFill(grad);
      const ribbonW = 640;
      const ribbon = sc.add.container(tx + 400, 92).setAlpha(0);
      const rg = sc.add.graphics();
      rg.fillStyle(0x0c0806, 0.92);
      rg.fillPoints([
        new Phaser.Math.Vector2(-ribbonW / 2 - 30, -32), new Phaser.Math.Vector2(ribbonW / 2 + 30, -32), new Phaser.Math.Vector2(ribbonW / 2 + 10, 0),
        new Phaser.Math.Vector2(ribbonW / 2 + 30, 32), new Phaser.Math.Vector2(-ribbonW / 2 - 30, 32), new Phaser.Math.Vector2(-ribbonW / 2 - 10, 0),
      ], true);
      rg.lineStyle(2, C.gold, 0.9);
      rg.strokeRect(-ribbonW / 2, -24, ribbonW, 48);
      const who = text(sc, 0, 0, `${charName}  ·  ${charTitle}`, { size: 30, italic: true, color: CSS.cream }).setOrigin(0.5);
      if (who.width > ribbonW - 30) who.setScale((ribbonW - 30) / who.width);
      ribbon.add([rg, who]);
      band.add([kicker, title, ribbon]);
      c.add(band);

      // Old-film overlay: scratches and flicker.
      const scratches = Array.from({ length: 4 }, () => sc.add.image(Phaser.Math.Between(100, W - 100), H / 2, 'fx:scratch').setDisplaySize(4, H).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
      c.add(scratches);
      const flicker = sc.time.addEvent({
        delay: 70, loop: true, callback: () => {
          sepia.setAlpha(0.16 + Math.random() * 0.14);
          for (const s of scratches) s.setAlpha(Math.random() < 0.18 ? 0.25 + Math.random() * 0.4 : 0).setX(Phaser.Math.Between(80, W - 80));
          for (const f of film) f.tilePositionX += 9;
          grainT.tilePositionX = Math.random() * 200;
          grainT.tilePositionY = Math.random() * 200;
        },
      });

      // Entrance: band slams in vertically, caster sweeps, title types on.
      band.setScale(1, 0.05);
      c.setAlpha(0);
      sc.tweens.add({ targets: c, alpha: 1, duration: 120 });
      sc.tweens.add({ targets: band, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
      sc.tweens.add({ targets: rays, angle: 8, duration: 1900 });
      sc.tweens.add({ targets: portrait, x: -470, duration: 520, delay: 80, ease: 'Cubic.easeOut' });
      sc.tweens.add({ targets: kicker, alpha: 1, x: tx, duration: 360, delay: 220, ease: 'Cubic.easeOut' });
      sc.tweens.add({ targets: title, alpha: 1, x: tx, duration: 420, delay: 300, ease: 'Cubic.easeOut' });
      sc.tweens.add({ targets: ribbon, alpha: 1, x: tx, duration: 420, delay: 420, ease: 'Cubic.easeOut' });
      this.scene.time.delayedCall(1550, () => {
        this.flash(0xfff2d0, 240, 0.85);
        sc.tweens.add({
          targets: c, alpha: 0, duration: 220, onComplete: () => {
            flicker.remove();
            c.destroy();
            resolve();
          },
        });
      });
    });
  }
}
