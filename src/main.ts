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
  enemies: Enemy[];
  height: number;
  width: number;
  keyboardInputController: KeyboardInputController;
  private enemySpawnFrequency = 1000; // delay between enemies
  private maxEnemies = 5; //maximal number of enemies present at one time

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.player = null;
    this.enemies = [];
    this.keyboardInputController = new KeyboardInputController();
  }
  init() {
    this.keyboardInputController.init();
    this.player = new Player(this);
    this.player.init(this.width * 0.5, this.height * 0.5, 50, 50, 5, 6);
    this.enemies = [];
  }
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.player?.render(ctx);
    this.enemies.forEach((enemy) => enemy.render(ctx));
  }
  update(deltaTime: number) {
    this.player?.update(deltaTime);
    this.enemies.forEach((enemy) => enemy.update(deltaTime));
    if (
      this.timeFromLastEnemySpawned < this.enemySpawnFrequency ||
      this.enemies.length >= this.maxEnemies
    ) {
      this.timeFromLastEnemySpawned += deltaTime;
    } else {
      const enemy = new Enemy(this);
      enemy.init(
        //TODO: spawn ememies only at border moving invard
        getRandom(50, this.width - 50),
        getRandom(50, this.height - 50),
        25,
        25,
        Math.floor(getRandom(0, 360)),
        Math.floor(getRandom(1, 5))
      );
      this.addEnemy(enemy);
    }
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

  constructor(game: Game) {
    this.game = game;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.direction = 0;
    this.rotationSpeed = 0;
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

    let horizontalDirection = 0;
    let verticalDirection = 0;
    if (this.game.keyboardInputController.isPressed("RIGHT")) {
      horizontalDirection = Math.cos(this.direction);
      verticalDirection = Math.sin(this.direction);
    }
    if (this.game.keyboardInputController.isPressed("LEFT")) {
      horizontalDirection = -Math.cos(this.direction);
      verticalDirection = -Math.sin(this.direction);
    }
    if (this.game.keyboardInputController.isPressed("UP")) {
      horizontalDirection = Math.sin(this.direction);
      verticalDirection = -Math.cos(this.direction);
    }
    if (this.game.keyboardInputController.isPressed("DOWN")) {
      horizontalDirection = -Math.sin(this.direction);
      verticalDirection = Math.cos(this.direction);
    }
    this.x = Math.max(
      this.width * 0.5,
      Math.min(
        this.x + this.speed * horizontalDirection,
        this.game.width - this.width * 0.5
      )
    );
    this.y = Math.max(
      this.height * 0.5,
      Math.min(
        this.y + this.speed * verticalDirection,
        this.game.height - this.height * 0.5
      )
    );
  }

  render(ctx: CanvasRenderingContext2D) {
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
      this.game.removeEnemy(this);
      //TODO: change to some form of oposite movement
    }
    const verticalDirection = -Math.cos(this.direction);
    const newY = this.y + this.speed * verticalDirection;
    if (
      this.height * 0.5 <= newY &&
      newY <= this.game.height - this.height * 0.5
    ) {
      this.y = newY;
    } else {
      this.game.removeEnemy(this);
      //TODO: change to some form of oposite movement
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
    ctx.restore();
  }
}
const CONTROLS = {
  UP: "w",
  DOWN: "s",
  LEFT: "a",
  RIGHT: "d",
  ROTATE_LEFT: "q",
  ROTATE_RIGHT: "e",
} as const;

const CONTROLS_BUTTONS = {
  [CONTROLS.UP]: "UP",
  [CONTROLS.DOWN]: "DOWN",
  [CONTROLS.LEFT]: "LEFT",
  [CONTROLS.RIGHT]: "RIGHT",
  [CONTROLS.ROTATE_LEFT]: "ROTATE_LEFT",
  [CONTROLS.ROTATE_RIGHT]: "ROTATE_RIGHT",
} as const;

class KeyboardInputController {
  private pressedKeys: Set<keyof typeof CONTROLS>;
  constructor() {
    this.pressedKeys = new Set();
  }
  init() {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
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
}

const game = new Game(canvas.width, canvas.height);
game.init();

let lastTime = 0;
function animate(currentTime: number) {
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
