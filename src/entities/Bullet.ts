import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage = 1;
  fromPlayer = true;
  isForce = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  fire(
    dir: number,
    speed: number,
    fromPlayer: boolean,
    damage = 1,
    isForce = false,
  ) {
    this.fromPlayer = fromPlayer;
    this.damage = damage;
    this.isForce = isForce;
    this.setActive(true).setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocityX(dir * speed);
    body.setVelocityY(0);
    this.setFlipX(dir < 0);

    if (isForce) {
      // Wider Force wave hitbox
      body.setSize(28, 18);
      body.setOffset(2, 4);
      this.setScale(1.15);
      // Fade & stretch whoosh
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.6,
        scaleY: 0.85,
        alpha: 0.15,
        duration: 420,
      });
    } else {
      body.setSize(10, 6);
      body.setOffset(0, 1);
    }
  }
}

export class BulletGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene, maxSize = 60) {
    super(scene.physics.world, scene, {
      classType: Bullet,
      maxSize,
      runChildUpdate: false,
    });
  }

  spawn(
    x: number,
    y: number,
    dir: number,
    speed: number,
    texture: string,
    fromPlayer: boolean,
    damage = 1,
    isForce = false,
  ): Bullet | null {
    let b = this.getFirstDead(false) as Bullet | null;
    if (!b) {
      if (this.getLength() >= (this.maxSize || 60)) return null;
      b = new Bullet(this.scene, x, y, texture);
      this.add(b);
    } else {
      b.setTexture(texture);
      b.setPosition(x, y);
      b.setAngle(0);
    }
    b.setDepth(22);
    b.fire(dir, speed, fromPlayer, damage, isForce);
    const life = isForce ? 450 : 2200;
    this.scene.time.delayedCall(life, () => {
      if (b && b.active) {
        b.setActive(false).setVisible(false);
        const body = b.body as Phaser.Physics.Arcade.Body;
        if (body) body.setVelocity(0, 0);
      }
    });
    return b;
  }
}
