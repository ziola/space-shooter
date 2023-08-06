import "./style.css";

class Game {
  private loop: GameLoop | null;

  player: Player | null;
  projectiles: Projectile[];
  enemies: Enemy[];
  explosions: Explosion[];
  livesPanel: LivesPanel | null;
  scorePanel: ScorePanel | null;
  menuPanel: MenuPanel | null;

  height: number;
  width: number;
  keyboardInputController: KeyboardInputController;
  assetManager: AssetManager;
  private timeFromLastEnemySpawned = 0; // time from last enemy spawned
  private enemySpawnFrequency = 1000; // delay between enemies
  private maxEnemies = 5; //maximal number of enemies present at one time
  private isPlayerKilled = false;
  private isPaused = true;

  constructor(width: number, height: number) {
    this.loop = null;
    this.height = height;
    this.width = width;
    this.player = null;
    this.projectiles = [];
    this.enemies = [];
    this.explosions = [];
    this.keyboardInputController = new KeyboardInputController();
    this.assetManager = new AssetManager();
    this.livesPanel = new LivesPanel(this);
    this.scorePanel = new ScorePanel(this);
    this.menuPanel = new MenuPanel(this);

    this.endGame = this.endGame.bind(this);
    this.resumeGame = this.resumeGame.bind(this);
    this.startGame = this.startGame.bind(this);
  }
  init(gameLoop: GameLoop) {
    this.loop = gameLoop;
    this.keyboardInputController.init();
    this.assetManager.init();
    this.menuPanel?.init([
      { label: "START", onActivate: this.startGame },
      { label: "CREDITS", onActivate: () => alert("TODO: CREDITS") },
    ]);
    this.isPaused = true;
  }
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.isPlayerKilled) {
      this.player?.render(ctx);
      this.projectiles.forEach((projectile) => projectile.render(ctx));
      this.enemies.forEach((enemy) => enemy.render(ctx));
    }
    this.explosions.forEach((explosion) => explosion.render(ctx));
    this.livesPanel?.render(ctx);
    this.scorePanel?.render(ctx);
    if (this.isPaused) {
      this.menuPanel?.render(ctx);
    }
  }
  update(deltaTime: number) {
    if (this.keyboardInputController.isPressed("PAUSE")) {
      this.pauseGame();
      return;
    }
    if (this.isPaused) {
      this.menuPanel?.update(deltaTime);
      return;
    }
    if (!this.isPlayerKilled) {
      this.player?.update(deltaTime);
      this.projectiles.forEach((projectile) => projectile.update(deltaTime));
      this.enemies.forEach((enemy) => enemy.update(deltaTime));
      this.spawnEnemy(deltaTime);
    }
    if (this.isPlayerKilled && this.explosions.length === 0) {
      this.respawn();
    }
    this.explosions.forEach((explosion) => explosion.update(deltaTime));
  }
  onLoop(deltaTime: number) {
    this.update(deltaTime);
    this.render(context!);
  }

  spawnEnemy(deltaTime: number) {
    if (
      this.timeFromLastEnemySpawned < this.enemySpawnFrequency ||
      this.enemies.length >= this.maxEnemies
    ) {
      this.timeFromLastEnemySpawned += deltaTime;
      return;
    }
    const enemy = new Enemy(this);
    const { x, y, direction } = calculateSpawnPoint({
      width: this.width,
      height: this.height,
    });

    enemy.init(
      x,
      y,
      25,
      25,
      direction,
      Math.floor(getRandom(1, 5)),
      Math.floor(getRandom(0, 35))
    );
    this.addEnemy(enemy);
    this.timeFromLastEnemySpawned = 0;
  }
  addProjectile(projectile: Projectile) {
    this.projectiles.push(projectile);
  }
  removeProjectile(projectile: Projectile) {
    const projectileIndex = this.projectiles.indexOf(projectile);
    if (projectileIndex === -1) {
      return;
    }
    this.projectiles.splice(projectileIndex, 1);
  }
  addEnemy(enemy: Enemy) {
    this.enemies.push(enemy);
  }
  removeEnemy(enemy: Enemy) {
    const enemyIndex = this.enemies.indexOf(enemy);
    if (enemyIndex === -1) {
      return;
    }
    this.enemies.splice(enemyIndex, 1);
    this.timeFromLastEnemySpawned = 0;
  }
  addExplosion(explosion: Explosion) {
    this.explosions.push(explosion);
  }
  removeExplosion(explosion: Explosion) {
    const explosionIndex = this.explosions.indexOf(explosion);
    if (explosionIndex === -1) {
      return;
    }
    this.explosions.splice(explosionIndex, 1);
  }

  enemyKilled(enemy: Enemy, projectile: Projectile) {
    this.removeEnemy(enemy);
    this.removeProjectile(projectile);
    this.player?.increaseScore(1);
  }

  startGame() {
    this.keyboardInputController.reset();
    this.player = new Player(this);
    // this.livesPanel = new LivesPanel(this);
    this.livesPanel?.init(this.player, this.width - 10, this.height - 10);
    // this.scorePanel = new ScorePanel(this);
    this.scorePanel?.init(this.player, 8, 24);
    this.respawn();
    this.timeFromLastEnemySpawned = Infinity;
    this.isPaused = false;
  }

  respawn() {
    this.player?.init(this.width * 0.5, this.height * 0.5, 32, 32, 5, 6, 0);
    this.projectiles = [];
    this.enemies = [];
    this.explosions = [];
    this.isPlayerKilled = false;
  }

  killPlayer() {
    this.enemies.forEach((enemy) => enemy.explode());
    this.isPlayerKilled = true;
  }

  endGame() {
    this.killPlayer();
    this.isPaused = true;
    this.menuPanel?.init([
      { label: "NEW GAME", onActivate: this.startGame },
      { label: "CREDITS", onActivate: this.endGame },
    ]);
  }

  resumeGame() {
    this.isPaused = false;
  }

  pauseGame() {
    this.isPaused = true;
    this.menuPanel?.init([
      { label: "RESUME", onActivate: this.resumeGame },
      { label: "RESTART", onActivate: this.startGame },
    ]);
  }
}

class MenuPanel {
  private game: Game;
  private items: { label: string; onActivate: () => void }[] = [];
  private activeItem = 0;
  private readonly inputDelay = 250;
  private lastInput = 0;

  constructor(game: Game) {
    this.game = game;
  }

  //TODO add setting posision
  init(items: typeof this.items) {
    this.items = items;
    this.activeItem = 0;
    this.lastInput = 0;
  }

  update(deltaTime: number) {
    if (this.lastInput < this.inputDelay) {
      this.lastInput += deltaTime;
      return;
    }
    if (this.game.keyboardInputController.isPressed("ACTIVATE")) {
      this.items[this.activeItem].onActivate();
      this.lastInput = 0;
      return;
    } else if (this.game.keyboardInputController.isPressed("UP")) {
      const newActiveItem = this.activeItem - 1;
      if (newActiveItem < 0) {
        this.activeItem = this.items.length - 1;
      } else {
        this.activeItem = newActiveItem;
      }
      this.lastInput = 0;
    } else {
      if (this.game.keyboardInputController.isPressed("DOWN")) {
        const newActiveItem = this.activeItem + 1;
        if (newActiveItem >= this.items.length) {
          this.activeItem = 0;
        } else {
          this.activeItem = newActiveItem;
        }
        this.lastInput = 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // overlay
    ctx.fillStyle = "hsl(0 0% 40% / 50%)";
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    const itemHeight = 32;

    ctx.fillStyle = "hsl(120, 100%, 40%)";
    ctx.font = `${itemHeight}px SyntheticText`;

    this.items.forEach(({ label }, index) => {
      const measurement = ctx.measureText(label);
      const gap = 16;
      const x = this.game.width * 0.5 - measurement.width * 0.5;
      const y =
        this.game.height * 0.5 - itemHeight * 0.5 + (itemHeight + gap) * index;
      ctx.fillText(label, x, y);
      if (index === this.activeItem) {
        const overhang = 4;
        const padding = 3;
        ctx.fillRect(
          x - overhang,
          y + padding,
          measurement.width + overhang * 2,
          1
        );
      }
    });
    ctx.restore();
  }
}

class Player {
  private game: Game;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private direction: number;
  private rotationSpeed: number; // in radians
  private timeFromLastProjectile = Infinity; // time from last projectile spawned
  private readonly projectileFireFrequency = 250; // delay between projectiles
  livesRemaining: number;
  private score = 0;
  private img: HTMLImageElement | undefined;
  private type: number;

  constructor(game: Game) {
    this.game = game;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.direction = 0;
    this.rotationSpeed = 0;
    this.livesRemaining = 3;
    this.img = this.game.assetManager.getImage("player_ships");
    this.type = 0;
  }

  init(
    x: number,
    y: number,
    width: number,
    height: number,
    speed: number,
    rotationSpeed: number,
    type: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.rotationSpeed = (rotationSpeed * Math.PI) / 180;
    this.type = type;
  }

  get currentScore() {
    return this.score;
  }

  update(deltaTime: number) {
    let rotationDirection = 0;
    if (this.game.keyboardInputController.isPressed("ROTATE_LEFT")) {
      rotationDirection = -1;
    }
    if (this.game.keyboardInputController.isPressed("ROTATE_RIGHT")) {
      rotationDirection = 1;
    }
    this.direction += this.rotationSpeed * rotationDirection;

    let xMove = 0;
    let yMove = 0;
    if (this.game.keyboardInputController.isPressed("RIGHT")) {
      xMove += Math.cos(this.direction) * this.speed;
      yMove += Math.sin(this.direction) * this.speed;
    }
    if (this.game.keyboardInputController.isPressed("LEFT")) {
      xMove += -Math.cos(this.direction) * this.speed;
      yMove += -Math.sin(this.direction) * this.speed;
    }
    if (this.game.keyboardInputController.isPressed("UP")) {
      xMove += Math.sin(this.direction) * this.speed;
      yMove += -Math.cos(this.direction) * this.speed;
    }
    if (this.game.keyboardInputController.isPressed("DOWN")) {
      xMove += -Math.sin(this.direction) * this.speed;
      yMove += Math.cos(this.direction) * this.speed;
    }
    this.x = Math.max(
      this.width * 0.5,
      Math.min(this.x + xMove, this.game.width - this.width * 0.5)
    );
    this.y = Math.max(
      this.height * 0.5,
      Math.min(this.y + yMove, this.game.height - this.height * 0.5)
    );
    if (this.game.keyboardInputController.isPressed("FIRE")) {
      if (this.timeFromLastProjectile < this.projectileFireFrequency) {
        this.timeFromLastProjectile += deltaTime;
      } else {
        const projectile = new Projectile(this.game);
        projectile.init(this.x, this.y, 6, 24, this.direction, 10);
        this.game.addProjectile(projectile);
        this.timeFromLastProjectile = 0;
      }
    }
    //collision detection with enemies
    const isColiding = this.game.enemies.some((enemy) => {
      return detectColision(this.hitbox(), enemy.hitbox());
    });
    if (!isColiding) {
      return;
    }
    this.livesRemaining--;
    const explosion = new Explosion(this.game);
    explosion.init(this.x, this.y, this.width, this.height);
    this.game.addExplosion(explosion);
    if (this.livesRemaining > 0) {
      this.game.killPlayer();
    } else {
      this.game.endGame();
    }
  }

  hitbox() {
    return hitbox({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    this.renderPlayer(ctx);
  }

  increaseScore(points: number) {
    this.score += points;
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    if (this.img) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.direction);
      ctx.drawImage(
        this.img,
        0,
        this.type * 8,
        8,
        8,
        -this.width * 0.5,
        -this.height * 0.5,
        this.width,
        this.height
      );
      // hitbox
      // ctx.fillStyle = "blue";
      // ctx.strokeRect(
      //   -this.width * 0.5,
      //   -this.height * 0.5,
      //   this.width,
      //   this.height
      // );
      ctx.restore();
    }
  }
}

class ScorePanel {
  private game: Game;
  private player: Player | null;
  private x: number;
  private y: number;
  private height: number = 16;

  constructor(game: Game) {
    this.game = game;
    this.player = null;
    this.x = 0;
    this.y = 0;
  }

  init(player: Player, x: number, y: number) {
    this.player = player;
    this.x = x;
    this.y = y;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.player) {
      return;
    }
    ctx.save();
    ctx.fillStyle = "hsl(120, 100%, 40%)";
    ctx.font = "24px SyntheticText";
    ctx.fillText(this.player.currentScore.toString(), this.x, this.y);
    ctx.restore();
  }
}

class LivesPanel {
  private game: Game;
  private player: Player | null;
  private x: number;
  private y: number;
  private width: number = 16;
  private height: number = 16;
  private img: HTMLImageElement | undefined;

  constructor(game: Game) {
    this.game = game;
    this.player = null;
    this.x = 0;
    this.y = 0;
    this.img = this.game.assetManager.getImage("icons");
  }

  init(player: Player, x: number, y: number) {
    this.player = player;
    this.x = x;
    this.y = y;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.img) {
      const margin = 3;
      ctx.save();
      for (let i = 0; i < (this.player?.livesRemaining ?? 0); i++) {
        ctx.drawImage(
          this.img,
          0,
          0,
          8,
          8,
          this.x - this.width * (i + 1) - margin * i,
          this.y - this.height,
          this.width,
          this.height
        );
      }
    }
  }
}

class Enemy {
  private game: Game;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private direction: number;
  private img: HTMLImageElement | undefined;
  private type: number;

  constructor(game: Game) {
    this.game = game;
    this.direction = 0;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.img = this.game.assetManager.getImage("enemy_ships");
    this.type = 0;
  }

  init(
    x: number,
    y: number,
    width: number,
    height: number,
    direction: number,
    speed: number,
    type: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = (direction * Math.PI) / 180;
    this.speed = speed;
    this.type = type;
  }

  update(deltaTime: number) {
    const xDistance = this.speed * Math.sin(this.direction);
    const newX = this.x + xDistance;
    const halfWidth = this.width * 0.5;
    if (halfWidth <= newX && newX <= this.game.width - halfWidth) {
      this.x = newX;
    } else {
      this.x -= xDistance;
      this.direction *= -1;
    }
    const yDistance = this.speed * -Math.cos(this.direction);
    const newY = this.y + yDistance;
    const halfHeight = this.height * 0.5;
    if (halfHeight <= newY && newY <= this.game.height - halfHeight) {
      this.y = newY;
    } else {
      this.y -= yDistance;
      this.direction =
        (this.direction >= 0 ? Math.PI : -Math.PI) - this.direction;
    }

    const collidingProjectile = this.game.projectiles.find((projectile) => {
      return detectColision(this.hitbox(), projectile.hitbox());
    });
    if (collidingProjectile) {
      const explosion = new Explosion(this.game);
      explosion.init(this.x, this.y, this.width, this.height);
      this.game.addExplosion(explosion);
      this.game.enemyKilled(this, collidingProjectile);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.img) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.direction);
      const sy = this.type % 6;
      const sx = Math.floor(this.type / 6);
      ctx.drawImage(
        this.img,
        sx * 8,
        sy * 8,
        8,
        8,
        -this.width * 0.5,
        -this.height * 0.5,
        this.width,
        this.height
      );
      //debug
      // ctx.fillStyle = "red";
      // ctx.fillRect(
      //   -this.width * 0.5,
      //   -this.height * 0.5,
      //   this.width,
      //   this.height
      // );
      ctx.restore();
    }
  }

  hitbox() {
    return hitbox({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }

  explode() {
    const explosion = new Explosion(this.game);
    explosion.init(this.x, this.y, this.width, this.height);
    this.game.addExplosion(explosion);
  }
}

class Explosion {
  private game: Game;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private frame: number;
  private currentFrame = 0;
  private readonly maxFrame = 3;
  private img: HTMLImageElement | undefined;

  constructor(game: Game) {
    this.game = game;
    this.frame = 0;
    this.maxFrame = 3;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.img = this.game.assetManager.getImage("icons");
  }

  init(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.currentFrame = 0;
  }

  update(deltaTime: number) {
    this.frame++;
    if (this.frame > 12) {
      this.currentFrame++;
      this.frame = 0;
    }
    if (this.currentFrame > this.maxFrame) {
      this.game.removeExplosion(this);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.img) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.drawImage(
        this.img,
        8 * this.currentFrame,
        8,
        8,
        8,
        -this.width * 0.5,
        -this.height * 0.5,
        this.width,
        this.height
      );
      // debug;
      // ctx.fillStyle = "yellow";
      // ctx.fillRect(
      //   -this.width * 0.5,
      //   -this.height * 0.5,
      //   this.width,
      //   this.height
      // );
      ctx.restore();
    }
  }

  hitbox() {
    return hitbox({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }
}

class Projectile {
  private game: Game;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private direction: number;
  private img: HTMLImageElement | undefined;

  constructor(game: Game) {
    this.game = game;
    this.direction = 0;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.img = this.game.assetManager.getImage("icons");
  }

  init(
    x: number,
    y: number,
    width: number,
    height: number,
    direction: number,
    speed: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = direction;
    this.speed = speed;
  }

  update(deltaTime: number) {
    const horizontalDirection = Math.sin(this.direction);
    const newX = this.x + this.speed * horizontalDirection;
    if (
      this.width * 0.5 <= newX &&
      newX <= this.game.width - this.width * 0.5
    ) {
      this.x = newX;
    } else {
      this.game.removeProjectile(this);
    }
    const verticalDirection = -Math.cos(this.direction);
    const newY = this.y + this.speed * verticalDirection;
    if (
      this.height * 0.5 <= newY &&
      newY <= this.game.height - this.height * 0.5
    ) {
      this.y = newY;
    } else {
      this.game.removeProjectile(this);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.img) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.direction);
      ctx.drawImage(
        this.img,
        0,
        16,
        3,
        3,
        -this.width * 0.5,
        -this.height * 0.5,
        this.width,
        this.height
      );
      // debug;
      // ctx.fillStyle = "yellow";
      // ctx.fillRect(
      //   -this.width * 0.5,
      //   -this.height * 0.5,
      //   this.width,
      //   this.height
      // );
      ctx.restore();
    }
  }

  hitbox() {
    return hitbox({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }
}

const CONTROLS = {
  UP: "w",
  DOWN: "s",
  LEFT: "a",
  RIGHT: "d",
  ROTATE_LEFT: "q",
  ROTATE_RIGHT: "e",
  FIRE: " ",
  PAUSE: "Escape",
  ACTIVATE: "Enter",
} as const;

const CONTROLS_BUTTONS = {
  [CONTROLS.UP]: "UP",
  [CONTROLS.DOWN]: "DOWN",
  [CONTROLS.LEFT]: "LEFT",
  [CONTROLS.RIGHT]: "RIGHT",
  [CONTROLS.ROTATE_LEFT]: "ROTATE_LEFT",
  [CONTROLS.ROTATE_RIGHT]: "ROTATE_RIGHT",
  [CONTROLS.FIRE]: "FIRE",
  [CONTROLS.PAUSE]: "PAUSE",
  [CONTROLS.ACTIVATE]: "ACTIVATE",
} as const;

class KeyboardInputController {
  private pressedKeys: Set<keyof typeof CONTROLS>;
  constructor() {
    this.pressedKeys = new Set();
  }
  init() {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
        case CONTROLS.PAUSE:
        case CONTROLS.ACTIVATE:
        case CONTROLS.FIRE:
        case CONTROLS.UP:
        case CONTROLS.DOWN:
        case CONTROLS.LEFT:
        case CONTROLS.RIGHT:
        case CONTROLS.ROTATE_LEFT:
        case CONTROLS.ROTATE_RIGHT: {
          this.pressedKeys.add(CONTROLS_BUTTONS[e.key]);
          break;
        }
      }
    });
    document.addEventListener("keyup", (e: KeyboardEvent) => {
      switch (e.key) {
        case CONTROLS.PAUSE:
        case CONTROLS.ACTIVATE:
        case CONTROLS.FIRE:
        case CONTROLS.UP:
        case CONTROLS.DOWN:
        case CONTROLS.LEFT:
        case CONTROLS.RIGHT:
        case CONTROLS.ROTATE_LEFT:
        case CONTROLS.ROTATE_RIGHT: {
          this.pressedKeys.delete(CONTROLS_BUTTONS[e.key]);
          break;
        }
      }
    });
  }
  isPressed(key: keyof typeof CONTROLS) {
    return this.pressedKeys.has(key);
  }
  reset() {
    this.pressedKeys.clear();
  }
}

class AssetManager {
  private images = new Map<string, HTMLImageElement>();

  init() {
    for (const image of document.images) {
      const name = image.src.split("/").slice(-1)[0].split(".")[0];
      this.images.set(name, image);
    }
  }

  getImage(name: string) {
    return this.images.get(name);
  }
}

class GameLoop {
  private lastTime = 0;
  private onLoop: FrameRequestCallback = () => {};
  private animationFrame: number | null;

  constructor() {
    this.animationFrame = null;
  }

  init(onLoop: (deltaTime: number) => void) {
    this.onLoop = (time: number) => {
      this.animationFrame = requestAnimationFrame(this.onLoop);
      const deltaTime = time - this.lastTime;
      this.lastTime = time;
      onLoop(deltaTime);
    };
  }

  start() {
    this.lastTime = 0;
    this.animationFrame = requestAnimationFrame(this.onLoop);
  }

  end() {
    this.animationFrame && cancelAnimationFrame(this.animationFrame);
  }
}

// UTILS
function getRandom(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

type Hitbox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function detectColision(hitbox1: Hitbox, hitbox2: Hitbox) {
  return (
    hitbox1.left <= hitbox2.right &&
    hitbox1.right >= hitbox2.left &&
    hitbox1.top <= hitbox2.bottom &&
    hitbox1.bottom >= hitbox2.top
  );
}

function hitbox({
  height,
  width,
  x,
  y,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Hitbox {
  return {
    left: x - width * 0.5,
    right: x + width * 0.5,
    top: y - height * 0.5,
    bottom: y + height * 0.5,
  };
}

function calculateSpawnPoint({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const randomValue = getRandom();
  if (randomValue < 0.25) {
    // from top
    return {
      x: getRandom(25, width - 25),
      y: 25,
      direction: Math.floor(getRandom(91, 269)),
    };
  }
  if (randomValue < 0.5) {
    // from right
    return {
      x: width - 25,
      y: getRandom(20, height - 25),
      direction: Math.floor(getRandom(181, 359)),
    };
  }
  if (randomValue < 0.75) {
    // from bottom
    return {
      x: getRandom(25, width - 25),
      y: height - 25,
      direction: Math.floor(getRandom(-271, 89)),
    };
  }
  // from left
  return {
    x: 25,
    y: getRandom(25, height - 25),
    direction: Math.floor(getRandom(1, 179)),
  };
}

async function loadAssets() {
  const syntheticText = new FontFace(
    "SyntheticText",
    "url(./SyntheticText.ttf)"
  );

  const font = await syntheticText.load();
  document.fonts.add(font);
  return Promise.resolve();
}

//TODO refactor into proper asset manager
const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
canvas.width = 640;
canvas.height = 480;
const context = canvas?.getContext("2d");
if (!context) {
  alert("Canvas is missing!");
  throw new Error("Canvas is missing!");
}
context.imageSmoothingEnabled = false;

loadAssets().then(() => {
  // Entry point
  const gameLoop = new GameLoop();
  const game = new Game(canvas.width, canvas.height);
  game.init(gameLoop);
  gameLoop.init(game.onLoop.bind(game));
  gameLoop.start();
});
