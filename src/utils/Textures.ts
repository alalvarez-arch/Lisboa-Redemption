import Phaser from 'phaser';

/** Generate all procedural pixel textures used by the game */
export function generateTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });

  // --- Fallback tiny sprites (kept if m1 assets fail) ---
  drawPlayer(g, scene, 'player');
  drawPlayer(g, scene, 'player_jump', true);
  drawEnemy(g, scene);
  drawPikolin(g, scene);

  // --- Classic bullets (enemy still uses small white bolts) ---
  g.clear();
  g.fillStyle(0xff2244, 1);
  g.fillCircle(6, 6, 5);
  g.fillStyle(0xffaacc, 1);
  g.fillCircle(6, 6, 2);
  g.generateTexture('bullet_player', 12, 12);

  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 2, 12, 4);
  g.fillStyle(0xaaddff, 1);
  g.fillRect(2, 3, 8, 2);
  g.generateTexture('bullet_enemy', 12, 8);

  // --- Fuerza colchonera Force wave (Jedi-ish red/white energy) ---
  g.clear();
  // Outer glow
  g.fillStyle(0xce1226, 0.35);
  g.fillEllipse(24, 14, 46, 26);
  // Mid red energy
  g.fillStyle(0xff2244, 0.85);
  g.fillEllipse(24, 14, 36, 18);
  // White core
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(26, 14, 18, 8);
  // Leading crescent tip
  g.fillStyle(0xffe0e8, 1);
  g.fillTriangle(40, 14, 30, 6, 30, 22);
  // Sparks
  g.fillStyle(0xffffff, 1);
  g.fillCircle(12, 8, 2);
  g.fillCircle(16, 20, 1.5);
  g.fillStyle(0xce1226, 1);
  g.fillCircle(8, 14, 2);
  g.generateTexture('force_blast', 48, 28);

  // Short-range Force push ring
  g.clear();
  g.lineStyle(4, 0xce1226, 0.9);
  g.strokeEllipse(20, 20, 36, 28);
  g.lineStyle(2, 0xffffff, 0.85);
  g.strokeEllipse(20, 20, 28, 20);
  g.fillStyle(0xff4466, 0.25);
  g.fillEllipse(20, 20, 24, 16);
  g.generateTexture('force_ring', 40, 40);

  // Neptuno blast
  g.clear();
  g.fillStyle(0x00ccff, 0.9);
  g.fillCircle(24, 24, 22);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(24, 24, 10);
  g.generateTexture('neptuno_blast', 48, 48);

  // Platform / ground tile
  g.clear();
  g.fillStyle(0x2a2a3a, 1);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0x4a3040, 1);
  g.fillRect(0, 0, 32, 5);
  g.fillStyle(0xce1226, 0.35);
  g.fillRect(0, 0, 32, 2);
  g.fillStyle(0x1a1a28, 1);
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 8, 8, 6, 20);
  }
  g.generateTexture('ground', 32, 32);

  // Crate obstacle
  g.clear();
  g.fillStyle(0x000000, 1);
  g.fillRect(0, 0, 40, 36);
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(2, 2, 36, 32);
  g.fillStyle(0xa07040, 1);
  g.fillRect(2, 2, 36, 6);
  g.lineStyle(2, 0x3a2010, 1);
  g.strokeRect(2, 2, 36, 32);
  g.lineBetween(2, 18, 38, 18);
  g.lineBetween(20, 2, 20, 34);
  g.fillStyle(0xce1226, 1);
  g.fillRect(14, 12, 12, 10);
  g.fillStyle(0xffffff, 1);
  g.fillRect(16, 14, 3, 6);
  g.fillRect(21, 14, 3, 6);
  g.generateTexture('crate', 40, 36);

  // Rubble pile
  g.clear();
  g.fillStyle(0x000000, 1);
  g.fillTriangle(0, 28, 24, 4, 48, 28);
  g.fillStyle(0x555566, 1);
  g.fillTriangle(2, 26, 24, 6, 46, 26);
  g.fillStyle(0x777788, 1);
  g.fillRect(8, 16, 14, 10);
  g.fillRect(26, 14, 12, 12);
  g.fillStyle(0xce1226, 0.5);
  g.fillRect(18, 10, 8, 6);
  g.generateTexture('rubble', 48, 28);

  // Low barrier / sandbag
  g.clear();
  g.fillStyle(0x000000, 1);
  g.fillRect(0, 8, 56, 20);
  g.fillStyle(0x6a6048, 1);
  g.fillRect(1, 9, 54, 18);
  g.fillStyle(0x8a8060, 1);
  for (let i = 0; i < 4; i++) {
    g.fillEllipse(8 + i * 14, 18, 14, 10);
  }
  g.fillStyle(0xce1226, 0.6);
  g.fillRect(1, 9, 54, 3);
  g.generateTexture('barrier', 56, 28);

  // Shop sign board
  g.clear();
  g.fillStyle(0x000000, 1);
  g.fillRect(0, 0, 80, 36);
  g.fillStyle(0x111122, 1);
  g.fillRect(2, 2, 76, 32);
  g.fillStyle(0x00ffaa, 1);
  g.fillRect(2, 2, 76, 4);
  g.generateTexture('shop_sign', 80, 36);

  // Building backdrop piece (fallback parallax)
  g.clear();
  g.fillStyle(0x1a1028, 1);
  g.fillRect(0, 0, 64, 96);
  g.fillStyle(0xffaa33, 0.7);
  for (let y = 8; y < 90; y += 16) {
    for (let x = 8; x < 56; x += 16) {
      if (Math.random() > 0.3) g.fillRect(x, y, 8, 10);
    }
  }
  g.generateTexture('building', 64, 96);

  // Star
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(1, 1, 1);
  g.generateTexture('star', 3, 3);

  // Lightning bolt
  g.clear();
  g.lineStyle(3, 0xffffaa, 1);
  g.beginPath();
  g.moveTo(16, 0);
  g.lineTo(8, 20);
  g.lineTo(18, 20);
  g.lineTo(6, 48);
  g.lineTo(20, 22);
  g.lineTo(10, 22);
  g.lineTo(16, 0);
  g.closePath();
  g.strokePath();
  g.fillStyle(0xffffcc, 0.9);
  g.fillPath();
  g.generateTexture('lightning', 28, 50);

  drawPhoto(g, scene);

  // Bed
  g.clear();
  g.fillStyle(0x4a3040, 1);
  g.fillRect(0, 20, 80, 16);
  g.fillStyle(0xcc2244, 1);
  g.fillRect(4, 8, 60, 16);
  g.fillStyle(0xffffff, 1);
  g.fillRect(55, 4, 18, 12);
  g.generateTexture('bed', 80, 36);

  // Particles
  g.clear();
  g.fillStyle(0xff4466, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture('particle_red', 6, 6);

  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture('particle_white', 6, 6);

  // Hit spark
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 3);
  g.fillStyle(0xffe81f, 1);
  g.fillTriangle(8, 0, 10, 8, 6, 8);
  g.fillTriangle(8, 16, 10, 8, 6, 8);
  g.fillTriangle(0, 8, 8, 6, 8, 10);
  g.fillTriangle(16, 8, 8, 6, 8, 10);
  g.fillStyle(0xce1226, 1);
  g.fillCircle(8, 8, 1.5);
  g.generateTexture('hit_spark', 16, 16);

  g.destroy();
}

function drawPlayer(
  g: Phaser.GameObjects.Graphics,
  scene: Phaser.Scene,
  key: string,
  jumping = false,
) {
  g.clear();
  const w = 28;
  const h = 40;
  g.fillStyle(0x111111, 1);
  if (jumping) {
    g.fillRect(6, 28, 7, 10);
    g.fillRect(16, 28, 7, 10);
  } else {
    g.fillRect(6, 28, 7, 12);
    g.fillRect(16, 28, 7, 12);
  }
  g.fillStyle(0xffffff, 1);
  g.fillRect(5, 12, 18, 18);
  g.fillStyle(0xce1226, 1);
  g.fillRect(5, 12, 4, 18);
  g.fillRect(13, 12, 4, 18);
  g.fillRect(21, 12, 2, 18);
  g.fillStyle(0xf5c89a, 1);
  g.fillRect(8, 2, 12, 12);
  g.fillStyle(0x2a1810, 1);
  g.fillRect(8, 1, 12, 4);
  g.fillStyle(0x111111, 1);
  g.fillRect(10, 6, 2, 2);
  g.fillRect(16, 6, 2, 2);
  g.fillStyle(0xf5c89a, 1);
  g.fillRect(1, 14, 5, 10);
  g.fillRect(22, 14, 5, 10);
  g.generateTexture(key, w, h);
}

function drawEnemy(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene) {
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(6, 12, 16, 18);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(4, 14, 5, 12);
  g.fillRect(19, 14, 5, 12);
  g.fillStyle(0xdddddd, 1);
  g.fillRect(7, 28, 6, 12);
  g.fillRect(15, 28, 6, 12);
  g.fillStyle(0xf0d0b0, 1);
  g.fillRect(8, 2, 12, 12);
  g.fillStyle(0x111111, 1);
  g.fillRect(8, 5, 12, 4);
  g.fillStyle(0x222222, 1);
  g.fillRect(12, 14, 4, 12);
  g.generateTexture('enemy', 28, 40);

  g.clear();
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(6, 12, 16, 18);
  g.fillRect(8, 2, 12, 12);
  g.generateTexture('enemy_ghost', 28, 40);
}

function drawPikolin(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene) {
  g.clear();
  g.fillStyle(0x333344, 1);
  g.fillRect(5, 14, 18, 16);
  g.fillStyle(0x888899, 1);
  g.fillRect(4, 14, 20, 6);
  g.fillStyle(0xf5c89a, 1);
  g.fillRect(8, 2, 12, 12);
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(7, 0, 14, 5);
  g.fillStyle(0xf5c89a, 1);
  g.fillRect(0, 16, 6, 12);
  g.fillRect(22, 16, 6, 12);
  g.fillStyle(0x2244aa, 1);
  g.fillRect(1, 18, 4, 3);
  g.fillRect(23, 20, 4, 3);
  g.fillStyle(0x222233, 1);
  g.fillRect(7, 28, 6, 12);
  g.fillRect(15, 28, 6, 12);
  g.generateTexture('pikolin', 28, 40);
}

function drawPhoto(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene) {
  g.clear();
  g.fillStyle(0x8b5a2b, 1);
  g.fillRect(0, 0, 36, 44);
  g.fillStyle(0xf5e6c8, 1);
  g.fillRect(3, 3, 30, 34);
  g.fillStyle(0xf5c89a, 1);
  g.fillRect(10, 6, 16, 14);
  g.fillStyle(0xe8d4b0, 1);
  g.fillRect(10, 6, 16, 3);
  g.fillStyle(0x111111, 1);
  g.fillRect(13, 12, 3, 2);
  g.fillRect(20, 12, 3, 2);
  g.fillStyle(0x333333, 1);
  g.fillRect(12, 10, 5, 1);
  g.fillRect(19, 10, 5, 1);
  g.fillStyle(0xce1226, 1);
  g.fillRect(8, 20, 20, 14);
  g.fillStyle(0x1a2744, 1);
  g.fillRect(8, 20, 20, 3);
  g.generateTexture('photo_cholo', 36, 44);
}
