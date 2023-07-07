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
  private player: Player | null;
  height: number;
  width: number;
  keyboardInputController: KeyboardInputController;

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.player = null;
    this.keyboardInputController = new KeyboardInputController();
  }
  init() {
    this.keyboardInputController.init();
    this.player = new Player(this);
    this.player.init(this.width * 0.5, this.height * 0.5, 50, 50, 5, 6);
  }
  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.player?.render(ctx, deltaTime);
  }
  update(deltaTime: number) {
    this.player?.update(deltaTime);
  }
}

class Player {
  private game: Game;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private angle: number;
  private rotationSpeed: number;

  constructor(game: Game) {
    this.game = game;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.angle = 0;
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
    if (
      this.game.keyboardInputController.isPressed("LEFT") &&
      this.x - this.width * 0.5 - this.speed >= 0
    ) {
      this.x -= this.speed;
    }
    if (
      this.game.keyboardInputController.isPressed("RIGHT") &&
      this.x + this.width * 0.5 + this.speed <= this.game.width
    ) {
      this.x += this.speed;
    }
    if (
      this.game.keyboardInputController.isPressed("UP") &&
      this.y - this.height * 0.5 - this.speed >= 0
    ) {
      this.y -= this.speed;
    }
    if (
      this.game.keyboardInputController.isPressed("DOWN") &&
      this.y + this.height * 0.5 + this.speed <= this.game.height
    ) {
      this.y += this.speed;
    }
    if (this.game.keyboardInputController.isPressed("ROTATE_LEFT")) {
      this.angle -= this.rotationSpeed;
    }
    if (this.game.keyboardInputController.isPressed("ROTATE_RIGHT")) {
      this.angle += this.rotationSpeed;
    }
  }

  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
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
  game.render(context!, deltaTime);
  requestAnimationFrame(animate);
}

animate(0);
