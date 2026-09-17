import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';
import { InputGate, focusGameCanvas } from '../utils/InputGate';

const CRAWL_TEXT = `Año 2046.

Simeone dirigirá al Atlético de Madrid
un año más en busca de su primera Champions.

Mientras tanto, Caminero Jr ha sentido
el despertar de la fuerza colchonera,
con un único objetivo: devolver la Champions
robada de Lisboa a sus legítimos dueños.

Pero Darth Floren no se lo pondrá fácil…`;

export class CrawlScene extends Phaser.Scene {
  private crawl!: Phaser.GameObjects.Container;
  private skipped = false;
  private gate!: InputGate;
  private keyWasUp = false;

  constructor() {
    super('Crawl');
  }

  create() {
    this.skipped = false;
    this.keyWasUp = false;
    // 800ms gate + require key-up then key-down to avoid Title key-repeat skip
    this.gate = new InputGate(800, 450);
    focusGameCanvas(this.game);
    this.cameras.main.setBackgroundColor('#2a060c');

    const bg = this.add.image(400, 300, 'crawl-bg');
    bg.setDisplaySize(800, 600);
    bg.setDepth(0);
    bg.setTint(0x665555);
    bg.setAlpha(0.55);

    // Dimmer wash so yellow crawl pops
    this.add.rectangle(400, 300, 800, 600, 0x0a0004, 0.55).setDepth(1);

    // Fewer star tweens (max 20)
    for (let i = 0; i < 20; i++) {
      const s = this.add.image(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(0, 600),
        'star',
      );
      s.setAlpha(Phaser.Math.FloatBetween(0.15, 0.55));
      s.setScale(Phaser.Math.FloatBetween(0.4, 1.1));
      s.setDepth(2);
      this.tweens.add({
        targets: s,
        alpha: { from: s.alpha, to: Phaser.Math.FloatBetween(0.05, 0.35) },
        duration: Phaser.Math.Between(1200, 2800),
        yoyo: true,
        repeat: -1,
      });
    }

    const vig = this.add.graphics().setDepth(3);
    vig.fillStyle(0x000000, 0.45);
    vig.fillRect(0, 0, 800, 50);
    vig.fillRect(0, 550, 800, 50);

    this.add
      .text(400, 70, 'LISBOA REDEMPTION', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#FFE81F',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.9);

    const text = this.add
      .text(0, 0, CRAWL_TEXT, {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#FFE81F',
        align: 'center',
        lineSpacing: 14,
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5, 0);

    // Classic crawl: origin at bottom, starts below screen, scrolls up,
    // scaleY shrinks toward vanishing point (1 → 0.35)
    this.crawl = this.add.container(400, 640, [text]);
    this.crawl.setScale(1, 1);
    this.crawl.setDepth(10);

    this.tweens.add({
      targets: this.crawl,
      y: -420,
      scaleY: 0.35,
      duration: 38000,
      ease: 'Linear',
      onComplete: () => this.goNext(),
    });

    const hint = this.add
      .text(400, 570, '[ Espacio / Enter / Clic para saltar ]', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ccaaaa',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: hint,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    // Track key-up so we don't skip from Title key-repeat
    this.input.keyboard!.on('keyup-SPACE', () => {
      this.keyWasUp = true;
    });
    this.input.keyboard!.on('keyup-ENTER', () => {
      this.keyWasUp = true;
    });
    // After lock, treat as if key was released (mouse / fresh press OK)
    this.time.delayedCall(800, () => {
      this.keyWasUp = true;
    });

    this.input.keyboard!.on('keydown-SPACE', () => this.trySkip(true));
    this.input.keyboard!.on('keydown-ENTER', () => this.trySkip(true));
    this.input.on('pointerdown', () => this.trySkip(false));
  }

  private trySkip(fromKey: boolean) {
    if (this.skipped) return;
    if (!this.gate.canAccept()) return;
    if (fromKey && !this.keyWasUp) return;
    this.gate.tryAccept();
    this.goNext();
  }

  private goNext() {
    if (this.skipped) return;
    this.skipped = true;
    audio.click();
    this.scene.start('Cinematic');
  }
}
