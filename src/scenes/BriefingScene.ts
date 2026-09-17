import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';
import { GameState } from '../utils/GameState';
import { InputGate, focusGameCanvas } from '../utils/InputGate';

/**
 * Comic briefing — full-bleed key art + Spanish overlays + COMENZAR CTA.
 */
export class BriefingScene extends Phaser.Scene {
  private started = false;
  private gate!: InputGate;

  constructor() {
    super('Briefing');
  }

  create() {
    this.started = false;
    this.gate = new InputGate(500, 400);
    focusGameCanvas(this.game);
    GameState.reset();
    this.cameras.main.setBackgroundColor('#050508');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    audio.ensure();

    const bg = this.add.image(400, 300, 'm1-briefing');
    bg.setDisplaySize(800, 600);
    bg.setDepth(0);

    // Lighter overlays so art stays visible
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.18).setDepth(1);
    this.add.rectangle(400, 95, 760, 150, 0x000000, 0.35).setDepth(2);
    this.add.rectangle(400, 310, 620, 200, 0x000000, 0.4).setDepth(2);
    this.add.rectangle(400, 500, 700, 140, 0x000000, 0.35).setDepth(2);

    const gutter = this.add.graphics().setDepth(50);
    gutter.fillStyle(0x000000, 1);
    gutter.fillRect(0, 0, 800, 16);
    gutter.fillRect(0, 584, 800, 16);
    gutter.fillRect(0, 0, 16, 600);
    gutter.fillRect(784, 0, 16, 600);
    gutter.lineStyle(3, 0xce1226, 0.95);
    gutter.strokeRect(20, 20, 760, 560);
    gutter.lineStyle(1, 0xc9a227, 0.6);
    gutter.strokeRect(24, 24, 752, 552);

    const scan = this.add.graphics().setDepth(40).setAlpha(0.4);
    scan.fillStyle(0x000000, 0.08);
    for (let y = 0; y < 600; y += 4) scan.fillRect(0, y, 800, 1);

    this.addComicLine(400, 48, 'MISIÓN 1', 42, '#ce1226');
    this.addComicLine(400, 92, 'Llegar al tatuador Pikolin', 22, '#ffe81f');

    const panel = this.add.graphics().setDepth(10);
    panel.fillStyle(0x0a0a14, 0.72);
    panel.fillRoundedRect(90, 130, 620, 280, 6);
    panel.lineStyle(3, 0xce1226, 1);
    panel.strokeRoundedRect(90, 130, 620, 280, 6);
    panel.lineStyle(1, 0xffffff, 0.35);
    panel.strokeRoundedRect(94, 134, 612, 272, 4);

    this.add
      .text(400, 155, 'OBJETIVO', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '18px',
        color: '#ce1226',
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setShadow(2, 2, '#000', 0, false, true);

    this.add
      .text(
        400,
        200,
        'Atraviesa las calles cyberpunk del Bernabéu 2046\nhasta el taller de Pikolin. Allí te tatuarán el mapa\ndel Museo del Real Madrid — clave para Lisboa.',
        {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '14px',
          color: '#f0e6d8',
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5)
      .setDepth(12);

    this.add
      .text(
        400,
        275,
        'ENEMIGOS — LOS BLANCOS\nAgentes blancos. Teletransportan, esquivan y disparan.\n¡Oleadas densas! Usa la fuerza y el salto.',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#c8ddff',
          align: 'center',
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(12);

    this.add
      .text(
        400,
        355,
        'CONTROLES\n← → / A D  Mover   ·   W / ↑ / Espacio  Saltar\nJ / ↓ / Z  Fuerza colchonera   ·   K / Shift  Golpe Neptuno',
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#88ffaa',
          align: 'center',
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(12);

    const btnW = 280;
    const btnH = 56;
    const btnBg = this.add
      .rectangle(400, 500, btnW, btnH, 0xce1226, 0.95)
      .setStrokeStyle(4, 0x000000)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this.add
      .rectangle(400, 500, btnW - 10, btnH - 10, 0x000000, 0)
      .setStrokeStyle(2, 0xffe81f)
      .setDepth(30);

    const btnTxt = this.add
      .text(400, 500, 'COMENZAR', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setShadow(3, 3, '#000000', 0, false, true);

    this.tweens.add({
      targets: [btnBg, btnTxt],
      scale: { from: 1, to: 1.04 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0xff2244, 1);
      btnBg.setScale(1.06);
      btnTxt.setScale(1.06);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0xce1226, 0.95);
      btnBg.setScale(1);
      btnTxt.setScale(1);
    });
    btnBg.on('pointerdown', () => this.goMission());

    this.add
      .text(400, 555, 'Espacio · Enter · Clic', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(31);

    this.input.keyboard!.on('keydown-SPACE', () => this.goMission());
    this.input.keyboard!.on('keydown-ENTER', () => this.goMission());
    this.input.on('pointerdown', () => this.goMission());
  }

  private addComicLine(x: number, y: number, text: string, size: number, color: string) {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
      fontSize: `${size}px`,
      color,
      align: 'center',
    };
    this.add
      .text(x + 3, y + 3, text, { ...style, color: '#000000' })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0.85);
    for (const [ox, oy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ] as const) {
      this.add
        .text(x + ox, y + oy, text, { ...style, color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(11);
    }
    this.add.text(x, y, text).setOrigin(0.5).setDepth(12).setStyle(style);
  }

  private goMission() {
    if (this.started) return;
    if (!this.gate.tryAccept()) return;
    this.started = true;
    audio.click();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(450, () => this.scene.start('Mission1'));
  }
}
