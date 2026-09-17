import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';
import { InputGate, focusGameCanvas } from '../utils/InputGate';

interface ComicBeat {
  key: string;
  caption?: string;
  balloon?: string;
  balloonStyle?: 'speech' | 'thought' | 'radio';
  delay: number;
  onShow?: (scene: CinematicScene) => void;
}

const BEATS: ComicBeat[] = [
  {
    key: 'cin-01',
    caption:
      'Madrid, 2046. Caminero Jr duerme con la camiseta del Atleti… y suda la pesadilla del minuto 93.',
    delay: 6000,
  },
  {
    key: 'cin-02',
    balloon: 'Ramos de cabeza… no puede ser… minuto 93…',
    balloonStyle: 'thought',
    delay: 5500,
  },
  {
    key: 'cin-03',
    caption: '¡Un rayo parte la noche cyberpunk!',
    delay: 5000,
    onShow: (scene) => {
      audio.thunder();
      scene.flashWhite();
    },
  },
  {
    key: 'cin-04',
    caption: 'Se despierta de golpe, empapado en sudor frío.',
    balloon: '¡¿Qué…?! Otra vez la misma pesadilla…',
    balloonStyle: 'speech',
    delay: 5500,
  },
  {
    key: 'cin-05',
    caption: 'Al incorporarse, tira el marco de la mesilla.',
    balloon: '¡TUM!',
    balloonStyle: 'speech',
    delay: 5000,
  },
  {
    key: 'cin-06',
    caption: 'Recoge la foto: una caricatura del Cholo Simeone.',
    balloon: 'La foto del Cholo…',
    balloonStyle: 'speech',
    delay: 5500,
  },
  {
    key: 'cin-07',
    balloon: '¡Cholo, lo conseguiremos de una manera u otra!',
    balloonStyle: 'speech',
    caption: 'Se pone en pie. La fuerza colchonera arde.',
    delay: 6000,
    onShow: (scene) => {
      scene.cameras.main.shake(180, 0.008);
    },
  },
  {
    key: 'cin-08',
    balloon: '♪ One way or another… ♪',
    balloonStyle: 'radio',
    caption: 'La radio de barrio no se calla… es una señal.',
    delay: 6000,
    onShow: (_scene) => {
      audio.playOneWayMotif();
    },
  },
];

const MIN_PANEL_MS = 2500;

export class CinematicScene extends Phaser.Scene {
  private skipped = false;
  private index = 0;
  private advancing = false;
  private panel!: Phaser.GameObjects.Image;
  private captionBox!: Phaser.GameObjects.Container;
  private balloonBox!: Phaser.GameObjects.Container;
  private progressDots: Phaser.GameObjects.Arc[] = [];
  private autoTimer?: Phaser.Time.TimerEvent;
  private flashRect!: Phaser.GameObjects.Rectangle;
  private gate!: InputGate;
  private panelShownAt = 0;

  constructor() {
    super('Cinematic');
  }

  create() {
    this.skipped = false;
    this.index = 0;
    this.advancing = false;
    this.progressDots = [];
    this.gate = new InputGate(600, 450);
    focusGameCanvas(this.game);
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(400);

    this.add.rectangle(400, 300, 800, 600, 0x050505).setDepth(0);

    this.panel = this.add
      .image(400, 280, BEATS[0].key)
      .setDisplaySize(760, 480)
      .setDepth(1);

    const border = this.add.graphics().setDepth(2);
    border.lineStyle(3, 0xe8e0d0, 1);
    border.strokeRect(18, 38, 764, 484);
    border.lineStyle(6, 0x000000, 1);
    border.strokeRect(14, 34, 772, 492);

    this.captionBox = this.add.container(400, 545).setDepth(20);
    this.balloonBox = this.add.container(400, 100).setDepth(20);

    const total = BEATS.length;
    const startX = 400 - ((total - 1) * 16) / 2;
    for (let i = 0; i < total; i++) {
      const dot = this.add
        .circle(startX + i * 16, 585, 4, i === 0 ? 0xce1226 : 0x444444)
        .setDepth(30);
      this.progressDots.push(dot);
    }

    this.add
      .text(400, 18, 'LISBOA REDEMPTION — Prólogo', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setDepth(30);

    const hint = this.add
      .text(680, 585, '[ Espacio / Clic · Esc saltar ]', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#555555',
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({
      targets: hint,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 900,
    });

    this.flashRect = this.add
      .rectangle(400, 300, 800, 600, 0xffffff, 0)
      .setDepth(50);

    this.showBeat(0);

    // Single keydown handlers with cooldown (no JustDown pile-up)
    this.input.keyboard!.on('keydown-SPACE', () => this.advance());
    this.input.keyboard!.on('keydown-ENTER', () => this.advance());
    this.input.keyboard!.on('keydown-ESC', () => this.skip());
    this.input.on('pointerdown', () => this.advance());
  }

  flashWhite() {
    this.flashRect.setAlpha(0.85);
    this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 350 });
  }

  private clearBoxes() {
    this.captionBox.removeAll(true);
    this.balloonBox.removeAll(true);
  }

  private showCaption(text: string) {
    const bg = this.add
      .rectangle(0, 0, 720, 44, 0x0a0a0a, 0.92)
      .setStrokeStyle(2, 0xce1226);
    const t = this.add
      .text(0, 0, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#f0e8e0',
        align: 'center',
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5);
    this.captionBox.add([bg, t]);
    this.captionBox.setAlpha(0);
    this.tweens.add({ targets: this.captionBox, alpha: 1, duration: 280 });
  }

  private showBalloon(text: string, style: 'speech' | 'thought' | 'radio' = 'speech') {
    const colors = {
      speech: { fill: 0xfff8f0, stroke: 0x1a0a0a, text: '#1a0a0a' },
      thought: { fill: 0xe8eef8, stroke: 0x445566, text: '#223344' },
      radio: { fill: 0x2a1028, stroke: 0xff88aa, text: '#ff88aa' },
    }[style];

    const t = this.add
      .text(0, 0, text, {
        fontFamily: style === 'radio' ? 'monospace' : 'Georgia, serif',
        fontSize: style === 'radio' ? '16px' : '15px',
        color: colors.text,
        align: 'center',
        fontStyle: style === 'thought' ? 'italic' : 'normal',
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);

    const padX = 22;
    const padY = 14;
    const bw = Math.max(160, t.width + padX * 2);
    const bh = Math.max(40, t.height + padY * 2);

    const bg = this.add
      .rectangle(0, 0, bw, bh, colors.fill, 0.95)
      .setStrokeStyle(2.5, colors.stroke);

    const tail = this.add.graphics();
    tail.fillStyle(colors.fill, 0.95);
    tail.lineStyle(2.5, colors.stroke, 1);
    if (style === 'thought') {
      tail.fillCircle(-bw * 0.2, bh / 2 + 10, 6);
      tail.fillCircle(-bw * 0.15, bh / 2 + 22, 3.5);
      tail.strokeCircle(-bw * 0.2, bh / 2 + 10, 6);
      tail.strokeCircle(-bw * 0.15, bh / 2 + 22, 3.5);
    } else if (style !== 'radio') {
      tail.beginPath();
      tail.moveTo(-12, bh / 2 - 2);
      tail.lineTo(0, bh / 2 + 18);
      tail.lineTo(12, bh / 2 - 2);
      tail.closePath();
      tail.fillPath();
      tail.strokePath();
    }

    this.balloonBox.removeAll(true);
    this.balloonBox.add([bg, tail, t]);
    this.balloonBox.setY(style === 'radio' ? 90 : 95);
    this.balloonBox.setAlpha(0);
    this.tweens.add({ targets: this.balloonBox, alpha: 1, duration: 250 });
  }

  private updateDots() {
    this.progressDots.forEach((d, i) => {
      d.setFillStyle(i === this.index ? 0xce1226 : i < this.index ? 0x884444 : 0x444444);
    });
  }

  private pageWhoosh() {
    this.panel.setAlpha(0.3);
    this.panel.setX(440);
    this.tweens.add({
      targets: this.panel,
      x: 400,
      alpha: 1,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.advancing = false;
      },
    });
    audio.click();
  }

  private showBeat(i: number) {
    if (this.skipped) return;
    this.index = i;
    this.panelShownAt = performance.now();
    const beat = BEATS[i];
    this.clearBoxes();
    this.panel.setTexture(beat.key);
    this.panel.setDisplaySize(760, 480);
    this.pageWhoosh();
    this.updateDots();

    if (beat.caption) this.showCaption(beat.caption);
    if (beat.balloon) this.showBalloon(beat.balloon, beat.balloonStyle ?? 'speech');
    beat.onShow?.(this);

    this.autoTimer?.remove(false);
    this.autoTimer = this.time.delayedCall(beat.delay, () => {
      if (!this.skipped) this.advance(true);
    });
  }

  /** @param fromAuto when true, bypass min-panel / gate (timer already waited) */
  private advance(fromAuto = false) {
    if (this.skipped || this.advancing) return;

    if (!fromAuto) {
      // Minimum 2.5s per panel before user can advance
      if (performance.now() - this.panelShownAt < MIN_PANEL_MS) return;
      if (!this.gate.tryAccept()) return;
    }

    this.advancing = true;
    this.autoTimer?.remove(false);

    const next = this.index + 1;
    if (next >= BEATS.length) {
      this.finish();
      return;
    }
    this.showBeat(next);
  }

  private finish() {
    if (this.skipped) return;
    this.skipped = true;
    this.autoTimer?.remove(false);
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(850, () => this.scene.start('Briefing'));
  }

  private skip() {
    if (this.skipped) return;
    if (!this.gate.canAccept()) return;
    this.skipped = true;
    this.autoTimer?.remove(false);
    audio.click();
    this.scene.start('Briefing');
  }
}
