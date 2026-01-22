import { Paddle } from './Paddle';
import { PongBall } from './PongBall';
import CountDown from './CountDown';
import { io, Socket } from 'socket.io-client';

console.debug(' main module loaded');

// Game state variables (made accessible for export)
let c: HTMLCanvasElement;
let ctxt: CanvasRenderingContext2D;
let gameStarted = false;
let awaitingServe = false;
let gameOver = false;
let aiMode = false;
let remoteMode = false; // New remote mode flag
let leftScore = 0;
let rightScore = 0;
const winningScore = 5;
let leftPaddle: Paddle;
let rightPaddle: Paddle;
let pongBall: PongBall;
let countdown: CountDown;

// Socket.io variables
let socket: Socket;
let playerIndex: number = -1; // 0 for left (host), 1 for right (client)

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
    gameOver = false;
    aiMode = false;
    remoteMode = false;
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

    // Input handling
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!gameStarted && !remoteMode) return; // Allow input even if game not strictly "started" in remote to move paddle? Actually wait for gameStart.
        if (!gameStarted && remoteMode) return; // Wait for server start

        // In remote mode, you only control YOUR paddle.
        // Player 0 (Left): Controls Left Paddle (W/S)
        // Player 1 (Right): Controls Right Paddle (ArrowUp/ArrowDown or W/S mapped to remote)

        if (remoteMode) {
            if (playerIndex === 0) {
                if (e.key === 'w' || e.key === 'W') {
                    leftPaddle.moveUp();
                    emitPaddleMove();
                }
                if (e.key === 's' || e.key === 'S') {
                    leftPaddle.moveDown();
                    emitPaddleMove();
                }
            } else if (playerIndex === 1) {
                // Map W/S or Arrows to "Right Paddle" movement for local player, but visually it is the right paddle
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                    rightPaddle.moveUp();
                    emitPaddleMove();
                }
                if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                    rightPaddle.moveDown();
                    emitPaddleMove();
                }
            }
        } else {
            // Local modes
            if (e.key === 'w' || e.key === 'W') leftPaddle.moveUp();
            if (e.key === 's' || e.key === 'S') leftPaddle.moveDown();
            if (!aiMode) {
                if (e.key === 'ArrowUp') rightPaddle.moveUp();
                if (e.key === 'ArrowDown') rightPaddle.moveDown();
            }
        }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
        // Stop logic
        if (remoteMode) {
            if (playerIndex === 0) {
                if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
                    leftPaddle.stop();
                    emitPaddleMove();
                }
            } else if (playerIndex === 1) {
                if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    rightPaddle.stop();
                    emitPaddleMove();
                }
            }
        } else {
            if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') leftPaddle.stop();
            if (!aiMode) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') rightPaddle.stop();
            }
        }
    });

    function emitPaddleMove() {
        if (!socket) return;
        // Send our paddle's Y position
        const y = playerIndex === 0 ? leftPaddle.y : rightPaddle.y;
        socket.emit('paddleMove', { y });
    }

    // Wire UI buttons
    const btnFriend = document.getElementById('btn-friend') as HTMLButtonElement | null;
    const btnAI = document.getElementById('btn-ai') as HTMLButtonElement | null;

    // Create new Remote button dynamically if not exists, or assume we will add it to HTML.
    // For now, let's look for it or create it.
    let btnRemote = document.getElementById('btn-remote') as HTMLButtonElement | null;

    if (!btnRemote) {
        // Attempt to inject it next to btn-ai if possible, or just log.
        // User plan said "Add a Remote button".
        // Let's assume we modify HTML later, but for now we Can reuse code.
        // We will create it via JS for convenience if not in HTML.
        const controls = document.querySelector('.controls');
        if (controls) {
            btnRemote = document.createElement('button');
            btnRemote.id = 'btn-remote';
            btnRemote.className = 'btn';
            btnRemote.textContent = 'Play Online';
            controls.appendChild(btnRemote);
        }
    }

    function disableButtons() {
        if (btnFriend) btnFriend.disabled = true;
        if (btnAI) btnAI.disabled = true;
        if (btnRemote) btnRemote.disabled = true;
    }

    if (btnFriend) {
        btnFriend.addEventListener('click', () => {
            aiMode = false;
            remoteMode = false;
            disableButtons();
            countdown.start(startGame);
        });
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            aiMode = true;
            remoteMode = false;
            disableButtons();
            countdown.start(startGame);
        });
    }
    if (btnRemote) {
        btnRemote.addEventListener('click', () => {
            aiMode = false;
            remoteMode = true;
            disableButtons();
            initRemoteGame();
        });
    }

    function initRemoteGame() {
        console.log("Connecting to server...");
        socket = io('http://localhost:3000'); // Assuming backend on 3000

        socket.on('connect', () => {
            console.log('Connected to server');
            socket.emit('joinGame');
        });

        socket.on('playerAssigned', (data: { playerIndex: number }) => {
            console.log(`Assigned as Player ${data.playerIndex}`);
            playerIndex = data.playerIndex;
        });

        socket.on('waitingForOpponent', () => {
            console.log('Waiting for opponent...');
            // Maybe show a UI "Waiting..." message
        });

        socket.on('gameStart', () => {
            console.log('Remote game starting!');
            countdown.start(() => {
                if (gameOver) return;
                gameStarted = true;
                awaitingServe = false;
                // Only Player 0 starts the ball physics locally,
                // BUT we rely on updates. 
                // Actually, let Player 0 drive physics and emit updates.
                if (playerIndex === 0) {
                    pongBall.start();
                }
            });
        });

        socket.on('opponentMove', (data: { y: number }) => {
            // Update the OPPONENT'S paddle
            if (playerIndex === 0) {
                rightPaddle.y = data.y; // We are left, opponent is right
            } else {
                leftPaddle.y = data.y; // We are right, opponent is left
            }
        });

        socket.on('ballUpdate', (data: { x: number, y: number, vx: number, vy: number }) => {
            // If we are NOT the host (Player 0), we strictly follow the ball update
            if (playerIndex !== 0) {
                pongBall.x = data.x;
                pongBall.y = data.y;
                pongBall.incrementWidth = data.vx;
                pongBall.incrementHeight = data.vy;
            }
        });

        socket.on('scoreUpdate', (data: { left: number, right: number }) => {
            leftScore = data.left;
            rightScore = data.right;
        });

        socket.on('opponentDisconnected', () => {
            alert('Opponent disconnected!');
            location.reload();
        });
    }

    console.debug('Game initialized successfully');
    return true;
}

export function animate() {
    requestAnimationFrame(animate);
    ctxt.clearRect(0, 0, c.width, c.height);

    // AI Logic (Only if AI mode)
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

    // Update paddles (physics/position update from local scroll)
    leftPaddle.update();
    rightPaddle.update();

    // Draw scores before objects
    drawScores();

    if (gameStarted) {
        // Physics Logic
        // In local/AI mode: calculated locally.
        // In Remote mode: 
        //   - Player 0 calculates physics and sends updates.
        //   - Player 1 just renders (and extrapolates if we were fancy, but for now just renders).

        let shouldUpdatePhysics = true;
        if (remoteMode && playerIndex !== 0) {
            shouldUpdatePhysics = false; // Slave client
        }

        if (shouldUpdatePhysics) {
            const scorer = pongBall.update(leftPaddle, rightPaddle);
            if (remoteMode && playerIndex === 0) {
                // Emit ball state constantly or periodically
                socket.emit('ballUpdate', {
                    x: pongBall.x,
                    y: pongBall.y,
                    vx: pongBall.incrementWidth,
                    vy: pongBall.incrementHeight
                });
            }

            if (scorer) {
                if (scorer === 'left') leftScore++;
                else rightScore++;

                if (remoteMode && playerIndex === 0) {
                    socket.emit('scoreUpdate', { left: leftScore, right: rightScore });
                }

                leftPaddle.y = (c.height - leftPaddle.heightPaddle) / 2;
                rightPaddle.y = (c.height - rightPaddle.heightPaddle) / 2;

                if (leftScore >= winningScore || rightScore >= winningScore) {
                    gameOver = true;
                    gameStarted = false;
                } else {
                    pongBall.resetPositionAndSpeed();
                    gameStarted = false;
                    setTimeout(() => {
                        if (gameOver) return;
                        if (!remoteMode || playerIndex === 0) {
                            pongBall.start();
                        }
                        gameStarted = true;
                    }, 500);
                }
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
    ctxt.fillText(String(leftScore), c.width * 0.25, 40);
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
        animate();
    } else {
        console.error('Failed to initialize game');
    }
});
