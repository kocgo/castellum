import { Socket, Server } from 'socket.io';
import { PhaseManager } from './PhaseManager';

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

interface Tower {
  id: string;
  type: 'archer';
  position: Vector2; // Grid position (tile x, y)
  level: number; // 1, 2, or 3
  hp: number;
  maxHp: number;
  targetId: string | null;
  lastFireTime: number;
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
  private phaseManager: PhaseManager;
  private towers: Map<string, Tower> = new Map();
  private nextTowerId: number = 0;

  constructor(
    gameId: string,
    private io: Server
  ) {
    this.id = gameId;
    this.phaseManager = new PhaseManager(this);
  }

  update(dt: number): void {
    // Update phase manager
    this.phaseManager.update(dt);
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

  getTowers(): Tower[] {
    return Array.from(this.towers.values());
  }

  buildTower(gridX: number, gridY: number): { success: boolean; error?: string; tower?: Tower } {
    // Validate resources
    const towerCost = 50; // wood cost for archer tower level 1
    if (this.resources.wood < towerCost) {
      return { success: false, error: 'Not enough wood' };
    }

    // Validate position (must be on grid)
    const gridWidth = 25; // MAP_WIDTH / TILE_SIZE
    const gridHeight = 19; // MAP_HEIGHT / TILE_SIZE
    if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
      return { success: false, error: 'Out of bounds' };
    }

    // Check not on keep (center tiles)
    const keepGridX = Math.floor(gridWidth / 2);
    const keepGridY = Math.floor(gridHeight / 2) - 1;
    const keepSize = 3; // 96px / 32px
    if (
      gridX >= keepGridX - 1 &&
      gridX < keepGridX + keepSize - 1 &&
      gridY >= keepGridY - 1 &&
      gridY < keepGridY + keepSize - 1
    ) {
      return { success: false, error: 'Cannot build on keep' };
    }

    // Check not on altar
    const altarGridX = Math.floor(gridWidth / 2);
    const altarGridY = Math.floor(gridHeight / 2) + 1;
    if (Math.abs(gridX - altarGridX) <= 1 && Math.abs(gridY - altarGridY) <= 1) {
      return { success: false, error: 'Cannot build on altar' };
    }

    // Check not on existing tower
    for (const tower of this.towers.values()) {
      if (tower.position.x === gridX && tower.position.y === gridY) {
        return { success: false, error: 'Space occupied' };
      }
    }

    // Create tower
    const tower: Tower = {
      id: `tower_${this.nextTowerId++}`,
      type: 'archer',
      position: { x: gridX, y: gridY },
      level: 1,
      hp: 20,
      maxHp: 20,
      targetId: null,
      lastFireTime: 0,
    };

    this.towers.set(tower.id, tower);
    this.resources.wood -= towerCost;

    return { success: true, tower };
  }

  upgradeTower(towerId: string): { success: boolean; error?: string; level?: number } {
    const tower = this.towers.get(towerId);
    if (!tower) {
      return { success: false, error: 'Tower not found' };
    }

    if (tower.level >= 3) {
      return { success: false, error: 'Tower already max level' };
    }

    const upgradeCosts = [0, 30, 60]; // Level 1, 2, 3
    const cost = upgradeCosts[tower.level]; // Cost to upgrade to next level

    if (this.resources.gold < cost) {
      return { success: false, error: 'Not enough gold' };
    }

    tower.level++;
    tower.maxHp = [20, 25, 30][tower.level - 1];
    tower.hp = tower.maxHp;
    this.resources.gold -= cost;

    return { success: true, level: tower.level };
  }

  sellTower(towerId: string): { success: boolean; error?: string; refund?: Resources } {
    const tower = this.towers.get(towerId);
    if (!tower) {
      return { success: false, error: 'Tower not found' };
    }

    // Calculate refund (50% of total cost)
    const towerCost = 50; // wood
    const upgradeCosts = [0, 30, 60]; // gold for upgrades
    let totalGoldSpent = 0;
    for (let i = 1; i < tower.level; i++) {
      totalGoldSpent += upgradeCosts[i];
    }

    const refund: Resources = {
      wood: Math.floor(towerCost * 0.5),
      gold: Math.floor(totalGoldSpent * 0.5),
    };

    this.resources.wood += refund.wood;
    this.resources.gold += refund.gold;
    this.towers.delete(towerId);

    return { success: true, refund };
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
      towers: this.getTowers(),
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
