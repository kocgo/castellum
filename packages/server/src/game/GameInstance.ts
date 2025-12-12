import { Socket, Server } from 'socket.io';

// Types inline to avoid import issues
interface Vector2 {
  x: number;
  y: number;
}

interface Player {
  id: string;
  nickname: string;
  color: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  isReady: boolean;
  isConnected: boolean;
}

type GamePhase = 'lobby' | 'prep' | 'wave' | 'victory' | 'gameover';

interface Resources {
  gold: number;
  wood: number;
}

// Constants
const PLAYER_MAX_HP = 100;
const STARTING_GOLD = 100;
const STARTING_WOOD = 100;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const LOBBY_COUNTDOWN = 5 * 60 * 1000; // 5 minutes

// Player colors
const PLAYER_COLORS = [
  '#4169e1', // Royal Blue
  '#dc143c', // Crimson
  '#32cd32', // Lime Green
  '#ffa500', // Orange
  '#9932cc', // Dark Orchid
  '#00ced1', // Dark Turquoise
  '#ff69b4', // Hot Pink
  '#ffd700', // Gold
  '#00ff7f', // Spring Green
  '#ff6347', // Tomato
];

export class GameInstance {
  public readonly id: string;
  public phase: GamePhase = 'lobby';
  public wave: number = 0;
  public phaseTimer: number = LOBBY_COUNTDOWN;
  public resources: Resources = {
    gold: STARTING_GOLD,
    wood: STARTING_WOOD,
  };

  private players: Map<string, Player> = new Map();
  private sockets: Map<string, Socket> = new Map();
  private colorIndex: number = 0;

  constructor(
    gameId: string,
    private io: Server
  ) {
    this.id = gameId;
  }

  addPlayer(socket: Socket, nickname: string): Player | null {
    // Check if nickname already exists and is connected
    for (const player of this.players.values()) {
      if (player.nickname === nickname) {
        if (player.isConnected) {
          return null; // Nickname taken
        } else {
          // Reconnecting player
          player.isConnected = true;
          this.sockets.set(player.id, socket);
          socket.join(this.id);
          return player;
        }
      }
    }

    // Create new player
    const player: Player = {
      id: socket.id,
      nickname,
      color: PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length],
      position: {
        x: 100 + Math.random() * 100,
        y: 100 + Math.random() * 100,
      },
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      isAlive: true,
      isReady: false,
      isConnected: true,
    };

    this.colorIndex++;
    this.players.set(player.id, player);
    this.sockets.set(player.id, socket);
    socket.join(this.id);

    return player;
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
    }
    this.sockets.delete(playerId);
  }

  setPlayerReady(playerId: string, ready: boolean): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isReady = ready;
    }
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getConnectedPlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => p.isConnected);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  isAllReady(): boolean {
    const connected = this.getConnectedPlayers();
    return connected.length > 0 && connected.every((p) => p.isReady);
  }

  getSerializedState() {
    return {
      id: this.id,
      phase: this.phase,
      wave: this.wave,
      maxWaves: 10,
      phaseTimer: this.phaseTimer,
      resources: this.resources,
      players: this.getPlayers(),
      enemies: [],
      towers: [],
      loot: [],
      projectiles: [],
      keep: {
        position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 - 32 },
        hp: 100,
        maxHp: 100,
      },
      altar: {
        position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 + 48 },
      },
      skipVotes: [],
      pauseVotes: [],
    };
  }

  broadcast(event: string, data: unknown): void {
    this.io.to(this.id).emit(event, data);
  }

  isEmpty(): boolean {
    return this.getConnectedPlayers().length === 0;
  }
}
