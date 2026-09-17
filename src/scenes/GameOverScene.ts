import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';
import { GameState } from '../utils/GameState';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { won?: boolean }) {
    const won = !!data?.won;
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.cameras.main.fadeIn(400);

    // Comic gutters
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, 800, 14);
    g.fillRect(0, 586, 800, 14);
    g.fillRect(0, 0, 14, 600);
    g.fillRect(786, 0, 14, 600);
    g.lineStyle(2, 0xce1226, 0.9);
    g.strokeRect(18, 18, 764, 564);

    if (won) {
      audio.victory();
      this.add
        .text(400, 140, '¡MISIÓN CUMPLIDA!', {
          fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
          fontSize: '40px',
          color: '#ffe81f',
        })
        .setOrigin(0.5)
        .setShadow(3, 3, '#000', 0, false, true);
      this.add
        .text(
          400,
          220,
          'Pikolin tatuará el mapa del Museo.\nLa Champions robada de Lisboa\nestá un paso más cerca…\n\nPero Darth Floren observa desde el Bernabéu.',
          {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '15px',
            color: '#dddddd',
            align: 'center',
            lineSpacing: 6,
          },
        )
        .setOrigin(0.5);
      this.add.image(400, 370, 'pikolin').setScale(3);
    } else {
      audio.gameOver();
      this.add
        .text(400, 150, 'GAME OVER', {
          fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
          fontSize: '48px',
          color: '#ce1226',
        })
        .setOrigin(0.5)
        .setShadow(3, 3, '#000', 0, false, true);
      this.add
        .text(400, 230, 'Los Blancos te han detenido.\nDarth Floren sonríe tras las gafas…', {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '16px',
          color: '#aaaaaa',
          align: 'center',
        })
        .setOrigin(0.5);
      const enemyKey = this.textures.exists('m1-enemy') ? 'm1-enemy' : 'enemy';
      const enemy = this.add.image(400, 370, enemyKey);
      if (enemyKey === 'm1-enemy') {
        enemy.setDisplaySize(enemy.width * (90 / enemy.height), 90);
      } else {
        enemy.setScale(3);
      }
    }

    this.add
      .text(400, 460, `Puntuación: ${GameState.score}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ff88',
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(400, 530, 300, 48, 0xce1226, 0.95)
      .setStrokeStyle(3, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(400, 530, won ? 'REJUGAR MISIÓN 1' : 'REINTENTAR', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000', 0, false, true);

    const go = () => {
      audio.click();
      GameState.reset();
      this.scene.start('Briefing');
    };
    btn.on('pointerdown', go);
    btn.on('pointerover', () => btn.setFillStyle(0xff2244, 1));
    btn.on('pointerout', () => btn.setFillStyle(0xce1226, 0.95));
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-SPACE', go);
  }
}
