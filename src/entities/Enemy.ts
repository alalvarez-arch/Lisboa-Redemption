import Phaser from 'phaser';
import { audio } from '../utils/AudioSynth';

const TARGET_H = 52;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = 3;
  facing = -1;
  shootTimer = 0;
  dodgeTimer = 0;
  teleportCooldown = 0;
  alive = true;
  private patrolMin: number;
  private patrolMax: number;
  private aggro = false;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolSpan = 140) {
    const tex = scene.textures.exists('m1-enemy') ? 'm1-enemy' : 'enemy';
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);

    if (tex === 'm1-enemy') {
      const scale = TARGET_H / this.height;
      this.setScale(scale);
      const bw = Math.floor(this.width * 0.42);
      const bh = Math.floor(this.height * 0.78);
      body.setSize(bw, bh);
      body.setOffset((this.width - bw) / 2, this.height - bh - 4);
    } else {
      this.setScale(1.5);
      body.setSize(16, 36);
      body.setOffset(6, 4);
    }

    this.patrolMin = x - patrolSpan;
    this.patrolMax = x + patrolSpan;
    this.shootTimer = Phaser.Math.Between(400, 1400);
    this.dodgeTimer = Phaser.Math.Between(900, 2200);
    this.teleportCooldown = 0;
    this.setDepth(18);
  }

  update(
    playerX: number,
    playerY: number,
    delta: number,
    shootCb: (x: number, y: number, dir: number) => void,
  ) {
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    const dist = Math.abs(playerX - this.x);
    this.aggro = dist < 520;

    // m1-enemy faces LEFT by default → flipX when facing right
    this.facing = playerX < this.x ? -1 : 1;
    this.setFlipX(this.facing > 0);

    if (this.aggro) {
      if (dist > 180) {
        body.setVelocityX(this.facing * 95);
      } else if (dist < 70) {
        body.setVelocityX(-this.facing * 70);
      } else {
        // Strafe unpredictably
        body.setVelocityX(this.facing * (20 + Math.sin(this.scene.time.now / 200) * 50));
      }
    } else {
      // Idle patrol
      if (this.x < this.patrolMin) body.setVelocityX(55);
      else if (this.x > this.patrolMax) body.setVelocityX(-55);
      else if (Math.abs(body.velocity.x) < 10) body.setVelocityX(Phaser.Math.Between(0, 1) ? 45 : -45);
    }

    // Soft clamp
    if (this.x < this.patrolMin - 80) body.setVelocityX(90);
    if (this.x > this.patrolMax + 80) body.setVelocityX(-90);

    // Aggressive shooting
    this.shootTimer -= delta;
    if (
      this.shootTimer <= 0 &&
      dist < 480 &&
      Math.abs(playerY - this.y) < 100
    ) {
      shootCb(this.x + this.facing * 18, this.y - 4, this.facing);
      // Burst chance
      if (Math.random() < 0.35) {
        this.shootTimer = Phaser.Math.Between(180, 320);
      } else {
        this.shootTimer = Phaser.Math.Between(700, 1400);
      }
    }

    // Teleport / dodge
    this.dodgeTimer -= delta;
    this.teleportCooldown -= delta;
    if (this.dodgeTimer <= 0 && dist < 200 && this.teleportCooldown <= 0) {
      this.teleport();
      this.dodgeTimer = Phaser.Math.Between(1200, 2800);
      this.teleportCooldown = 1800;
    }
  }

  teleport() {
    const ghostKey = this.scene.textures.exists('m1-enemy') ? 'm1-enemy' : 'enemy_ghost';
    const ghost = this.scene.add
      .image(this.x, this.y, ghostKey)
      .setAlpha(0.45)
      .setScale(this.scaleX)
      .setFlipX(this.flipX)
      .setTint(0xaaddff);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      y: this.y - 30,
      scale: this.scaleX * 1.2,
      duration: 350,
      onComplete: () => ghost.destroy(),
    });

    // Flash poof
    const ring = this.scene.add.circle(this.x, this.y, 8, 0xffffff, 0.7).setDepth(25);
    this.scene.tweens.add({
      targets: ring,
      radius: 36,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });

    const offset = Phaser.Math.Between(0, 1) === 0 ? -110 : 110;
    const nx = Phaser.Math.Clamp(this.x + offset, this.patrolMin - 30, this.patrolMax + 30);
    const ny = this.y + Phaser.Math.Between(-8, 8);
    this.setPosition(nx, ny);
    this.setAlpha(0.25);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 180 });
  }

  takeDamage(amount = 1): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(70, () => this.clearTint());
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    if (this.teleportCooldown <= 0 && Math.random() < 0.4) {
      this.teleport();
      this.teleportCooldown = 1600;
    }
    return false;
  }

  die() {
    this.alive = false;
    audio.enemyDie();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -120);
    body.setAllowGravity(true);

    // Death poof
    for (let i = 0; i < 10; i++) {
      const p = this.scene.add
        .image(this.x, this.y, 'particle_white')
        .setTint(0xffffff)
        .setScale(Phaser.Math.FloatBetween(0.8, 2))
        .setDepth(30);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Phaser.Math.Between(-50, 50),
        y: this.y + Phaser.Math.Between(-60, 20),
        alpha: 0,
        duration: 380,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: this.facing * 70,
      scaleX: this.scaleX * 0.6,
      scaleY: this.scaleY * 0.6,
      duration: 380,
      onComplete: () => this.destroy(),
    });
  }
}
