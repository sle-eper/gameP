import { Paddle } from './Paddle';
import { PongBall } from './PongBall';
import CountDown from './CountDown';

console.debug(' main module loaded');

// Game state variables (made accessible for export)
let c: HTMLCanvasElement;
let ctxt: CanvasRenderingContext2D;
let gameStarted = false;
let awaitingServe = false;
let gameOver = false;
let aiMode = false;
let leftScore = 0;
let rightScore = 0;
const winningScore = 5;
let leftPaddle: Paddle;
let rightPaddle: Paddle;
let pongBall: PongBall;
let countdown: CountDown;

export function initializeGame() {
    console.debug('Initializing game...');
    
    // Create canvas dynamically with TypeScript
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.border = '2px solid black';
    canvas.style.borderRadius = '15px';
    canvas.style.zIndex = '1';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.backgroundColor = 'white';
    canvas.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    // Append canvas to container
    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!container) {
        console.error('Canvas container not found');
        console.log('Searching for .canvas-container...');
        console.log('Available classes:', document.querySelectorAll('[class*="canvas"]'));
        return false;
    }
    
    console.debug('Canvas container found, appending canvas');
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('2D context not available');
        return false;
    }

    // Initialize global variables
    c = canvas as HTMLCanvasElement;
    ctxt = ctx as CanvasRenderingContext2D;
    gameStarted = false;
    awaitingServe = false;
    gameOver = false;
    aiMode = false;
    leftScore = 0;
    rightScore = 0;
    leftPaddle = new Paddle(c, ctxt, 0, (c.height - 100) / 2);
    rightPaddle = new Paddle(c, ctxt, (c.width - 10), (c.height - 100) / 2);
    pongBall = new PongBall(c, ctxt);
    countdown = new CountDown();

    function startGame() {
        if (gameOver) return;
        gameStarted = true;
        awaitingServe = false;
        pongBall.start();
    }

    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!gameStarted) return;
        if (e.key === 'w' || e.key === 'W') leftPaddle.moveUp();
        if (e.key === 's' || e.key === 'S') leftPaddle.moveDown();
        if (!aiMode) {
            if (e.key === 'ArrowUp') rightPaddle.moveUp();
            if (e.key === 'ArrowDown') rightPaddle.moveDown();
        }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') leftPaddle.stop();
        if (!aiMode) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') rightPaddle.stop();
        }
    });

    // Wire UI buttons to start the game in Friend or AI mode.
    const btnFriend = document.getElementById('btn-friend') as HTMLButtonElement | null;
    const btnAI = document.getElementById('btn-ai') as HTMLButtonElement | null;

    function disableButtons() {
        if (btnFriend) btnFriend.disabled = true;
        if (btnAI) btnAI.disabled = true;
    }

    if (btnFriend) {
        btnFriend.addEventListener('click', () => {
            aiMode = false;
            disableButtons();
            countdown.start(startGame);
        });
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            aiMode = true;
            disableButtons();
            countdown.start(startGame);
        });
    }

    console.debug('Game initialized successfully');
    return true;
}

export function animate() {
    console.log(' Animating frame');
    requestAnimationFrame(animate);
    ctxt.clearRect(0, 0, c.width, c.height);
    // If AI mode is enabled and the game has started, drive the right paddle toward the ball
    if (aiMode && gameStarted) {
        const paddleCenter = rightPaddle.y + rightPaddle.heightPaddle / 2;
        const diff = pongBall.y - paddleCenter;
        const tolerance = 6;
        if (Math.abs(diff) > tolerance) {
            rightPaddle.scroll = diff > 0 ? rightPaddle.speed : -rightPaddle.speed;
        } else {
            rightPaddle.scroll = 0;
        }
    }
    leftPaddle.update();
    rightPaddle.update();

    // Draw scores before objects
    drawScores();

    if (gameStarted) {
        const scorer = pongBall.update(leftPaddle, rightPaddle);
        if (scorer) {
            // increment score
            if (scorer === 'left') leftScore++;
            else rightScore++;

            // center paddles
            leftPaddle.y = (c.height - leftPaddle.heightPaddle) / 2;
            rightPaddle.y = (c.height - rightPaddle.heightPaddle) / 2;

            // check win
            if (leftScore >= winningScore || rightScore >= winningScore) {
                gameOver = true;
                gameStarted = false;
            } else {
                // Reset ball position and speed, wait 0.5s, then serve
                pongBall.resetPositionAndSpeed();
                // temporarily pause game while waiting to serve
                gameStarted = false;
                awaitingServe = true;
                setTimeout(() => {
                    if (gameOver) return;
                    pongBall.start();
                    gameStarted = true;
                    awaitingServe = false;
                }, 500);
            }
        }
    }

    leftPaddle.draw();
    rightPaddle.draw();
    pongBall.draw();

    if (gameOver) {
        const winner = leftScore >= winningScore ? 'Left Player' : 'Right Player';
        drawWin(winner);
    }
}

function drawScores() {
    ctxt.fillStyle = 'black';
    ctxt.font = '28px sans-serif';
    ctxt.textAlign = 'center';
    // left score
    ctxt.fillText(String(leftScore), c.width * 0.25, 40);
    // right score
    ctxt.fillText(String(rightScore), c.width * 0.75, 40);
}

function drawWin(winner: string) {
    ctxt.fillStyle = 'rgba(0,0,0,0.6)';
    ctxt.fillRect(0, 0, c.width, c.height);
    ctxt.fillStyle = 'white';
    ctxt.font = '42px sans-serif';
    ctxt.textAlign = 'center';
    ctxt.fillText(`${winner} Wins!`, c.width / 2, c.height / 2);
    ctxt.font = '20px sans-serif';
    ctxt.fillText('Press F5 to restart', c.width / 2, c.height / 2 + 40);
}

document.addEventListener('DOMContentLoaded', () => {
    console.debug('DOMContentLoaded fired');
    // Initialize the game immediately when the page loads
    const ok = initializeGame();
    if (ok) {
        // start the animation loop
        animate();
    } else {
        console.error('Failed to initialize game');
    }
});
