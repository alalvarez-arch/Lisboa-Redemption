import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';
import { InputGate, focusGameCanvas } from '../utils/InputGate';

/**
 * Premium comic title screen — full-bleed key art, light vignette, CTA.
 * Boot → Title → Crawl → Cinematic → Briefing → Mission1
 */
export class TitleScene extends Phaser.Scene {
  private started = false;
  private gate!: InputGate;

  constructor() {
    super('Title');
  }

  create() {
    this.started = false;
    this.gate = new InputGate(500, 400);
    focusGameCanvas(this.game);
    this.cameras.main.setBackgroundColor('#050508');
    this.cameras.main.fadeIn(450, 0, 0, 0);

    // Full-bleed key art — keep visible
    const bg = this.add.image(400, 300, 'title-keyart');
    bg.setDisplaySize(800, 600);
    bg.setDepth(0);

    // Soft dark overlay (max ~0.1) so lettering pops without hiding art
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.1).setDepth(1);

    // Comic panel gutter (thick black border)
    const gutter = this.add.graphics().setDepth(50);
    gutter.fillStyle(0x000000, 1);
    gutter.fillRect(0, 0, 800, 18);
    gutter.fillRect(0, 582, 800, 18);
    gutter.fillRect(0, 0, 18, 600);
    gutter.fillRect(782, 0, 18, 600);
    gutter.lineStyle(2, 0xce1226, 0.85);
    gutter.strokeRect(22, 22, 756, 556);
    gutter.lineStyle(1, 0xc9a227, 0.55);
    gutter.strokeRect(26, 26, 748, 548);

    // Thin vignette
    const vig = this.add.graphics().setDepth(2);
    vig.fillStyle(0x000000, 0.28);
    vig.fillRect(0, 0, 800, 40);
    vig.fillRect(0, 560, 800, 40);
    vig.fillStyle(0x000000, 0.18);
    vig.fillRect(0, 0, 36, 600);
    vig.fillRect(764, 0, 36, 600);

    // Static scanlines (no tween — cheaper, less distraction)
    const scan = this.add.graphics().setDepth(40).setAlpha(0.35);
    scan.fillStyle(0x000000, 0.1);
    for (let y = 0; y < 600; y += 4) {
      scan.fillRect(0, y, 800, 1);
    }

    this.spawnRain();
    this.addComicTitle(400, 118);

    this.add
      .text(400, 188, 'Año 2046 · La fuerza colchonera despierta', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        color: '#f5e6c8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setShadow(1, 1, '#000000', 4, true, true);

    this.add
      .text(
        400,
        220,
        'Espectros de la Fuerza: Futre · Jesús Gil · Antić · Luis Aragonés',
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#c9a227',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0.92);

    const ctaBg = this.add
      .rectangle(400, 540, 420, 42, 0xce1226, 0.88)
      .setStrokeStyle(2, 0xffe81f)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    const cta = this.add
      .text(400, 540, 'PULSA ESPACIO / CLIC PARA EMPEZAR', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(31);

    this.tweens.add({
      targets: [cta, ctaBg],
      alpha: { from: 1, to: 0.55 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    ctaBg.on('pointerover', () => {
      ctaBg.setFillStyle(0xff2244, 0.95);
      ctaBg.setScale(1.03);
      cta.setScale(1.03);
    });
    ctaBg.on('pointerout', () => {
      ctaBg.setFillStyle(0xce1226, 0.88);
      ctaBg.setScale(1);
      cta.setScale(1);
    });
    ctaBg.on('pointerdown', () => this.goNext());

    // Single debounced handler for Space / Enter / click
    const onAdvance = () => this.goNext();
    this.input.keyboard!.on('keydown-SPACE', onAdvance);
    this.input.keyboard!.on('keydown-ENTER', onAdvance);
    this.input.on('pointerdown', onAdvance);
  }

  private addComicTitle(x: number, y: number) {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
      fontSize: '52px',
      color: '#ce1226',
      align: 'center',
    };

    this.add
      .text(x + 4, y + 5, 'LISBOA REDEMPTION', { ...style, color: '#000000' })
      .setOrigin(0.5)
      .setDepth(28)
      .setAlpha(0.85);

    const outlineOffsets = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
      [-3, 0],
      [3, 0],
      [0, -3],
      [0, 3],
    ];
    for (const [ox, oy] of outlineOffsets) {
      this.add
        .text(x + ox, y + oy, 'LISBOA REDEMPTION', {
          ...style,
          color: '#c9a227',
        })
        .setOrigin(0.5)
        .setDepth(29);
    }

    for (const [ox, oy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      this.add
        .text(x + ox, y + oy, 'LISBOA REDEMPTION', {
          ...style,
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(29);
    }

    const main = this.add
      .text(x, y, 'LISBOA REDEMPTION', style)
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: main,
      scale: { from: 1, to: 1.02 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnRain() {
    const rain = this.add.graphics().setDepth(35).setAlpha(0.3);
    const drops: { x: number; y: number; len: number; speed: number }[] = [];
    for (let i = 0; i < 28; i++) {
      drops.push({
        x: Phaser.Math.Between(20, 780),
        y: Phaser.Math.Between(20, 580),
        len: Phaser.Math.Between(6, 14),
        speed: Phaser.Math.FloatBetween(2.2, 5.5),
      });
    }

    this.events.on('update', () => {
      rain.clear();
      rain.lineStyle(1, 0xaaccff, 0.4);
      for (const d of drops) {
        rain.lineBetween(d.x, d.y, d.x - 1.5, d.y + d.len);
        d.y += d.speed;
        d.x -= 0.4;
        if (d.y > 580) {
          d.y = 20;
          d.x = Phaser.Math.Between(20, 780);
        }
        if (d.x < 20) d.x = 780;
      }
    });
  }

  private goNext() {
    if (this.started) return;
    if (!this.gate.tryAccept()) return;
    this.started = true;
    audio.ensure();
    audio.click();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(380, () => this.scene.start('Crawl'));
  }
}
