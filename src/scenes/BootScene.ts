import Phaser from 'phaser';
import { generateTextures } from '../utils/Textures';

export class BootScene extends Phaser.Scene {
  private barBg!: Phaser.GameObjects.Rectangle;
  private barFill!: Phaser.GameObjects.Rectangle;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('Boot');
  }

  preload() {
    this.cameras.main.setBackgroundColor('#0a0a12');

    this.add
      .text(400, 240, 'LISBOA REDEMPTION', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ce1226',
      })
      .setOrigin(0.5);

    this.status = this.add
      .text(400, 290, 'Cargando…', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.barBg = this.add
      .rectangle(400, 340, 360, 16, 0x222233)
      .setStrokeStyle(1, 0xce1226);
    this.barFill = this.add
      .rectangle(400 - 178, 340, 4, 12, 0xce1226)
      .setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      const w = Math.max(4, 356 * value);
      this.barFill.width = w;
      this.status.setText(`Cargando… ${Math.floor(value * 100)}%`);
    });

    // HQ comic assets (Boot shows bar)
    this.load.image('title-keyart', 'title/keyart.png');
    this.load.image('crawl-bg', 'cinematic/crawl-bg.png');
    this.load.image('cin-01', 'cinematic/01-nightmare.png');
    this.load.image('cin-02', 'cinematic/02-murmur.png');
    this.load.image('cin-03', 'cinematic/03-lightning.png');
    this.load.image('cin-04', 'cinematic/04-awake.png');
    this.load.image('cin-05', 'cinematic/05-knock.png');
    this.load.image('cin-06', 'cinematic/06-photo.png');
    this.load.image('cin-07', 'cinematic/07-shout.png');
    this.load.image('cin-08', 'cinematic/08-radio.png');

    this.load.image('m1-briefing', 'mission1/briefing.png');
    this.load.image('m1-player', 'mission1/player-sprite.png');
    this.load.image('m1-enemy', 'mission1/enemy-sprite.png');
    this.load.image('m1-bg', 'mission1/bg.png');
    this.load.image('m1-bg-rm', 'mission1/bg-rm.png');
  }

  create() {
    generateTextures(this);
    this.status.setText('Listo');
    this.time.delayedCall(120, () => this.scene.start('Title'));
  }
}
