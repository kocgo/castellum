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

  // Handle movement
  socket.on('move', (data: { direction: { x: number; y: number }; timestamp: number }) => {
    const game = lobbyManager.getPlayerGame(socket.id);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player || !player.isAlive) return;

    // Update player position (server authoritative)
    const speed = 200 * (50 / 1000); // PLAYER_SPEED * TICK_MS / 1000
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

    player.position.x += normalizedDx * speed;
    player.position.y += normalizedDy * speed;

    // Clamp to bounds
    player.position.x = Math.max(12, Math.min(800 - 12, player.position.x));
    player.position.y = Math.max(12, Math.min(600 - 12, player.position.y));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    lobbyManager.handleDisconnect(socket);
  });
});

// Game loop - broadcast state updates
setInterval(() => {
  // For each game, broadcast state delta to all players
  // This will be enhanced later with proper delta compression
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
