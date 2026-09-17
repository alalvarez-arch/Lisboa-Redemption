import Phaser from 'phaser';
import { GameState } from '../utils/GameState';
import { audio } from '../utils/AudioSynth';

const TARGET_H = 56;
const RUN_SPEED = 260;
const JUMP_VELOCITY = -450;
const COYOTE_MS = 100;
const JUMP_BUFFER_MS = 100;
const SHOOT_COOLDOWN_MS = 200;
const SHORT_HOP_CUT = 0.45;

export class Player extends Phaser.Physics.Arcade.Sprite {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keyA!: Phaser.Input.Keyboard.Key;
  keyD!: Phaser.Input.Keyboard.Key;
  keyW!: Phaser.Input.Keyboard.Key;
  keySpace!: Phaser.Input.Keyboard.Key;
  keyShift!: Phaser.Input.Keyboard.Key;
  keyJ!: Phaser.Input.Keyboard.Key;
  keyK!: Phaser.Input.Keyboard.Key;
  keyZ!: Phaser.Input.Keyboard.Key;

  facing = 1;
  canShoot = true;
  invulnerable = false;
  onGround = false;

  private coyoteMs = 0;
  private jumpBufferMs = 0;
  private jumpHeld = false;
  private shootCdMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const tex = scene.textures.exists('m1-player') ? 'm1-player' : 'player';
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Arcade body size is in SOURCE texture pixels (then scaled with the sprite).
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);

    if (tex === 'm1-player') {
      const scale = TARGET_H / this.height;
      this.setScale(scale);
      // Tight hitbox so crates/barriers don't wedge the player
      const bw = Math.floor(this.width * 0.28);
      const bh = Math.floor(this.height * 0.72);
      body.setSize(bw, bh);
      body.setOffset((this.width - bw) / 2, this.height - bh - 2);
    } else {
      this.setScale(1.6);
      body.setSize(14, 34);
      body.setOffset(7, 6);
    }

    // Snappy Metal Slug caps — X separate from Y fall speed
    body.setMaxVelocity(RUN_SPEED + 40, 900);
    body.maxVelocity.x = RUN_SPEED + 40;
    body.maxVelocity.y = 900;
    // Low drag while moving; we snap-stop on release
    body.setDragX(0);
    body.setFriction(0, 0);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyK = kb.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    this.setDepth(20);
  }

  update(
    shootCb: (x: number, y: number, dir: number) => void,
    neptunoCb: (x: number, y: number, dir: number) => void,
    delta = 16,
  ) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = Math.min(delta, 40);

    this.onGround = body.blocked.down || body.touching.down;

    if (this.onGround) {
      this.coyoteMs = COYOTE_MS;
    } else {
      this.coyoteMs = Math.max(0, this.coyoteMs - dt);
    }

    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    // Jump: JustDown fills buffer; coyote + buffer = responsive hops
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace);

    if (jumpPressed) {
      this.jumpBufferMs = JUMP_BUFFER_MS;
    } else {
      this.jumpBufferMs = Math.max(0, this.jumpBufferMs - dt);
    }

    const jumpHeldNow =
      this.cursors.up!.isDown || this.keyW.isDown || this.keySpace.isDown;

    // Direct velocity run (air control allowed) — no mushy accel
    if (left && !right) {
      body.setVelocityX(-RUN_SPEED);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right && !left) {
      body.setVelocityX(RUN_SPEED);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      // Quick friction stop — snappy but not sticky
      const vx = body.velocity.x;
      if (Math.abs(vx) < 40) {
        body.setVelocityX(0);
      } else {
        body.setVelocityX(vx * 0.55);
      }
    }

    // Perform buffered jump with coyote
    if (this.jumpBufferMs > 0 && this.coyoteMs > 0) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpBufferMs = 0;
      this.coyoteMs = 0;
      this.jumpHeld = true;
      audio.jump();
    }

    // Short hop: release early while rising → cut upward velocity
    if (this.jumpHeld && !jumpHeldNow && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * SHORT_HOP_CUT);
      this.jumpHeld = false;
    }
    if (this.onGround || body.velocity.y >= 0) {
      this.jumpHeld = false;
    }

    // Bob slightly when airborne for Metal Slug feel
    if (!this.onGround) {
      this.setAngle(this.facing * -6);
    } else {
      this.setAngle(0);
    }

    // Shoot (fuerza): HOLD to fire with short cooldown — never blocks movement
    const shootHeld =
      this.keyJ.isDown || this.cursors.down!.isDown || this.keyZ.isDown;

    if (this.shootCdMs > 0) {
      this.shootCdMs = Math.max(0, this.shootCdMs - dt);
      if (this.shootCdMs === 0) this.canShoot = true;
    }

    if (shootHeld && this.canShoot) {
      this.canShoot = false;
      this.shootCdMs = SHOOT_COOLDOWN_MS;
      const muzzleX = this.x + this.facing * 28;
      const muzzleY = this.y - 6;
      shootCb(muzzleX, muzzleY, this.facing);
      audio.forceWhoosh();
    }

    // Neptuno — does not lock movement
    const special =
      Phaser.Input.Keyboard.JustDown(this.keyK) ||
      Phaser.Input.Keyboard.JustDown(this.keyShift);

    if (special && GameState.canUseNeptuno()) {
      GameState.consumeNeptuno();
      neptunoCb(this.x + this.facing * 24, this.y, this.facing);
      audio.neptuno();
    }

    if (this.invulnerable) {
      this.setAlpha(Math.sin(this.scene.time.now / 50) > 0 ? 1 : 0.35);
    } else {
      this.setAlpha(1);
    }
  }

  takeHit(): boolean {
    if (this.invulnerable) return false;
    this.invulnerable = true;
    audio.hit();
    const dead = GameState.loseLife();
    this.scene.time.delayedCall(1400, () => {
      this.invulnerable = false;
      this.setAlpha(1);
    });
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-this.facing * 180, -220);
    return dead;
  }
}
