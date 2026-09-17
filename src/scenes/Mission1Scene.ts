import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { BulletGroup } from '../entities/Bullet';
import { GameState } from '../utils/GameState';
import { audio } from '../utils/AudioSynth';
import { focusGameCanvas } from '../utils/InputGate';

const WORLD_W = 4600;
const GROUND_Y = 520;
const PLAYER_H = 56;

type WaveTrigger = { x: number; fired: boolean; label: string; spawns: { x: number; y: number }[] };

export class Mission1Scene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private playerBullets!: BulletGroup;
  private enemyBullets!: BulletGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlats: Phaser.Physics.Arcade.Image[] = [];
  private pikolin!: Phaser.Physics.Arcade.Sprite;
  private hudLives!: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;
  private hudNeptuno!: Phaser.GameObjects.Graphics;
  private hudNeptunoText!: Phaser.GameObjects.Text;
  private hudPanel!: Phaser.GameObjects.Graphics;
  private ended = false;
  private waves: WaveTrigger[] = [];
  private rainGfx!: Phaser.GameObjects.Graphics;
  private rainDrops: { x: number; y: number; len: number; speed: number }[] = [];
  private bgTiles: Phaser.GameObjects.Image[] = [];
  private bgFarTiles: Phaser.GameObjects.Image[] = [];
  private neonSigns: Phaser.GameObjects.Text[] = [];
  private billboards: Phaser.GameObjects.Container[] = [];
  private drones: { gfx: Phaser.GameObjects.Container; speed: number; bob: number; baseY: number }[] = [];
  private flickerGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Mission1');
  }

  create() {
    this.ended = false;
    this.movingPlats = [];
    this.bgTiles = [];
    this.bgFarTiles = [];
    this.neonSigns = [];
    this.billboards = [];
    this.drones = [];
    audio.ensure();

    this.cameras.main.setBackgroundColor('#08060f');
    this.physics.world.setBounds(0, 0, WORLD_W, 600);
    this.physics.world.setFPS(60);
    this.cameras.main.setBounds(0, 0, WORLD_W, 600);

    // Keyboard focus so browser doesn't steal arrows/WASD/space
    focusGameCanvas(this.game);
    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.J,
      Phaser.Input.Keyboard.KeyCodes.K,
      Phaser.Input.Keyboard.KeyCodes.Z,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ]);
    this.input.on('pointerdown', () => {
      this.game.canvas.focus();
    });

    this.buildBackground();
    this.buildPlatforms();
    this.buildObstacles();
    this.spawnActors();
    this.setupWaves();
    this.setupCollisions();
    this.buildHUD();
    this.setupRain();

    const toast = this.comicToast('¡Encuentra a Pikolin!', '#ffe81f', 100);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      delay: 2800,
      duration: 700,
      onComplete: () => toast.destroy(),
    });
  }

  private buildBackground() {
    // Prefer Real Madrid dystopian art; fall back to m1-bg / procedural
    const bgKey = this.textures.exists('m1-bg-rm')
      ? 'm1-bg-rm'
      : this.textures.exists('m1-bg')
        ? 'm1-bg'
        : null;

    // Far sky wash (scrolls slowest)
    const sky = this.add
      .rectangle(WORLD_W / 2, 220, WORLD_W + 400, 440, 0x0a0614)
      .setDepth(-30)
      .setScrollFactor(0.15);
    void sky;

    if (bgKey) {
      // Far parallax — 2 tiles only (cheap)
      const farW = Math.ceil(WORLD_W / 2) + 200;
      for (let i = 0; i < 2; i++) {
        const img = this.add
          .image(i * farW + farW / 2, 280, bgKey)
          .setDisplaySize(farW + 6, 520)
          .setDepth(-25)
          .setScrollFactor(0.22)
          .setAlpha(0.4)
          .setTint(0x8899bb);
        this.bgFarTiles.push(img);
      }

      // Main city layer — 2 wide tiles
      const tileW = Math.ceil(WORLD_W / 2) + 100;
      for (let i = 0; i < 2; i++) {
        const img = this.add
          .image(i * tileW + tileW / 2, 300, bgKey)
          .setDisplaySize(tileW + 4, 600)
          .setDepth(-20)
          .setScrollFactor(0.38)
          .setAlpha(0.95);
        this.bgTiles.push(img);
      }

      // Subtle near haze strip
      this.add
        .rectangle(WORLD_W / 2, 540, WORLD_W, 140, 0x000000, 0.5)
        .setDepth(-5)
        .setScrollFactor(1);
    } else {
      for (let i = 0; i < 10; i++) {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0x0a0818),
          Phaser.Display.Color.ValueToColor(0x2a1040),
          10,
          i,
        );
        this.add
          .rectangle(
            WORLD_W / 2,
            i * 40 + 20,
            WORLD_W,
            40,
            Phaser.Display.Color.GetColor(c.r, c.g, c.b),
          )
          .setDepth(-20);
      }
    }

    // Propaganda neon signs (Spanish dictatorship slogans)
    const signs: { x: number; y: number; t: string; c: string }[] = [
      { x: 320, y: 140, t: 'FLORENTINO VIGILA', c: '#ffe066' },
      { x: 780, y: 120, t: 'SECTOR BERNABÉU', c: '#ffffff' },
      { x: 1280, y: 150, t: 'OBEDEZCA A LOS BLANCOS', c: '#ff4455' },
      { x: 1750, y: 130, t: '2046 — IMPERIO BLANCO', c: '#c9a227' },
      { x: 2300, y: 145, t: 'FLORENTINO VIGILA', c: '#ffe066' },
      { x: 2850, y: 125, t: 'SECTOR BERNABÉU', c: '#ffffff' },
      { x: 3400, y: 150, t: 'OBEDEZCA A LOS BLANCOS', c: '#ff6688' },
      { x: 4000, y: 135, t: '2046 — IMPERIO BLANCO', c: '#c9a227' },
      { x: 4450, y: 160, t: 'PIKOLIN INK →', c: '#00ffcc' },
    ];
    signs.forEach((s) => {
      const txt = this.add
        .text(s.x, s.y, s.t, {
          fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
          fontSize: '15px',
          color: s.c,
          backgroundColor: '#000000aa',
          padding: { x: 8, y: 4 },
        })
        .setDepth(-3)
        .setScrollFactor(0.65)
        .setShadow(0, 0, s.c, 8, true, true);
      this.neonSigns.push(txt);
    });

    // Billboard pulse panels (Florentino cyborg glow)
    const boardXs = [500, 1500, 2600, 3700];
    boardXs.forEach((bx, i) => {
      const c = this.add.container(bx, 200).setDepth(-4).setScrollFactor(0.55);
      const panel = this.add.rectangle(0, 0, 120, 70, 0x111118, 0.9).setStrokeStyle(2, 0xc9a227);
      const glow = this.add.rectangle(0, 0, 110, 60, 0xffcc33, 0.15);
      const label = this.add
        .text(0, -8, 'FLORENTINO', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffe066',
        })
        .setOrigin(0.5);
      const sub = this.add
        .text(0, 10, 'CYBORG · VIGILA', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#88aaff',
        })
        .setOrigin(0.5);
      c.add([panel, glow, label, sub]);
      this.billboards.push(c);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.12, to: 0.45 },
        duration: 700 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: panel,
        alpha: { from: 0.85, to: 1 },
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
      });
    });

    // Floating surveillance drones (max 2 — cheap)
    for (let i = 0; i < 2; i++) {
      const dx = 400 + i * 1800 + Phaser.Math.Between(-80, 80);
      const dy = 80 + Phaser.Math.Between(0, 100);
      const d = this.add.container(dx, dy).setDepth(-2).setScrollFactor(0.75);
      const body = this.add.ellipse(0, 0, 28, 12, 0xccddee, 0.9);
      const eye = this.add.circle(4, 0, 3, 0xff2244, 1);
      const wingL = this.add.rectangle(-14, 2, 10, 3, 0x8899aa, 0.8);
      const wingR = this.add.rectangle(14, 2, 10, 3, 0x8899aa, 0.8);
      d.add([wingL, wingR, body, eye]);
      this.drones.push({
        gfx: d,
        speed: Phaser.Math.FloatBetween(18, 42) * (i % 2 === 0 ? 1 : -1),
        bob: Phaser.Math.FloatBetween(0.8, 1.6),
        baseY: dy,
      });
      this.tweens.add({
        targets: eye,
        alpha: { from: 0.4, to: 1 },
        duration: 280 + i * 40,
        yoyo: true,
        repeat: -1,
      });
    }

    // Screen flicker overlay (propaganda neon blink)
    this.flickerGfx = this.add.graphics().setScrollFactor(0).setDepth(44).setAlpha(0);
  }

  private buildPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    // Ground with intentional GAPS for platforming
    const gaps: [number, number][] = [
      [680, 760],
      [1480, 1580],
      [2280, 2380],
      [3180, 3300],
    ];
    const inGap = (x: number) => gaps.some(([a, b]) => x >= a && x <= b);

    for (let x = 0; x < WORLD_W; x += 32) {
      if (inGap(x + 16)) continue;
      const tile = this.platforms.create(x + 16, GROUND_Y + 16, 'ground') as Phaser.Physics.Arcade.Sprite;
      tile.refreshBody();
    }

    // Floating platforms (combat + traversal)
    const plats: [number, number, number][] = [
      // x, y, tiles
      [320, 410, 3],
      [520, 350, 3],
      [900, 400, 4],
      [1100, 330, 3],
      [1350, 380, 3],
      [1700, 360, 4],
      [1950, 300, 3],
      [2100, 400, 3],
      [2500, 370, 4],
      [2750, 310, 3],
      [3000, 400, 3],
      [3450, 360, 4],
      [3700, 300, 3],
      [3950, 400, 3],
      [4150, 340, 3],
    ];
    plats.forEach(([x, y, n]) => {
      for (let i = 0; i < n; i++) {
        const t = this.platforms.create(x + i * 32, y, 'ground') as Phaser.Physics.Arcade.Sprite;
        t.setTint(0x664466);
        t.refreshBody();
      }
    });

    // Gap bridge stepping stones
    const stones: [number, number][] = [
      [700, 460],
      [740, 430],
      [1520, 470],
      [1550, 430],
      [2320, 460],
      [2350, 420],
      [3220, 470],
      [3260, 430],
    ];
    stones.forEach(([x, y]) => {
      const t = this.platforms.create(x, y, 'ground') as Phaser.Physics.Arcade.Sprite;
      t.setTint(0x886655);
      t.refreshBody();
    });

    // Moving platforms
    const movers = [
      { x: 1600, y: 280, minX: 1550, maxX: 1850 },
      { x: 2600, y: 260, minX: 2500, maxX: 2850 },
      { x: 3500, y: 250, minX: 3400, maxX: 3750 },
    ];
    movers.forEach((m) => {
      const plat = this.physics.add.image(m.x, m.y, 'ground');
      plat.setDisplaySize(96, 20);
      plat.setTint(0x00aacc);
      plat.setImmovable(true);
      const body = plat.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocityX(70);
      (plat as Phaser.Physics.Arcade.Image & { minX: number; maxX: number }).minX = m.minX;
      (plat as Phaser.Physics.Arcade.Image & { minX: number; maxX: number }).maxX = m.maxX;
      this.movingPlats.push(plat);
      this.physics.add.collider(plat, this.platforms); // noop safety
    });
  }

  private buildObstacles() {
    // Crates / rubble / barriers — jump over during shootouts
    const crates = [250, 420, 980, 1250, 1800, 2050, 2450, 2900, 3600, 4000];
    crates.forEach((x) => {
      const c = this.platforms.create(x, GROUND_Y - 18, 'crate') as Phaser.Physics.Arcade.Sprite;
      c.refreshBody();
      // Soften side collisions so the player doesn't wedge into crates
      const b = c.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.left = false;
      b.checkCollision.right = false;
    });

    const rubble = [600, 1050, 1750, 2650, 3050, 3850];
    rubble.forEach((x) => {
      const r = this.platforms.create(x, GROUND_Y - 14, 'rubble') as Phaser.Physics.Arcade.Sprite;
      r.refreshBody();
      const b = r.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.left = false;
      b.checkCollision.right = false;
    });

    const barriers = [800, 1400, 2200, 2800, 3400, 4100];
    barriers.forEach((x) => {
      const bar = this.platforms.create(x, GROUND_Y - 14, 'barrier') as Phaser.Physics.Arcade.Sprite;
      bar.refreshBody();
      const b = bar.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.left = false;
      b.checkCollision.right = false;
    });
  }

  private spawnActors() {
    this.player = new Player(this, 80, GROUND_Y - PLAYER_H - 8);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    this.enemies = this.add.group();
    this.playerBullets = new BulletGroup(this, 50);
    this.enemyBullets = new BulletGroup(this, 50);

    // Initial Los Blancos scattered along the route
    const enemySpawns = [
      [400, GROUND_Y - 40],
      [650, 370],
      [1000, GROUND_Y - 40],
      [1200, 300],
      [1500, GROUND_Y - 40],
      [1750, 330],
      [2000, GROUND_Y - 40],
      [2400, GROUND_Y - 40],
      [2700, 280],
      [2950, GROUND_Y - 40],
      [3400, GROUND_Y - 40],
      [3650, 270],
      [3900, GROUND_Y - 40],
      [4200, GROUND_Y - 40],
    ];
    enemySpawns.forEach(([x, y]) => {
      const e = new Enemy(this, x, y, 120);
      this.enemies.add(e);
    });

    // Pikolin shop at the end
    this.pikolin = this.physics.add.sprite(WORLD_W - 140, GROUND_Y - 40, 'pikolin');
    this.pikolin.setScale(2.2);
    this.pikolin.setImmovable(true);
    (this.pikolin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.add
      .image(WORLD_W - 140, GROUND_Y - 100, 'shop_sign')
      .setScale(1.4)
      .setDepth(5);
    this.add
      .text(WORLD_W - 140, GROUND_Y - 100, 'PIKOLIN', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '14px',
        color: '#00ffaa',
      })
      .setOrigin(0.5)
      .setDepth(6);

    // Goal glow
    const glow = this.add.circle(WORLD_W - 140, GROUND_Y - 50, 40, 0x00ffaa, 0.15).setDepth(4);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.35 },
      scale: { from: 1, to: 1.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  private setupWaves() {
    this.waves = [
      {
        x: 900,
        fired: false,
        label: '¡OLEADA!',
        spawns: [
          { x: 1050, y: GROUND_Y - 40 },
          { x: 1150, y: 300 },
          { x: 980, y: GROUND_Y - 40 },
        ],
      },
      {
        x: 2000,
        fired: false,
        label: '¡CUIDADO!',
        spawns: [
          { x: 2150, y: GROUND_Y - 40 },
          { x: 2300, y: GROUND_Y - 40 },
          { x: 2200, y: 320 },
          { x: 2400, y: 280 },
        ],
      },
      {
        x: 3100,
        fired: false,
        label: '¡OLEADA!',
        spawns: [
          { x: 3250, y: GROUND_Y - 40 },
          { x: 3400, y: GROUND_Y - 40 },
          { x: 3350, y: 300 },
          { x: 3500, y: 260 },
        ],
      },
      {
        x: 4000,
        fired: false,
        label: '¡ÚLTIMA CALLE!',
        spawns: [
          { x: 4150, y: GROUND_Y - 40 },
          { x: 4250, y: GROUND_Y - 40 },
          { x: 4200, y: 310 },
        ],
      },
    ];
  }

  private setupCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.pikolin, this.platforms);

    this.movingPlats.forEach((plat) => {
      this.physics.add.collider(this.player, plat);
      this.physics.add.collider(this.enemies, plat);
    });

    // Force blasts vs enemies
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      (bulletObj, enemyObj) => {
        const bullet = bulletObj as Phaser.Physics.Arcade.Sprite & { damage?: number };
        const enemy = enemyObj as Enemy;
        if (!enemy.alive || !bullet.active) return;
        bullet.setActive(false).setVisible(false);
        (bullet.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        this.spawnHitSpark(enemy.x, enemy.y);
        audio.spark();
        const dmg = (bullet as { damage?: number }).damage ?? 1;
        const killed = enemy.takeDamage(dmg);
        if (killed) {
          GameState.addScore(100);
          GameState.addNeptuno(28);
          this.cameras.main.shake(60, 0.006);
        } else {
          GameState.addScore(15);
        }
      },
    );

    this.physics.add.overlap(this.enemyBullets, this.player, (bulletObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active || this.ended) return;
      bullet.setActive(false).setVisible(false);
      (bullet.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      const dead = this.player.takeHit();
      this.cameras.main.shake(120, 0.014);
      this.spawnHitSpark(this.player.x, this.player.y - 10);
      if (dead) this.endMission(false);
    });

    this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.alive || this.ended || this.player.invulnerable) return;
      const dead = this.player.takeHit();
      this.cameras.main.shake(120, 0.014);
      if (dead) this.endMission(false);
    });

    this.physics.add.overlap(this.player, this.pikolin, () => {
      if (!this.ended) this.endMission(true);
    });
  }

  private buildHUD() {
    this.hudPanel = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.hudPanel.fillStyle(0x000000, 0.7);
    this.hudPanel.fillRect(0, 0, 800, 54);
    this.hudPanel.lineStyle(3, 0xce1226, 1);
    this.hudPanel.strokeRect(2, 2, 796, 50);
    this.hudPanel.lineStyle(1, 0xffffff, 0.4);
    this.hudPanel.strokeRect(6, 6, 788, 42);

    this.hudLives = this.add
      .text(18, 14, '', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '18px',
        color: '#ff6688',
      })
      .setScrollFactor(0)
      .setDepth(101)
      .setShadow(2, 2, '#000', 0, false, true);

    this.hudScore = this.add
      .text(400, 14, '', {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '18px',
        color: '#ffe81f',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setShadow(2, 2, '#000', 0, false, true);

    this.hudNeptunoText = this.add
      .text(600, 8, 'GOLPE NEPTUNO', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#00ccff',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.hudNeptuno = this.add.graphics().setScrollFactor(0).setDepth(101);
    this.refreshHUD();
  }

  private refreshHUD() {
    const hearts = '♥'.repeat(GameState.lives) + '♡'.repeat(Math.max(0, 3 - GameState.lives));
    this.hudLives.setText(`VIDAS ${hearts}`);
    this.hudScore.setText(`PTS ${GameState.score}`);

    this.hudNeptuno.clear();
    this.hudNeptuno.fillStyle(0x111122, 1);
    this.hudNeptuno.fillRect(600, 24, 170, 16);
    this.hudNeptuno.lineStyle(2, 0x000000, 1);
    this.hudNeptuno.strokeRect(600, 24, 170, 16);
    const pct = GameState.neptuno / GameState.maxNeptuno;
    this.hudNeptuno.fillStyle(pct >= 1 ? 0x00ffff : 0x0088cc, 1);
    this.hudNeptuno.fillRect(602, 26, 166 * pct, 12);
    if (pct >= 1) {
      this.hudNeptuno.lineStyle(2, 0xffffff, 0.8);
      this.hudNeptuno.strokeRect(600, 24, 170, 16);
      this.hudNeptunoText.setColor('#00ffff');
      this.hudNeptunoText.setText('NEPTUNO ¡LISTO! [K]');
    } else {
      this.hudNeptunoText.setColor('#00ccff');
      this.hudNeptunoText.setText('GOLPE NEPTUNO');
    }
  }

  private setupRain() {
    this.rainGfx = this.add.graphics().setScrollFactor(0).setDepth(45).setAlpha(0.5);
    this.rainDrops = [];
    for (let i = 0; i < 40; i++) {
      this.rainDrops.push({
        x: Phaser.Math.Between(0, 800),
        y: Phaser.Math.Between(0, 600),
        len: Phaser.Math.Between(10, 22),
        speed: Phaser.Math.FloatBetween(5, 12),
      });
    }
  }

  private comicToast(msg: string, color: string, y: number) {
    const t = this.add
      .text(400, y, msg, {
        fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        fontSize: '28px',
        color,
        backgroundColor: '#000000cc',
        padding: { x: 18, y: 10 },
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(80)
      .setShadow(3, 3, '#000', 0, false, true);
    return t;
  }

  private spawnHitSpark(x: number, y: number) {
    const s = this.add.image(x, y, 'hit_spark').setDepth(40).setScale(1.4);
    this.tweens.add({
      targets: s,
      scale: 2.2,
      alpha: 0,
      angle: 90,
      duration: 220,
      onComplete: () => s.destroy(),
    });
    for (let i = 0; i < 5; i++) {
      const p = this.add.image(x, y, 'particle_red').setDepth(39);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: 280,
        onComplete: () => p.destroy(),
      });
    }
  }

  private triggerWave(w: WaveTrigger) {
    w.fired = true;
    audio.waveAlert();
    const toast = this.comicToast(w.label, '#ff3355', 120);
    this.tweens.add({
      targets: toast,
      y: 90,
      alpha: 0,
      delay: 1200,
      duration: 500,
      onComplete: () => toast.destroy(),
    });
    this.cameras.main.shake(150, 0.01);
    w.spawns.forEach((s, i) => {
      this.time.delayedCall(i * 180, () => {
        if (this.ended) return;
        const e = new Enemy(this, s.x, s.y, 100);
        // Drop-in effect
        e.setAlpha(0);
        e.setTint(0xaaccff);
        this.enemies.add(e);
        this.tweens.add({
          targets: e,
          alpha: 1,
          duration: 200,
          onComplete: () => e.clearTint(),
        });
      });
    });
  }

  update(time: number, delta: number) {
    if (this.ended) return;

    // Clamp spike deltas so lag freezes don't stick the player
    const d = Math.min(delta, 50);

    // Player every frame FIRST — responsive controls before world logic
    this.player.update(
      (x, y, dir) => this.fireForce(x, y, dir),
      (x, y, dir) => this.fireNeptuno(x, y, dir),
      d,
    );

    // Moving platforms reverse at ends
    this.movingPlats.forEach((plat) => {
      const p = plat as Phaser.Physics.Arcade.Image & { minX: number; maxX: number };
      const body = plat.body as Phaser.Physics.Arcade.Body;
      if (plat.x >= p.maxX) body.setVelocityX(-70);
      if (plat.x <= p.minX) body.setVelocityX(70);
    });

    // Wave triggers
    this.waves.forEach((w) => {
      if (!w.fired && this.player.x >= w.x) this.triggerWave(w);
    });

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.active && e.alive) {
        e.update(this.player.x, this.player.y, d, (x, y, dir) =>
          this.fireEnemy(x, y, dir),
        );
      }
    });

    this.animateBackground(time, d);

    // Rain
    this.rainGfx.clear();
    this.rainGfx.lineStyle(1, 0xaaccff, 0.45);
    for (const drop of this.rainDrops) {
      this.rainGfx.lineBetween(drop.x, drop.y, drop.x - 3, drop.y + drop.len);
      drop.y += drop.speed * (d / 16);
      drop.x -= 0.7 * (d / 16);
      if (drop.y > 600) {
        drop.y = -10;
        drop.x = Phaser.Math.Between(0, 800);
      }
      if (drop.x < 0) drop.x = 800;
    }

    // Fall death
    if (this.player.y > 640) {
      const dead = this.player.takeHit();
      // Respawn before gap
      const rx = Math.max(60, this.player.x - 120);
      this.player.setPosition(rx, GROUND_Y - 100);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.cameras.main.shake(150, 0.02);
      if (dead) this.endMission(false);
    }

    this.refreshHUD();
  }

  private animateBackground(time: number, delta: number) {
    // Cheap: update neon every other frame-ish via coarse time steps
    const step = Math.floor(time / 120);
    if (step !== (this as unknown as { _neonStep?: number })._neonStep) {
      (this as unknown as { _neonStep?: number })._neonStep = step;
      this.neonSigns.forEach((s, i) => {
        const pulse = 0.7 + 0.3 * Math.sin(time / 220 + i);
        s.setAlpha(pulse);
      });
    }

    // Drones only (no per-frame bg alpha / flicker redraw)
    const dt = Math.min(delta, 50) / 1000;
    for (const d of this.drones) {
      d.gfx.x += d.speed * dt;
      d.gfx.y = d.baseY + Math.sin(time / 400 * d.bob) * 8;
      if (d.speed > 0 && d.gfx.x > WORLD_W + 80) d.gfx.x = -80;
      if (d.speed < 0 && d.gfx.x < -80) d.gfx.x = WORLD_W + 80;
    }
  }

  private fireForce(x: number, y: number, dir: number) {
    // Primary Force blast projectile
    this.playerBullets.spawn(x, y, dir, 520, 'force_blast', true, 1, true);

    // Visual whoosh ring at muzzle
    const ring = this.add
      .image(x, y, 'force_ring')
      .setScale(0.4)
      .setAlpha(0.9)
      .setDepth(21)
      .setFlipX(dir < 0);
    this.tweens.add({
      targets: ring,
      x: x + dir * 50,
      scale: 1.4,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });

    // Red trail particles
    for (let i = 0; i < 4; i++) {
      const p = this.add
        .image(x - dir * i * 6, y + Phaser.Math.Between(-6, 6), 'particle_red')
        .setDepth(20);
      this.tweens.add({
        targets: p,
        x: p.x + dir * 30,
        alpha: 0,
        duration: 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  private fireEnemy(x: number, y: number, dir: number) {
    this.enemyBullets.spawn(x, y, dir, 280, 'bullet_enemy', false, 1, false);
  }

  private fireNeptuno(x: number, y: number, dir: number) {
    const blast = this.add.image(x, y, 'neptuno_blast').setScale(0.5).setDepth(30);
    this.cameras.main.shake(280, 0.025);
    this.tweens.add({
      targets: blast,
      scale: 3.5,
      alpha: 0,
      x: x + dir * 220,
      duration: 520,
      onComplete: () => blast.destroy(),
    });

    // Extra Force rings
    for (let i = 0; i < 3; i++) {
      const r = this.add
        .image(x + dir * i * 40, y, 'force_ring')
        .setScale(0.8 + i * 0.4)
        .setAlpha(0.8)
        .setDepth(29)
        .setTint(0x00ffff);
      this.tweens.add({
        targets: r,
        x: x + dir * (120 + i * 80),
        alpha: 0,
        scale: 2.5,
        duration: 400,
        delay: i * 40,
        onComplete: () => r.destroy(),
      });
    }

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (!e.alive) return;
      const dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (dist < 300 && (dir > 0 ? e.x >= x - 40 : e.x <= x + 40)) {
        const killed = e.takeDamage(5);
        this.spawnHitSpark(e.x, e.y);
        if (killed) {
          GameState.addScore(150);
        }
      }
    });

    this.enemyBullets.getChildren().forEach((obj) => {
      const b = obj as Phaser.Physics.Arcade.Sprite;
      if (b.active && Math.abs(b.x - x) < 280) {
        b.setActive(false).setVisible(false);
      }
    });

    GameState.addScore(50);
  }

  private endMission(won: boolean) {
    if (this.ended) return;
    this.ended = true;
    GameState.missionComplete = won;
    if (won) {
      GameState.addScore(500);
      audio.victory();
      const win = this.comicToast('¡Llegaste a Pikolin!', '#00ffaa', 250);
      win.setScrollFactor(0);
      this.cameras.main.flash(400, 0, 255, 170);
    } else {
      audio.gameOver();
    }
    this.time.delayedCall(won ? 1600 : 700, () => {
      this.scene.start('GameOver', { won });
    });
  }
}
