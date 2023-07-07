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
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.player?.render(ctx);
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
    let rotationDirection = 0;
    if (this.game.keyboardInputController.isPressed("ROTATE_LEFT")) {
      rotationDirection = -1;
    }
    if (this.game.keyboardInputController.isPressed("ROTATE_RIGHT")) {
      rotationDirection = 1;
    }
    this.angle += this.rotationSpeed * rotationDirection;

    let horizontalDirection = 0;
    let verticalDirection = 0;
    if (this.game.keyboardInputController.isPressed("RIGHT")) {
      horizontalDirection = Math.cos(this.angle);
      verticalDirection = Math.sin(this.angle);
    }
    if (this.game.keyboardInputController.isPressed("LEFT")) {
      horizontalDirection = -Math.cos(this.angle);
      verticalDirection = -Math.sin(this.angle);
    }
    if (this.game.keyboardInputController.isPressed("UP")) {
      horizontalDirection = Math.sin(this.angle);
      verticalDirection = -Math.cos(this.angle);
    }
    if (this.game.keyboardInputController.isPressed("DOWN")) {
      horizontalDirection = -Math.sin(this.angle);
      verticalDirection = Math.cos(this.angle);
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
    ctx.rotate(this.angle);
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
