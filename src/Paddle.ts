export class Paddle {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    widthPaddle: number = 10;
    heightPaddle: number = 100;
    scroll: number = 0;
    speed: number = 2;
    color: string;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, color: string = 'red') {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.color = color;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x, this.y, this.widthPaddle, this.heightPaddle);
    }

    update() {
        this.y += this.scroll;
        this.keepInBounds();
    }

    setY(y: number) {
        this.y = y;
        this.keepInBounds();
    }

    getY(): number {
        return this.y;
    }

    getX(): number {
        return this.x;
    }

    getHeight(): number {
        return this.heightPaddle;
    }

    getWidth(): number {
        return this.widthPaddle;
    }

    private keepInBounds() {
        if (this.y < 0) this.y = 0;
        if (this.y + this.heightPaddle > this.canvas.height) {
            this.y = this.canvas.height - this.heightPaddle;
        }
    }

    moveUp() { this.scroll = -this.speed; }
    moveDown() { this.scroll = this.speed; }
    stop() { this.scroll = 0; }
}
