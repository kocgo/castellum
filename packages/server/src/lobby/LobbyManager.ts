import { Server, Socket } from 'socket.io';
import { GameInstance } from '../game/GameInstance';

// Generate random game ID (6 chars)
function generateGameId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class LobbyManager {
  private games: Map<string, GameInstance> = new Map();
  private playerGameMap: Map<string, string> = new Map(); // socketId -> gameId

  constructor(private io: Server) {}

  createGame(socket: Socket, nickname: string): { gameId: string; playerId: string } | null {
    // Generate unique game ID
    let gameId: string;
    do {
      gameId = generateGameId();
    } while (this.games.has(gameId));

    // Create game instance
    const game = new GameInstance(gameId, this.io);
    this.games.set(gameId, game);

    // Add player to game
    const player = game.addPlayer(socket, nickname);
    if (!player) {
      this.games.delete(gameId);
      return null;
    }

    this.playerGameMap.set(socket.id, gameId);

    console.log(`[Lobby] Game ${gameId} created by ${nickname}`);

    return { gameId, playerId: player.id };
  }

  joinGame(
    socket: Socket,
    gameId: string,
    nickname: string
  ): { success: boolean; error?: string; playerId?: string } {
    const game = this.games.get(gameId.toUpperCase());

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.phase !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }

    const player = game.addPlayer(socket, nickname);
    if (!player) {
      return { success: false, error: 'Nickname already taken' };
    }

    this.playerGameMap.set(socket.id, game.id);

    console.log(`[Lobby] ${nickname} joined game ${gameId}`);

    // Notify other players
    socket.to(game.id).emit('player_joined', { player });

    return { success: true, playerId: player.id };
  }

  handleDisconnect(socket: Socket): void {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    game.removePlayer(socket.id);
    this.playerGameMap.delete(socket.id);

    console.log(`[Lobby] Player ${player?.nickname || socket.id} disconnected from game ${gameId}`);

    // Notify other players
    socket.to(gameId).emit('player_left', { playerId: socket.id });

    // Clean up empty games
    if (game.isEmpty()) {
      this.games.delete(gameId);
      console.log(`[Lobby] Game ${gameId} deleted (empty)`);
    }
  }

  handleReady(socket: Socket, ready: boolean): void {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.setPlayerReady(socket.id, ready);

    // Broadcast ready status
    game.broadcast('player_ready', { playerId: socket.id, ready });

    console.log(
      `[Lobby] Player ${socket.id} ready: ${ready} in game ${gameId}`
    );
  }

  getGame(gameId: string): GameInstance | undefined {
    return this.games.get(gameId.toUpperCase());
  }

  getPlayerGame(socketId: string): GameInstance | undefined {
    const gameId = this.playerGameMap.get(socketId);
    return gameId ? this.games.get(gameId) : undefined;
  }
}
