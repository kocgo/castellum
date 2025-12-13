import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_CONFIG, getNetworkAddresses } from './config';
import { LobbyManager } from './lobby/LobbyManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Lobby Manager
const lobbyManager = new LobbyManager(io);

// Collision detection helpers
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function circleRectCollide(
  circleX: number,
  circleY: number,
  circleRadius: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  const closestX = clamp(circleX, rectX, rectX + rectWidth);
  const closestY = clamp(circleY, rectY, rectY + rectHeight);
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy < circleRadius * circleRadius;
}

function circlesCollide(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

// Serve static files from client dist folder
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create game
  socket.on('create_game', (data: { nickname: string }) => {
    const result = lobbyManager.createGame(socket, data.nickname);
    if (result) {
      const game = lobbyManager.getGame(result.gameId);
      socket.emit('game_created', {
        type: 'game_created',
        gameId: result.gameId,
        playerId: result.playerId,
      });
      socket.emit('game_state', {
        type: 'game_state',
        state: game?.getSerializedState(),
        playerId: result.playerId,
      });
    } else {
      socket.emit('error', {
        type: 'error',
        code: 'CREATE_FAILED',
        message: 'Failed to create game',
      });
    }
  });

  // Join game
  socket.on('join', (data: { gameId: string; nickname: string }) => {
    const result = lobbyManager.joinGame(socket, data.gameId, data.nickname);
    if (result.success) {
      const game = lobbyManager.getPlayerGame(socket.id);
      socket.emit('game_state', {
        type: 'game_state',
        state: game?.getSerializedState(),
        playerId: result.playerId,
      });
    } else {
      socket.emit('error', {
        type: 'error',
        code: 'JOIN_FAILED',
        message: result.error,
      });
    }
  });

  // Toggle ready status
  socket.on('ready', (data: { ready: boolean }) => {
    lobbyManager.handleReady(socket, data.ready);
  });

  // Handle tower build
  socket.on('build', (data: { gridX: number; gridY: number }) => {
    const game = lobbyManager.getPlayerGame(socket.id);
    if (!game) return;

    const result = game.buildTower(data.gridX, data.gridY);
    if (result.success && result.tower) {
      // Broadcast tower built to all players
      game.broadcast('tower_built', {
        type: 'tower_built',
        tower: result.tower,
      });

      // Broadcast updated resources
      game.broadcast('resources_updated', {
        type: 'resources_updated',
        resources: game.resources,
      });

      console.log(`[Game ${game.id}] Tower built at (${data.gridX}, ${data.gridY})`);
    } else {
      socket.emit('error', {
        type: 'error',
        code: 'BUILD_FAILED',
        message: result.error || 'Failed to build tower',
      });
    }
  });

  // Handle tower upgrade
  socket.on('upgrade', (data: { towerId: string }) => {
    const game = lobbyManager.getPlayerGame(socket.id);
    if (!game) return;

    const result = game.upgradeTower(data.towerId);
    if (result.success && result.level !== undefined) {
      // Broadcast tower upgraded to all players
      game.broadcast('tower_upgraded', {
        type: 'tower_upgraded',
        towerId: data.towerId,
        level: result.level,
      });

      // Broadcast updated resources
      game.broadcast('resources_updated', {
        type: 'resources_updated',
        resources: game.resources,
      });

      console.log(`[Game ${game.id}] Tower ${data.towerId} upgraded to level ${result.level}`);
    } else {
      socket.emit('error', {
        type: 'error',
        code: 'UPGRADE_FAILED',
        message: result.error || 'Failed to upgrade tower',
      });
    }
  });

  // Handle tower sell
  socket.on('sell', (data: { towerId: string }) => {
    const game = lobbyManager.getPlayerGame(socket.id);
    if (!game) return;

    const result = game.sellTower(data.towerId);
    if (result.success && result.refund) {
      // Broadcast tower sold to all players
      game.broadcast('tower_sold', {
        type: 'tower_sold',
        towerId: data.towerId,
        refund: result.refund,
      });

      // Broadcast updated resources
      game.broadcast('resources_updated', {
        type: 'resources_updated',
        resources: game.resources,
      });

      console.log(`[Game ${game.id}] Tower ${data.towerId} sold`);
    } else {
      socket.emit('error', {
        type: 'error',
        code: 'SELL_FAILED',
        message: result.error || 'Failed to sell tower',
      });
    }
  });

  // Handle movement
  socket.on('move', (data: { direction: { x: number; y: number }; timestamp: number }) => {
    const game = lobbyManager.getPlayerGame(socket.id);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player || !player.isAlive) return;

    // Constants
    const PLAYER_SPEED = 200;
    const TICK_MS = 50;
    const PLAYER_RADIUS = 12;
    const MAP_WIDTH = 800;
    const MAP_HEIGHT = 600;
    const KEEP_WIDTH = 96;
    const KEEP_HEIGHT = 96;
    const ALTAR_RADIUS = 20;
    const KEEP_X = MAP_WIDTH / 2;
    const KEEP_Y = MAP_HEIGHT / 2 - 32;
    const ALTAR_X = MAP_WIDTH / 2;
    const ALTAR_Y = MAP_HEIGHT / 2 + 48;

    // Update player position (server authoritative)
    const speed = PLAYER_SPEED * (TICK_MS / 1000);
    const dx = data.direction.x;
    const dy = data.direction.y;

    // Normalize diagonal movement
    let normalizedDx = dx;
    let normalizedDy = dy;
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      normalizedDx = dx / len;
      normalizedDy = dy / len;
    }

    // Calculate new position
    let newX = player.position.x + normalizedDx * speed;
    let newY = player.position.y + normalizedDy * speed;

    // Clamp to bounds
    newX = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, newX));
    newY = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, newY));

    // Check collision with keep
    const keepLeft = KEEP_X - KEEP_WIDTH / 2;
    const keepTop = KEEP_Y - KEEP_HEIGHT / 2;
    const keepCollision = circleRectCollide(
      newX,
      newY,
      PLAYER_RADIUS,
      keepLeft,
      keepTop,
      KEEP_WIDTH,
      KEEP_HEIGHT
    );

    // Check collision with altar
    const altarCollision = circlesCollide(newX, newY, PLAYER_RADIUS, ALTAR_X, ALTAR_Y, ALTAR_RADIUS);

    // Update position if no collision
    if (!keepCollision && !altarCollision) {
      player.position.x = newX;
      player.position.y = newY;
    } else {
      // Try sliding along walls
      const keepXCollision = circleRectCollide(
        newX,
        player.position.y,
        PLAYER_RADIUS,
        keepLeft,
        keepTop,
        KEEP_WIDTH,
        KEEP_HEIGHT
      );
      const altarXCollision = circlesCollide(
        newX,
        player.position.y,
        PLAYER_RADIUS,
        ALTAR_X,
        ALTAR_Y,
        ALTAR_RADIUS
      );
      if (!keepXCollision && !altarXCollision) {
        player.position.x = newX;
      }

      const keepYCollision = circleRectCollide(
        player.position.x,
        newY,
        PLAYER_RADIUS,
        keepLeft,
        keepTop,
        KEEP_WIDTH,
        KEEP_HEIGHT
      );
      const altarYCollision = circlesCollide(
        player.position.x,
        newY,
        PLAYER_RADIUS,
        ALTAR_X,
        ALTAR_Y,
        ALTAR_RADIUS
      );
      if (!keepYCollision && !altarYCollision) {
        player.position.y = newY;
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    lobbyManager.handleDisconnect(socket);
  });
});

// Game loop - update and broadcast state (20 ticks/sec)
setInterval(() => {
  const games = lobbyManager.getAllGames();

  for (const game of games) {
    // Update game logic (phase manager, timers, etc.)
    game.update(SERVER_CONFIG.tickMs);

    // Broadcast state delta to all players during active phases
    if (game.phase === 'prep' || game.phase === 'wave') {
      const players = game.getPlayers().map((p) => ({
        id: p.id,
        position: p.position,
        hp: p.hp,
        isAlive: p.isAlive,
      }));

      const enemies = game.getEnemies().map((e) => ({
        id: e.id,
        position: e.position,
        hp: e.hp,
      }));

      if (players.length > 0 || enemies.length > 0) {
        game.broadcast('state_delta', {
          type: 'state_delta',
          timestamp: Date.now(),
          players,
          enemies,
        });
      }
    }
  }
}, SERVER_CONFIG.tickMs);

// Start server
httpServer.listen(SERVER_CONFIG.port, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('       CASTELLUM GAME SERVER');
  console.log('========================================\n');
  console.log(`Local:   http://localhost:${SERVER_CONFIG.port}`);

  const networkAddresses = getNetworkAddresses();
  if (networkAddresses.length > 0) {
    networkAddresses.forEach((addr) => {
      console.log(`Network: http://${addr}:${SERVER_CONFIG.port}`);
    });
  }

  console.log('\n========================================\n');
});

export { io, lobbyManager };
