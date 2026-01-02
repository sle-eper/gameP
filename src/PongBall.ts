import { Paddle } from './Paddle';

export class PongBall {
    canvas: HTMLCanvasElement;
    c: CanvasRenderingContext2D;
    x: number;
    y: number;
    incrementWidth: number = 0;
    incrementHeight: number = 0;
    radius: number = 15;
    initialSpeed: number = 1.2;
    speed: number = this.initialSpeed;
    speedIncrement: number = 0.2;

    constructor(canvas: HTMLCanvasElement, c: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.c = c;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }

    start() {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
        this.incrementWidth = Math.cos(angle) * this.speed * dir;
        this.incrementHeight = Math.sin(angle) * this.speed;
    }

    draw() {
        this.c.beginPath();
        this.c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.c.fillStyle = 'purple';
        this.c.fill();
        this.c.strokeStyle = 'red';
        this.c.stroke();
    }

    checkPaddleCollision(paddle: Paddle): boolean {
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.heightPaddle;
        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + paddle.widthPaddle;

        const ballLeft = this.x - this.radius;
        const ballRight = this.x + this.radius;
        const ballTop = this.y - this.radius;
        const ballBottom = this.y + this.radius;

        if (ballBottom >= paddleTop && ballTop <= paddleBottom) {
            if (paddle.x <= 10) {
                if (ballRight >= paddleLeft && ballLeft <= paddleRight) {
                    this.x = paddleRight + this.radius;
                    this.incrementWidth = -this.incrementWidth;
                    this.increaseSpeed();
                    return true;
                }
            }
            else {
                if (ballRight >= paddleLeft && ballLeft <= paddleRight) {
                    this.x = paddleLeft - this.radius;
                    this.incrementWidth = -this.incrementWidth;
                    this.increaseSpeed();
                    return true;
                }
            }
        }
        return false;
    }

    // Increase the overall velocity magnitude by `speedIncrement`, preserving direction.
    increaseSpeed() {
        const curMag = Math.hypot(this.incrementWidth, this.incrementHeight);
        const newMag = curMag + this.speedIncrement;
        if (curMag === 0) {
            // fallback if magnitude is 0 (shouldn't normally happen)
            const dir = Math.random() < 0.5 ? -1 : 1;
            this.incrementWidth = dir * newMag;
            this.incrementHeight = 0;
            this.speed = newMag;
            return;
        }
        const scale = newMag / curMag;
        this.incrementWidth *= scale;
        this.incrementHeight *= scale;
        this.speed = newMag;
    }

    // Reset position and restore base speed. Does not start movement.
    resetPositionAndSpeed() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.speed = this.initialSpeed;
        // Do not call `start()` here; caller decides when to serve.
        this.incrementWidth = 0;
        this.incrementHeight = 0;
    }

    // Returns 'left' if left player scored, 'right' if right player scored, otherwise null.
    update(leftPaddle: Paddle, rightPaddle: Paddle): 'left' | 'right' | null {
        if (!this.checkPaddleCollision(leftPaddle) && !this.checkPaddleCollision(rightPaddle)) {
            if (this.x + this.radius > this.canvas.width) {
                // ball passed the right edge -> left player scores
                this.resetPositionAndSpeed();
                return 'left';
            }
            if (this.x - this.radius < 0) {
                // ball passed the left edge -> right player scores
                this.resetPositionAndSpeed();
                return 'right';
            }
        }

        if (this.y + this.radius > this.canvas.height || this.y - this.radius < 0) this.incrementHeight = -this.incrementHeight;

        this.x += this.incrementWidth;
        this.y += this.incrementHeight;
        return null;
    }
}
