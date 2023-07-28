import "./style.css";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
canvas.width = 800;
canvas.height = 600;
const context = canvas?.getContext("2d");
if (!context) {
  alert("Canvas is missing!");
  throw new Error("Canvas is missing!");
}
context.fillStyle = "pink";

class Game {
  player: Player | null;
  projectiles: Projectile[];
  enemies: Enemy[];
  height: number;
  width: number;
  keyboardInputController: KeyboardInputController;
  isRunning = false;
  private timeFromLastEnemySpawned = 0; // time from last enemy spawned
  private enemySpawnFrequency = 1000; // delay between enemies
  private maxEnemies = 5; //maximal number of enemies present at one time

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.player = null;
    this.projectiles = [];
    this.enemies = [];
    this.keyboardInputController = new KeyboardInputController();
  }
  init() {
    this.keyboardInputController.init();
    this.startGame();
  }
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.player?.render(ctx);
    this.projectiles.forEach((projectile) => projectile.render(ctx));
    this.enemies.forEach((enemy) => enemy.render(ctx));
  }
  update(deltaTime: number) {
    this.player?.update(deltaTime);
    this.projectiles.forEach((projectile) => projectile.update(deltaTime));
    this.enemies.forEach((enemy) => enemy.update(deltaTime));
    this.spawnEnemy(deltaTime);
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

    enemy.init(x, y, 25, 25, direction, Math.floor(getRandom(1, 5)));
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

  startGame() {
    this.player = new Player(this);
    this.respawn();
    this.isRunning = true;
  }

  respawn() {
    this.player?.init(this.width * 0.5, this.height * 0.5, 50, 50, 5, 6);
    this.projectiles = [];
    this.enemies = [];
  }

  endGame() {
    this.keyboardInputController.reset();
    if (confirm("You lose! Do you want to restart?")) {
      this.startGame();
      return;
    }
    this.isRunning = false;
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
  private livesRemaining: number;

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
  }

  init(
    x: number,
    y: number,
    width: number,
    height: number,
    speed: number,
    rotationSpeed: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.rotationSpeed = (rotationSpeed * Math.PI) / 180;
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
    if (game.keyboardInputController.isPressed("FIRE")) {
      if (this.timeFromLastProjectile < this.projectileFireFrequency) {
        this.timeFromLastProjectile += deltaTime;
      } else {
        const projectile = new Projectile(this.game);
        projectile.init(this.x, this.y, 5, 5, this.direction, 10);
        this.game.addProjectile(projectile);
        this.timeFromLastProjectile = 0;
      }
    }
    //collision detection with enemies
    const hasColided = this.game.enemies.some((enemy) => {
      return detectColision(this.hitbox(), enemy.hitbox());
    });
    if (!hasColided) {
      return;
    }
    this.livesRemaining--;
    if (this.livesRemaining > 0) {
      this.game.respawn();
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
    this.renderLives(ctx);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);
    ctx.fillRect(
      -this.width * 0.5,
      -this.height * 0.5,
      this.width,
      this.height
    );
    ctx.fillStyle = "blue";
    ctx.fillRect(-5, -this.height * 0.5 + 5, 10, 10);
    ctx.restore();
  }

  private renderLives(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.livesRemaining; i++) {
      const horizontalOffset = 10 + (3 + 12) * i;
      ctx.fillStyle = "red";
      ctx.fillRect(
        this.game.width - horizontalOffset - 12,
        this.game.height - 10 - 12,
        12,
        12
      );
      ctx.fillStyle = "white";
      ctx.fillRect(
        this.game.width - horizontalOffset - 11,
        this.game.height - 10 - 11,
        10,
        10
      );
      ctx.restore();
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

  constructor(game: Game) {
    this.game = game;
    this.direction = 0;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
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
    this.direction = (direction * Math.PI) / 180;
    this.speed = speed;
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
      this.game.removeEnemy(this);
      this.game.removeProjectile(collidingProjectile);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);
    ctx.fillStyle = "red";
    ctx.fillRect(
      -this.width * 0.5,
      -this.height * 0.5,
      this.width,
      this.height
    );
    ctx.fillStyle = "green";
    ctx.fillRect(-5, -this.height * 0.5, 10, 10);
    ctx.restore();
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

  constructor(game: Game) {
    this.game = game;
    this.direction = 0;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
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
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);
    ctx.fillStyle = "yellow";
    ctx.fillRect(
      -this.width * 0.5,
      -this.height * 0.5,
      this.width,
      this.height
    );
    ctx.restore();
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
} as const;

const CONTROLS_BUTTONS = {
  [CONTROLS.UP]: "UP",
  [CONTROLS.DOWN]: "DOWN",
  [CONTROLS.LEFT]: "LEFT",
  [CONTROLS.RIGHT]: "RIGHT",
  [CONTROLS.ROTATE_LEFT]: "ROTATE_LEFT",
  [CONTROLS.ROTATE_RIGHT]: "ROTATE_RIGHT",
  [CONTROLS.FIRE]: "FIRE",
} as const;

class KeyboardInputController {
  private pressedKeys: Set<keyof typeof CONTROLS>;
  constructor() {
    this.pressedKeys = new Set();
  }
  init() {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
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

const game = new Game(canvas.width, canvas.height);
game.init();

let lastTime = 0;
function animate(currentTime: number) {
  if (!game.isRunning) {
    return;
  }
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  game.update(deltaTime);
  game.render(context!);
  requestAnimationFrame(animate);
}

animate(0);

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
