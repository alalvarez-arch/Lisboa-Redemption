import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CrawlScene } from './scenes/CrawlScene';
import { CinematicScene } from './scenes/CinematicScene';
import { BriefingScene } from './scenes/BriefingScene';
import { Mission1Scene } from './scenes/Mission1Scene';
import { GameOverScene } from './scenes/GameOverScene';
import { audio } from './utils/AudioSynth';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0a0a12',
  fps: { target: 60, forceSetTimeOut: false },
  render: { antialias: false, powerPreference: 'high-performance' },
  audio: { disableWebAudio: false },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 980 },
      debug: false,
      fixedStep: true,
      fps: 60,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    TitleScene,
    CrawlScene,
    CinematicScene,
    BriefingScene,
    Mission1Scene,
    GameOverScene,
  ],
  input: {
    keyboard: true,
  },
};

window.addEventListener(
  'pointerdown',
  () => {
    audio.ensure();
  },
  { once: true },
);

const game = new Phaser.Game(config);
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.style.outline = 'none';
    canvas.focus();
  }
});
