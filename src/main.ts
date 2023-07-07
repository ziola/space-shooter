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
  private height: number;
  private width: number;
  private player: Player | null;

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.player = null;
  }
  init() {
    this.player = new Player(this);
    this.player.init(this.width * 0.5, this.height * 0.5, 50, 50);
  }
  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
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

  constructor(game: Game) {
    this.game = game;
    this.x = -Infinity;
    this.y = -Infinity;
    this.width = 0;
    this.height = 0;
  }

  init(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number) {}

  render(ctx: CanvasRenderingContext2D, deltaTime: number) {
    ctx.fillRect(
      this.x - this.width * 0.5,
      this.y - this.height * 0.5,
      this.width,
      this.height
    );
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
