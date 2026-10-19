import Phaser from 'phaser';
import { platform } from '../platform/PlatformAdapter';
import { ensureBg } from '../art/registry';
import { audio } from '../audio/AudioController';
import { C, CSS, H, W } from '../config/theme';
import { saves } from '../persistence/SaveService';
import { buy, formatQty, ITEMS, type ItemId, SHOP, type ShopOffer } from '../systems/growth';
import { Atmosphere, Button, fadeIn, goTo, softPress, text, toast } from '../ui/kit';

const TABS: { id: string; name: string; items: ItemId[]; blurb: string }[] = [
  { id: 'pawn', name: 'Pawnshop', items: ['dust', 'sovereign'], blurb: 'Old Marlowe trades in anything that still remembers being light.' },
  { id: 'insight', name: 'Curio Cabinet', items: ['moth', 'velvet', 'tide', 'spring'], blurb: 'Relics from every corner of the Dimming, for Kindling.' },
];

/** The Pawnshop: buy growth materials with Glimmer (R1999's Pawnshop / material shops). */
const TIPS_PER_DAY = 3;
const TIP_GLIMMER = 40;

export class ShopScene extends Phaser.Scene {
  private tab = 'pawn';
  private body?: Phaser.GameObjects.Container;
  private wallet?: Phaser.GameObjects.Container;

  constructor() {
    super('Shop');
  }

  create(data: { tab?: string } = {}): void {
    fadeIn(this);
    this.tab = data.tab ?? this.tab;
    this.add.image(W / 2, H / 2, ensureBg(this, 'parlour')).setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0806, 0.86);
    const warm = this.add.image(W, H, 'fx:glow').setTint(C.amber).setDisplaySize(1600, 1000).setAlpha(0.18);
    warm.setBlendMode(Phaser.BlendModes.ADD);
    new Atmosphere(this, { depth: 40, fireflies: 2 });
    const back = this.add.container(64, 60);
    back.add([this.add.circle(0, 0, 32, 0x0c0e11, 0.5).setStrokeStyle(1.5, 0xe8dcc0, 0.4), this.add.image(0, 0, 'icon:back').setDisplaySize(34, 34)]);
    back.setSize(76, 76).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      audio.sfx('back');
      goTo(this, 'Lobby');
    });
    TABS.forEach((t, i) => {
      const y = 200 + i * 80;
      const on = t.id === this.tab;
      const row = this.add.container(70, y);
      row.add(this.add.rectangle(0, 0, 18, 18, on ? C.amber : 0x6a6458).setAngle(45));
      row.add(text(this, 30, 0, t.name, { size: on ? 34 : 28, font: 'display', bold: on, color: on ? CSS.amber : CSS.creamDim }).setOrigin(0, 0.5));
      if (on) row.add(this.add.rectangle(30, 26, 220, 2, C.amber, 0.7).setOrigin(0, 0.5));
      row.setSize(320, 70).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        audio.sfx('tap');
        this.scene.restart({ tab: t.id });
      });
    });
    this.drawWallet();
    this.drawBody();
    this.drawTip();
    audio.play('lobby');
  }

  private drawWallet(): void {
    this.wallet?.destroy();
    const save = saves.get();
    const w = this.add.container(0, 0);
    const pill = (x: number, key: string, qty: number) => {
      w.add(this.add.rectangle(x, 60, 230, 48, 0x0b0c10, 0.6).setStrokeStyle(1, 0xe8dcc0, 0.35));
      w.add(this.add.image(x - 86, 60, key).setDisplaySize(40, 40));
      w.add(text(this, x - 58, 60, formatQty(qty), { size: 22, bold: true, color: CSS.cream }).setOrigin(0, 0.5));
    };
    pill(W - 640, 'item:dust', save.items.dust);
    pill(W - 395, 'item:sovereign', save.items.sovereign);
    pill(W - 150, 'icon:glimmer', save.glimmer);
    this.wallet = w;
  }

  private drawBody(): void {
    this.body?.destroy();
    const tab = TABS.find((t) => t.id === this.tab)!;
    const b = this.add.container(0, 0);
    b.add(text(this, 470, 150, tab.blurb, { size: 26, italic: true, color: CSS.creamDim }));
    const offers = SHOP.filter((o) => tab.items.includes(o.item));
    offers.forEach((o, i) => {
      const x = 560 + (i % 4) * 330;
      const y = 380 + Math.floor(i / 4) * 380;
      b.add(this.tile(x, y, o));
    });
    this.body = b;
  }

  /**
   * "The Lamplighter's Tip": a short ad, chosen by the player, for a little Glimmer (three a day).
   * Only offered where the platform actually serves ads.
   */
  private drawTip(): void {
    if (!platform.adsAvailable) return;
    const day = new Date().toDateString();
    const read = (): number => {
      try {
        const o = JSON.parse(platform.getItem('firefly-tips') ?? '{}') as { d?: string; n?: number };
        return o.d === day ? o.n ?? 0 : 0;
      } catch {
        return 0;
      }
    };
    const left = TIPS_PER_DAY - read();
    const c = this.add.container(195, 860);
    const g = this.add.graphics();
    g.fillGradientStyle(0x22302a, 0x22302a, 0x141a17, 0x141a17, 1).fillRect(-150, -90, 300, 180);
    g.lineStyle(1.5, C.gold, 0.5).strokeRect(-150, -90, 300, 180);
    c.add(g);
    c.add(this.add.image(-92, -18, 'icon:glimmer').setDisplaySize(70, 70));
    c.add(text(this, -48, -42, 'Lamplighter’s Tip', { size: 24, font: 'display', bold: true, color: CSS.cream }).setOrigin(0, 0.5));
    c.add(text(this, -48, -8, `Watch a short ad\nfor +${TIP_GLIMMER} Glimmer`, { size: 19, italic: true, color: CSS.creamDim, lineSpacing: 2 }).setOrigin(0, 0.5));
    c.add(text(this, 0, 58, left > 0 ? `${left} left today` : 'Back tomorrow', { size: 20, color: left > 0 ? CSS.amber : CSS.muted }).setOrigin(0.5));
    if (left <= 0) {
      c.setAlpha(0.6);
      return;
    }
    c.setSize(300, 180).setInteractive({ useHandCursor: true });
    softPress(c, () => {
      c.disableInteractive();
      void platform.rewardedAd().then((ok) => {
        if (!this.scene.isActive()) return;
        if (ok) {
          saves.get().glimmer += TIP_GLIMMER;
          saves.commit();
          platform.setItem('firefly-tips', JSON.stringify({ d: day, n: read() + 1 }));
          toast(this, `+${TIP_GLIMMER} Glimmer · thank you, Lamplighter`, 'glimmer');
        } else {
          toast(this, 'No tip this time — try again in a moment', 'glimmer');
        }
        this.scene.restart({ tab: this.tab });
      });
    }, 'tap', 1.03);
  }

  private tile(x: number, y: number, o: ShopOffer): Phaser.GameObjects.Container {
    const it = ITEMS[o.item];
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a2420, 0x2a2420, 0x15120f, 0x15120f, 1).fillRect(-140, -150, 280, 300);
    g.lineStyle(1.5, C.gold, 0.5).strokeRect(-140, -150, 280, 300);
    c.add(g);
    c.add(this.add.image(0, -40, 'fx:glow').setTint(0xf2c86a).setDisplaySize(260, 220).setAlpha(0.25));
    c.add(this.add.image(0, -40, `item:${o.item}`).setDisplaySize(150, 150));
    c.add(text(this, 120, 30, `×${formatQty(o.qty)}`, { size: 26, bold: true, color: CSS.cream, stroke: '#000', strokeThickness: 4 }).setOrigin(1, 0.5));
    c.add(text(this, 0, 74, it.name, { size: 26, font: 'display', bold: true, color: CSS.cream }).setOrigin(0.5));
    c.add(this.add.rectangle(0, 126, 280, 48, 0xe8dcc0, 0.95));
    c.add(this.add.image(-40, 126, 'icon:glimmer').setDisplaySize(32, 32));
    c.add(text(this, -16, 126, String(o.price), { size: 26, bold: true, color: CSS.paperText }).setOrigin(0, 0.5));
    c.setSize(280, 300).setInteractive({ useHandCursor: true });
    softPress(c, () => { this.confirm(o); }, 'tap', 1.03);
    return c;
  }

  private confirm(o: ShopOffer): void {
    const it = ITEMS[o.item];
    const save = saves.get();
    const c = this.add.container(0, 0).setDepth(500);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
    c.add(this.add.rectangle(W / 2, H / 2, 860, 420, 0xefe6d2).setStrokeStyle(2, 0x9a8660));
    c.add(text(this, W / 2, H / 2 - 160, 'PURCHASE', { size: 30, font: 'display', bold: true, color: CSS.paperText, spacing: 6 }).setOrigin(0.5));
    c.add(this.add.circle(W / 2 - 260, H / 2, 90, 0xf2b8a0, 0.5));
    c.add(this.add.image(W / 2 - 260, H / 2, `item:${o.item}`).setDisplaySize(150, 150));
    c.add(text(this, W / 2 - 120, H / 2 - 90, `${it.name}  ×${formatQty(o.qty)}`, { size: 32, font: 'display', bold: true, color: CSS.paperText }));
    c.add(text(this, W / 2 - 120, H / 2 - 40, it.blurb, { size: 21, color: CSS.paperSub, wrap: 480, lineSpacing: 3 }));
    c.add(text(this, W / 2 - 120, H / 2 + 70, `Owned: ${formatQty(save.items[o.item])}`, { size: 22, italic: true, color: CSS.paperSub }));
    const close = () => c.destroy();
    c.add(new Button(this, W / 2 - 130, H / 2 + 150, { w: 220, h: 64, label: 'Cancel', style: 'cream', size: 26, sfx: 'back', onClick: close }));
    c.add(new Button(this, W / 2 + 130, H / 2 + 150, {
      w: 260, h: 64, label: `${o.price}`, icon: 'glimmer', style: save.glimmer >= o.price ? 'amber' : 'dark', size: 28, sfx: 'reveal3',
      onClick: () => {
        if (!buy(save, o.id)) {
          toast(this, 'Not enough Glimmer', 'glimmer');
          return;
        }
        saves.commit();
        toast(this, `+${formatQty(o.qty)} ${it.name}`, 'glimmer');
        close();
        this.drawWallet();
      },
    }));
  }
}
