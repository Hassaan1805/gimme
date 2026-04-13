import { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 760;
const GAME_HEIGHT = 180;
const GROUND_Y = 138;
const PLAYER_X = 56;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 52;
const BASE_SPEED = 6.2;
const GRAVITY = 0.56;
const JUMP_VELOCITY = -11.8;

function createObstacle() {
  const isTall = Math.random() > 0.45;
  const width = isTall ? 18 : 24;
  const height = isTall ? 38 : 28;

  return {
    x: GAME_WIDTH + 24,
    y: GROUND_Y - height,
    width,
    height,
  };
}

function createInitialState() {
  return {
    playerY: GROUND_Y - PLAYER_HEIGHT,
    playerVelocity: 0,
    jumping: false,
    speed: BASE_SPEED,
    score: 0,
    trackOffset: 0,
    spawnTimer: 900,
    obstacles: [],
    gameOver: false,
  };
}

function checkCollision(state, obstacle) {
  const player = {
    x: PLAYER_X + 6,
    y: state.playerY + 5,
    width: PLAYER_WIDTH - 10,
    height: PLAYER_HEIGHT - 6,
  };

  const cactus = {
    x: obstacle.x + 2,
    y: obstacle.y + 2,
    width: obstacle.width - 4,
    height: obstacle.height - 4,
  };

  return (
    player.x < cactus.x + cactus.width &&
    player.x + player.width > cactus.x &&
    player.y < cactus.y + cactus.height &&
    player.y + player.height > cactus.y
  );
}

function drawFrame(ctx, state, dinoImage) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(String(Math.floor(state.score)).padStart(5, '0'), GAME_WIDTH - 96, 24);

  ctx.fillRect(0, GROUND_Y + 8, GAME_WIDTH, 1);

  const dashWidth = 24;
  const lineY = GROUND_Y + 6;
  for (let x = -state.trackOffset; x < GAME_WIDTH + dashWidth; x += dashWidth) {
    ctx.fillRect(x, lineY, 14, 1);
  }

  if (dinoImage && dinoImage.complete && dinoImage.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(dinoImage, PLAYER_X, state.playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
  } else {
    ctx.fillRect(PLAYER_X, state.playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  state.obstacles.forEach((obstacle) => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  if (state.gameOver) {
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 - 8);
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2 - 84, GAME_HEIGHT / 2 + 20);
  }
}

export default function CamouflageMode() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const lastFrameRef = useRef(0);
  const gameStateRef = useRef(createInitialState());
  const dinoImageRef = useRef(null);

  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    const sprite = new Image();
    sprite.src = '/dino.jpeg';
    sprite.onload = () => {
      dinoImageRef.current = sprite;
    };

    return () => {
      dinoImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isGameStarted) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    gameStateRef.current = createInitialState();
    lastFrameRef.current = performance.now();

    const loop = (timestamp) => {
      const deltaMs = Math.min(34, timestamp - lastFrameRef.current || 16.67);
      const step = deltaMs / 16.67;
      const state = gameStateRef.current;

      if (!state.gameOver) {
        state.speed = Math.min(13, state.speed + deltaMs * 0.00026);
        state.score += deltaMs * 0.03;
        state.trackOffset = (state.trackOffset + state.speed * step) % 24;

        state.playerVelocity += GRAVITY * step;
        state.playerY += state.playerVelocity * step;

        const floorY = GROUND_Y - PLAYER_HEIGHT;
        if (state.playerY >= floorY) {
          state.playerY = floorY;
          state.playerVelocity = 0;
          state.jumping = false;
        }

        state.spawnTimer -= deltaMs;
        if (state.spawnTimer <= 0) {
          state.obstacles.push(createObstacle());
          const speedPressure = Math.max(0, state.speed - BASE_SPEED) * 32;
          state.spawnTimer = Math.max(430, 980 - speedPressure) + Math.random() * 420;
        }

        state.obstacles = state.obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - state.speed * step,
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > -20);

        if (state.obstacles.some((obstacle) => checkCollision(state, obstacle))) {
          state.gameOver = true;
        }
      }

      drawFrame(ctx, state, dinoImageRef.current);
      lastFrameRef.current = timestamp;
      frameRef.current = window.requestAnimationFrame(loop);
    };

    drawFrame(ctx, gameStateRef.current, dinoImageRef.current);
    frameRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isGameStarted]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isGameStarted) {
        return;
      }

      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
      const state = gameStateRef.current;

      if (state.gameOver) {
        gameStateRef.current = createInitialState();
        return;
      }

      if (!state.jumping) {
        state.jumping = true;
        state.playerVelocity = JUMP_VELOCITY;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f3f3f3] text-[#5f6368]"
      role="dialog"
      aria-modal="true"
      aria-label="Offline screen"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}
    >
      <div className="w-full max-w-[760px] px-6 sm:px-10">
        {!isGameStarted && (
          <button
            type="button"
            onClick={() => setIsGameStarted(true)}
            className="mb-4 inline-flex h-14 w-14 cursor-pointer items-center justify-center p-0"
            aria-label="Start dino game"
          >
            <img
              src="/dino.jpeg"
              alt="Dino"
              className="h-16 w-16 object-contain"
              draggable="false"
            />
          </button>
        )}

        {isGameStarted && (
          <>
            <div className="mb-6 overflow-hidden rounded border border-black bg-white">
              <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                className="block h-[180px] w-full"
                aria-label="Dino game canvas"
              />
            </div>
            <p className="mb-3 text-xs text-[#80868b]">Press SPACE to jump • Press Ctrl + Shift + X to return</p>
          </>
        )}

        <h1
          className="mb-2 leading-none font-semibold text-[#202124]"
          style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.7rem)' }}
        >
          No internet
        </h1>
        <p className="mb-1 leading-none text-[#5f6368]" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.45rem)' }}>
          Try:
        </p>

        <ul className="mb-6 list-disc space-y-1 pl-6 leading-tight" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.45rem)' }}>
          <li>Checking the network cables, modem, and router</li>
          <li>Reconnecting to Wi-Fi</li>
        </ul>

        <p className="font-medium tracking-tight text-[#5f6368]" style={{ fontSize: 'clamp(0.9rem, 1.7vw, 1.2rem)' }}>
          ERR_INTERNET_DISCONNECTED
        </p>
      </div>
    </div>
  );
}
