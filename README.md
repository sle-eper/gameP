# Pong Game with Vite

A canvas-based Pong game implementation using TypeScript and Vite.

## Features

- Play with a friend (2-player mode)
- Play against AI
- Beautiful countdown animation
- Responsive canvas rendering
- TypeScript for type safety

## Project Structure

```
tranc_test/
├── src/
│   ├── main.ts           # Main game logic
│   ├── Paddle.ts         # Paddle class
│   ├── PongBall.ts       # Ball physics
│   └── CountDown.ts      # Countdown animation
├── css/
│   └── gameCountDown.css # Game styles
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Installation

```bash
npm install
```

## Development

### Option 1: Run Locally

Run the development server with hot module replacement:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Option 2: Run in Docker

Run the dev server inside a Docker container (Node 20):

```bash
docker-compose up dev
```

Then open `http://localhost:5173` in your browser.

**Note:** The dev service runs Vite with hot module replacement (HMR) enabled. File changes will automatically reload in the browser.

## Build

Build for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Preview

Preview the production build:

```bash
npm run preview
```

Or build and serve in Docker:

```bash
docker-compose up build
```

The app will be available at `http://localhost:8080`

## How to Play

1. Click "Play with Friend" for 2-player mode or "Play with AI" for single-player
2. **Left Player**: Use `W` and `S` keys to move up/down
3. **Right Player**: Use `Arrow Up` and `Arrow Down` keys to move up/down (2-player mode only)
4. First to 5 points wins!

## Technologies

- TypeScript
- Vite
- Canvas API
- Web Audio API
