# Castellum - Technical Architecture

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Browser 1  │  │  Browser 2  │  │  Browser 3  │  │  Browser N  │    │
│  │  (Phaser)   │  │  (Phaser)   │  │  (Phaser)   │  │  (Phaser)   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                   │                                     │
│                            WebSocket (Socket.io)                        │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                                   │                                     │
│                          ┌────────┴────────┐                            │
│                          │   GAME SERVER   │                            │
│                          │    (Node.js)    │                            │
│                          └────────┬────────┘                            │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────┐          │
│         │                         │                         │          │
│  ┌──────┴──────┐          ┌───────┴───────┐         ┌───────┴───────┐  │
│  │   Lobby     │          │    Game       │         │    Game       │  │
│  │  Manager    │          │  Instance 1   │         │  Instance N   │  │
│  └─────────────┘          └───────────────┘         └───────────────┘  │
│                                                                         │
│                              SERVER                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authority Model

**Server Authoritative** - The server is the source of truth.

| What | Who Decides | Why |
|------|-------------|-----|
| Player movement | Server validates | Prevent speed hacks |
| Tower placement | Server validates | Check resources, position |
| Enemy spawns | Server only | Must be synchronized |
| Damage calculation | Server only | Prevent damage hacks |
| Resource changes | Server only | Prevent resource hacks |
| Game phase changes | Server only | Must be synchronized |

**Client Prediction** (for responsiveness):
- Player's own movement (reconciled with server)
- UI interactions (instant feedback)

---

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Client Engine | Phaser 3.60+ | Mature, good docs, TypeScript support |
| Client Language | TypeScript | Type safety, better tooling |
| Client Build | Vite | Fast HMR, simple config |
| Server Runtime | Node.js 20+ | Same language as client |
| Server Framework | Express | Minimal, just for serving |
| WebSocket | Socket.io | Handles reconnection, rooms, fallbacks |
| Shared Code | TypeScript | Types shared between client/server |
| Monorepo | npm workspaces | Simple, no extra tooling |

---

## Project Structure

```
castellum/
├── package.json              # Workspace root
├── packages/
│   ├── client/
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.ts               # Entry point
│   │       ├── config.ts             # Game config
│   │       ├── scenes/
│   │       │   ├── BootScene.ts      # Load assets
│   │       │   ├── LobbyScene.ts     # Join/ready
│   │       │   ├── GameScene.ts      # Main gameplay
│   │       │   ├── VictoryScene.ts   # Win screen
│   │       │   └── GameOverScene.ts  # Lose screen
│   │       ├── entities/
│   │       │   ├── Player.ts
│   │       │   ├── Enemy.ts
│   │       │   ├── Tower.ts
│   │       │   ├── Keep.ts
│   │       │   ├── Altar.ts
│   │       │   ├── Loot.ts
│   │       │   └── Projectile.ts
│   │       ├── systems/
│   │       │   ├── InputSystem.ts
│   │       │   ├── BuildSystem.ts
│   │       │   └── ChatSystem.ts
│   │       ├── network/
│   │       │   ├── NetworkManager.ts # Socket.io client
│   │       │   └── StateSync.ts      # Apply server state
│   │       └── ui/
│   │           ├── HUD.ts
│   │           ├── BuildMenu.ts
│   │           └── ChatBubble.ts
│   │
│   ├── server/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts              # Entry point
│   │       ├── config.ts             # Server config
│   │       ├── network/
│   │       │   ├── SocketServer.ts   # Socket.io setup
│   │       │   └── MessageHandler.ts # Route messages
│   │       ├── lobby/
│   │       │   └── LobbyManager.ts   # Create/join games
│   │       ├── game/
│   │       │   ├── GameInstance.ts   # One per game room
│   │       │   ├── GameLoop.ts       # Fixed timestep
│   │       │   ├── PhaseManager.ts   # Lobby→Prep→Wave
│   │       │   ├── WaveManager.ts    # Enemy spawning
│   │       │   ├── CombatManager.ts  # Damage, targeting
│   │       │   └── EntityManager.ts  # CRUD for entities
│   │       └── entities/
│   │           ├── ServerPlayer.ts
│   │           ├── ServerEnemy.ts
│   │           └── ServerTower.ts
│   │
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── types/
│           │   ├── entities.ts       # Player, Enemy, Tower types
│           │   ├── game.ts           # GameState, Phase types
│           │   └── network.ts        # Message types
│           ├── constants/
│           │   ├── balance.ts        # HP, damage, costs
│           │   ├── game.ts           # Wave count, timings
│           │   └── network.ts        # Tick rate, etc
│           └── utils/
│               ├── math.ts           # Distance, collision
│               └── ids.ts            # ID generation
```

---

## Shared Types

### Entity Types

```typescript
// shared/src/types/entities.ts

export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  nickname: string;
  color: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  isReady: boolean;        // Lobby ready state
  isConnected: boolean;    // For reconnection
}

export interface Enemy {
  id: string;
  type: 'barbarian';
  position: Vector2;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  targetId: string | null; // Keep ID or null
}

export interface Tower {
  id: string;
  type: 'archer';
  position: Vector2;       // Grid position (tile x, y)
  level: number;           // 1, 2, or 3
  hp: number;
  maxHp: number;
  targetId: string | null; // Current target enemy ID
  lastFireTime: number;
}

export interface Keep {
  position: Vector2;
  hp: number;
  maxHp: number;
}

export interface Altar {
  position: Vector2;
}

export interface Loot {
  id: string;
  type: 'gold' | 'wood';
  position: Vector2;
  amount: number;
  spawnTime: number;       // For despawn timer
}

export interface Projectile {
  id: string;
  fromId: string;          // Tower ID
  toId: string;            // Enemy ID
  position: Vector2;
  targetPosition: Vector2;
}
```

### Game State Types

```typescript
// shared/src/types/game.ts

export type GamePhase = 
  | 'lobby'      // Waiting for players
  | 'prep'       // Building phase
  | 'wave'       // Combat phase
  | 'victory'    // Won
  | 'gameover';  // Lost

export interface Resources {
  gold: number;
  wood: number;
}

export interface GameState {
  id: string;              // Room/game ID
  phase: GamePhase;
  wave: number;            // Current wave (1-10)
  maxWaves: number;
  
  // Timers (in ms remaining)
  phaseTimer: number;      // Lobby countdown or prep timer
  
  // Resources (shared pool)
  resources: Resources;
  
  // Entities
  players: Map<string, Player>;
  enemies: Map<string, Enemy>;
  towers: Map<string, Tower>;
  loot: Map<string, Loot>;
  projectiles: Map<string, Projectile>;
  
  // Structures
  keep: Keep;
  altar: Altar;
  
  // Voting
  skipVotes: Set<string>;  // Player IDs who voted skip
  pauseVotes: Set<string>; // Player IDs who voted pause
}
```

### Network Message Types

```typescript
// shared/src/types/network.ts

// ============ CLIENT → SERVER ============

export interface C2S_Join {
  type: 'join';
  gameId: string;
  nickname: string;
}

export interface C2S_Ready {
  type: 'ready';
  ready: boolean;
}

export interface C2S_Move {
  type: 'move';
  direction: Vector2;      // Normalized (-1 to 1)
  timestamp: number;
}

export interface C2S_Build {
  type: 'build';
  towerType: 'archer';
  gridX: number;
  gridY: number;
}

export interface C2S_Upgrade {
  type: 'upgrade';
  towerId: string;
}

export interface C2S_Sell {
  type: 'sell';
  towerId: string;
}

export interface C2S_Repair {
  type: 'repair';
  targetType: 'keep' | 'tower';
  targetId?: string;       // For tower
}

export interface C2S_Revive {
  type: 'revive';
  targetPlayerId: string;
}

export interface C2S_Chat {
  type: 'chat';
  message: string;
}

export interface C2S_VoteSkip {
  type: 'vote_skip';
}

export interface C2S_VotePause {
  type: 'vote_pause';
}

export type ClientMessage =
  | C2S_Join
  | C2S_Ready
  | C2S_Move
  | C2S_Build
  | C2S_Upgrade
  | C2S_Sell
  | C2S_Repair
  | C2S_Revive
  | C2S_Chat
  | C2S_VoteSkip
  | C2S_VotePause;

// ============ SERVER → CLIENT ============

export interface S2C_GameState {
  type: 'game_state';
  state: SerializedGameState; // Full state (on join)
}

export interface S2C_StateDelta {
  type: 'state_delta';
  timestamp: number;
  players?: Partial<Player>[];
  enemies?: Partial<Enemy>[];
  towers?: Partial<Tower>[];
  loot?: Partial<Loot>[];
  resources?: Partial<Resources>;
  keep?: Partial<Keep>;
}

export interface S2C_PhaseChange {
  type: 'phase_change';
  phase: GamePhase;
  wave?: number;
  timer?: number;
}

export interface S2C_PlayerJoined {
  type: 'player_joined';
  player: Player;
}

export interface S2C_PlayerLeft {
  type: 'player_left';
  playerId: string;
}

export interface S2C_PlayerDied {
  type: 'player_died';
  playerId: string;
  position: Vector2;
}

export interface S2C_PlayerRevived {
  type: 'player_revived';
  playerId: string;
}

export interface S2C_EnemySpawned {
  type: 'enemy_spawned';
  enemy: Enemy;
}

export interface S2C_EnemyDied {
  type: 'enemy_died';
  enemyId: string;
  position: Vector2;
  loot: Loot[];
}

export interface S2C_TowerBuilt {
  type: 'tower_built';
  tower: Tower;
}

export interface S2C_TowerUpgraded {
  type: 'tower_upgraded';
  towerId: string;
  level: number;
}

export interface S2C_TowerSold {
  type: 'tower_sold';
  towerId: string;
  refund: Resources;
}

export interface S2C_TowerFired {
  type: 'tower_fired';
  towerId: string;
  targetId: string;
  projectile: Projectile;
}

export interface S2C_LootCollected {
  type: 'loot_collected';
  lootId: string;
  playerId: string;
}

export interface S2C_LootDespawned {
  type: 'loot_despawned';
  lootId: string;
}

export interface S2C_Chat {
  type: 'chat';
  playerId: string;
  message: string;
}

export interface S2C_Error {
  type: 'error';
  code: string;
  message: string;
}

export type ServerMessage =
  | S2C_GameState
  | S2C_StateDelta
  | S2C_PhaseChange
  | S2C_PlayerJoined
  | S2C_PlayerLeft
  | S2C_PlayerDied
  | S2C_PlayerRevived
  | S2C_EnemySpawned
  | S2C_EnemyDied
  | S2C_TowerBuilt
  | S2C_TowerUpgraded
  | S2C_TowerSold
  | S2C_TowerFired
  | S2C_LootCollected
  | S2C_LootDespawned
  | S2C_Chat
  | S2C_Error;
```

---

## Constants

```typescript
// shared/src/constants/balance.ts

export const PLAYER = {
  MAX_HP: 100,
  SPEED: 200,           // pixels per second
  RADIUS: 12,           // collision radius
};

export const ENEMY = {
  barbarian: {
    MAX_HP: 3,
    SPEED: 100,
    DAMAGE: 10,         // to player and keep
    ATTACK_RATE: 1000,  // ms between attacks
    RADIUS: 10,
  },
};

export const TOWER = {
  archer: {
    COST_WOOD: 50,
    UPGRADE_COST_GOLD: [0, 30, 60], // L1, L2, L3
    MAX_HP: [20, 25, 30],
    DAMAGE: [1, 2, 3],
    FIRE_RATE: [1000, 750, 500],    // ms between shots
    RANGE: [150, 175, 200],
  },
};

export const KEEP = {
  MAX_HP: 100,
  REPAIR_COST_GOLD: 10,  // per 5 HP
  REPAIR_AMOUNT: 5,
};

export const ALTAR = {
  REVIVE_COST_GOLD: 50,
};

export const LOOT = {
  DESPAWN_TIME: 15000,   // ms
  PICKUP_RADIUS: 20,
};

export const RESOURCES = {
  STARTING_GOLD: 100,
  STARTING_WOOD: 100,
};

// shared/src/constants/game.ts

export const GAME = {
  MAX_PLAYERS: 10,
  MIN_PLAYERS: 1,
  MAX_WAVES: 10,
  
  LOBBY_COUNTDOWN: 5 * 60 * 1000,  // 5 minutes
  PREP_TIME_FIRST: 30 * 1000,       // First round
  PREP_TIME: 20 * 1000,             // Other rounds
  
  MAP_WIDTH: 800,
  MAP_HEIGHT: 600,
  TILE_SIZE: 32,
  GRID_WIDTH: 25,   // 800 / 32
  GRID_HEIGHT: 19,  // ~600 / 32
};

export const WAVES = [
  { count: 5,  hpMult: 1.0, speedMult: 1.0 },
  { count: 8,  hpMult: 1.0, speedMult: 1.0 },
  { count: 12, hpMult: 1.2, speedMult: 1.0 },
  { count: 15, hpMult: 1.2, speedMult: 1.1 },
  { count: 20, hpMult: 1.5, speedMult: 1.1 },
  { count: 25, hpMult: 1.5, speedMult: 1.2 },
  { count: 30, hpMult: 1.8, speedMult: 1.2 },
  { count: 35, hpMult: 2.0, speedMult: 1.3 },
  { count: 40, hpMult: 2.5, speedMult: 1.3 },
  { count: 50, hpMult: 3.0, speedMult: 1.5 },
];

// shared/src/constants/network.ts

export const NETWORK = {
  TICK_RATE: 20,             // Server ticks per second
  TICK_MS: 50,               // 1000 / 20
  CLIENT_SEND_RATE: 15,      // Client input sends per second
  INTERPOLATION_BUFFER: 100, // ms of buffer for smoothing
};
```

---

## Server Architecture

### Game Loop (Fixed Timestep)

```typescript
// server/src/game/GameLoop.ts

import { NETWORK } from '@shared/constants/network';

export class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private running: boolean = false;
  
  constructor(private update: (dt: number) => void) {}
  
  start() {
    this.running = true;
    this.lastTime = Date.now();
    this.tick();
  }
  
  stop() {
    this.running = false;
  }
  
  private tick = () => {
    if (!this.running) return;
    
    const now = Date.now();
    const frameTime = now - this.lastTime;
    this.lastTime = now;
    
    this.accumulator += frameTime;
    
    // Fixed timestep updates
    while (this.accumulator >= NETWORK.TICK_MS) {
      this.update(NETWORK.TICK_MS);
      this.accumulator -= NETWORK.TICK_MS;
    }
    
    // Schedule next tick
    setImmediate(this.tick);
  };
}
```

### Game Instance

```typescript
// server/src/game/GameInstance.ts (simplified structure)

export class GameInstance {
  private state: GameState;
  private gameLoop: GameLoop;
  private phaseManager: PhaseManager;
  private waveManager: WaveManager;
  private combatManager: CombatManager;
  private entityManager: EntityManager;
  
  constructor(gameId: string) {
    this.state = this.createInitialState(gameId);
    this.gameLoop = new GameLoop(this.update.bind(this));
    this.phaseManager = new PhaseManager(this.state);
    this.waveManager = new WaveManager(this.state);
    this.combatManager = new CombatManager(this.state);
    this.entityManager = new EntityManager(this.state);
  }
  
  private update(dt: number) {
    // 1. Process phase timer
    this.phaseManager.update(dt);
    
    // 2. Update enemies (movement, attacking)
    this.updateEnemies(dt);
    
    // 3. Update towers (targeting, firing)
    this.updateTowers(dt);
    
    // 4. Update projectiles
    this.updateProjectiles(dt);
    
    // 5. Check loot despawn
    this.updateLoot(dt);
    
    // 6. Check win/lose conditions
    this.checkGameEnd();
    
    // 7. Broadcast state delta to clients
    this.broadcastState();
  }
  
  // Message handlers
  handlePlayerJoin(socket, data) { /* ... */ }
  handlePlayerMove(socket, data) { /* ... */ }
  handleBuild(socket, data) { /* ... */ }
  handleUpgrade(socket, data) { /* ... */ }
  // etc.
}
```

### Phase Manager

```typescript
// server/src/game/PhaseManager.ts (simplified)

export class PhaseManager {
  constructor(private state: GameState) {}
  
  update(dt: number) {
    if (this.state.phase === 'lobby') {
      this.updateLobby(dt);
    } else if (this.state.phase === 'prep') {
      this.updatePrep(dt);
    } else if (this.state.phase === 'wave') {
      this.updateWave(dt);
    }
  }
  
  private updateLobby(dt: number) {
    this.state.phaseTimer -= dt;
    
    // Check if all ready or timer expired
    const allReady = this.allPlayersReady();
    const timerExpired = this.state.phaseTimer <= 0;
    
    if ((allReady && this.state.players.size >= 1) || timerExpired) {
      this.startPrepPhase();
    }
  }
  
  private updatePrep(dt: number) {
    this.state.phaseTimer -= dt;
    
    // Check skip votes or timer
    const skipVoted = this.state.skipVotes.size >= this.state.players.size;
    const timerExpired = this.state.phaseTimer <= 0;
    
    if (skipVoted || timerExpired) {
      this.startWavePhase();
    }
  }
  
  private updateWave(dt: number) {
    // Wave ends when all enemies dead
    if (this.state.enemies.size === 0 && this.waveManager.isDoneSpawning()) {
      if (this.state.wave >= this.state.maxWaves) {
        this.state.phase = 'victory';
      } else {
        this.startPrepPhase();
      }
    }
  }
  
  private startPrepPhase() {
    this.state.wave++;
    this.state.phase = 'prep';
    this.state.phaseTimer = this.state.wave === 1 
      ? GAME.PREP_TIME_FIRST 
      : GAME.PREP_TIME;
    this.state.skipVotes.clear();
    
    // Revive all dead players for free
    this.reviveAllPlayers();
    
    this.broadcast({ type: 'phase_change', phase: 'prep', wave: this.state.wave });
  }
  
  private startWavePhase() {
    this.state.phase = 'wave';
    this.waveManager.startWave(this.state.wave);
    
    this.broadcast({ type: 'phase_change', phase: 'wave' });
  }
}
```

---

## Client Architecture

### Scene Flow

```
BootScene → LobbyScene ←→ GameScene → VictoryScene
                                   → GameOverScene
```

### Network Manager

```typescript
// client/src/network/NetworkManager.ts (simplified)

import { io, Socket } from 'socket.io-client';
import { ClientMessage, ServerMessage } from '@shared/types/network';

export class NetworkManager extends Phaser.Events.EventEmitter {
  private socket: Socket;
  
  connect(serverUrl: string) {
    this.socket = io(serverUrl);
    
    this.socket.on('connect', () => {
      this.emit('connected');
    });
    
    this.socket.on('disconnect', () => {
      this.emit('disconnected');
    });
    
    // Route all server messages to event emitter
    this.socket.onAny((type: string, data: any) => {
      this.emit(type, data);
    });
  }
  
  send(message: ClientMessage) {
    this.socket.emit(message.type, message);
  }
  
  join(gameId: string, nickname: string) {
    this.send({ type: 'join', gameId, nickname });
  }
  
  move(direction: Vector2) {
    this.send({ type: 'move', direction, timestamp: Date.now() });
  }
  
  build(gridX: number, gridY: number) {
    this.send({ type: 'build', towerType: 'archer', gridX, gridY });
  }
  
  // etc.
}
```

### Game Scene Structure

```typescript
// client/src/scenes/GameScene.ts (simplified structure)

export class GameScene extends Phaser.Scene {
  // Managers
  private network: NetworkManager;
  private inputSystem: InputSystem;
  private buildSystem: BuildSystem;
  private chatSystem: ChatSystem;
  
  // Entity containers
  private players: Map<string, PlayerSprite>;
  private enemies: Map<string, EnemySprite>;
  private towers: Map<string, TowerSprite>;
  private loot: Map<string, LootSprite>;
  
  // UI
  private hud: HUD;
  private buildMenu: BuildMenu;
  
  // Local state
  private localPlayerId: string;
  private gameState: GameState;
  
  create() {
    this.setupMap();
    this.setupNetwork();
    this.setupInput();
    this.setupUI();
  }
  
  private setupNetwork() {
    this.network.on('game_state', this.onFullState.bind(this));
    this.network.on('state_delta', this.onStateDelta.bind(this));
    this.network.on('phase_change', this.onPhaseChange.bind(this));
    this.network.on('player_joined', this.onPlayerJoined.bind(this));
    this.network.on('enemy_spawned', this.onEnemySpawned.bind(this));
    this.network.on('tower_fired', this.onTowerFired.bind(this));
    // etc.
  }
  
  update(time: number, delta: number) {
    // 1. Handle local input
    this.inputSystem.update();
    
    // 2. Interpolate remote entities
    this.interpolateEntities(delta);
    
    // 3. Update projectile animations
    this.updateProjectiles(delta);
    
    // 4. Update UI
    this.hud.update(this.gameState);
  }
  
  // Network event handlers
  private onStateDelta(delta: S2C_StateDelta) {
    // Apply server state updates with interpolation
  }
  
  private onEnemySpawned(data: S2C_EnemySpawned) {
    const sprite = new EnemySprite(this, data.enemy);
    this.enemies.set(data.enemy.id, sprite);
  }
  
  private onTowerFired(data: S2C_TowerFired) {
    // Create projectile animation (client-side only)
    this.createProjectileAnimation(data.towerId, data.targetId);
  }
}
```

---

## State Synchronization Strategy

### What Syncs and How Often

| Data | Frequency | Method |
|------|-----------|--------|
| Player positions | Every tick (50ms) | Delta in state_delta |
| Enemy positions | Every tick | Delta in state_delta |
| Resources | On change | Event + delta |
| Tower state | On change | Event |
| Phase/wave | On change | Event |
| Chat | On send | Event |

### Delta Compression

Only send what changed:

```typescript
// Server builds delta
function buildStateDelta(current: GameState, previous: GameState): S2C_StateDelta {
  const delta: S2C_StateDelta = {
    type: 'state_delta',
    timestamp: Date.now(),
  };
  
  // Only include players that moved
  const movedPlayers = [];
  for (const [id, player] of current.players) {
    const prev = previous.players.get(id);
    if (!prev || player.position.x !== prev.position.x || player.position.y !== prev.position.y) {
      movedPlayers.push({ id, position: player.position });
    }
  }
  if (movedPlayers.length > 0) delta.players = movedPlayers;
  
  // Same for enemies, etc.
  
  return delta;
}
```

### Client Interpolation

Smooth out network jitter:

```typescript
// Client interpolates between known positions
class InterpolatedEntity {
  private positionBuffer: { time: number; position: Vector2 }[] = [];
  
  addServerPosition(position: Vector2, serverTime: number) {
    this.positionBuffer.push({ time: serverTime, position });
    // Keep only last 1 second of data
    const cutoff = serverTime - 1000;
    this.positionBuffer = this.positionBuffer.filter(p => p.time > cutoff);
  }
  
  getInterpolatedPosition(renderTime: number): Vector2 {
    // Render 100ms in the past for smooth interpolation
    const targetTime = renderTime - NETWORK.INTERPOLATION_BUFFER;
    
    // Find two positions to interpolate between
    let before = null, after = null;
    for (const p of this.positionBuffer) {
      if (p.time <= targetTime) before = p;
      else if (!after) after = p;
    }
    
    if (!before || !after) {
      return before?.position || after?.position || { x: 0, y: 0 };
    }
    
    // Linear interpolation
    const t = (targetTime - before.time) / (after.time - before.time);
    return {
      x: before.position.x + (after.position.x - before.position.x) * t,
      y: before.position.y + (after.position.y - before.position.y) * t,
    };
  }
}
```

---

## Lobby & Reconnection Flow

### Join Flow

```
1. Client opens /game/ABC123
2. Client connects WebSocket
3. Client sends: { type: 'join', gameId: 'ABC123', nickname: 'Bob' }
4. Server checks:
   - Game exists? If not, create it
   - Nickname taken by connected player? Error
   - Nickname exists but disconnected? Reconnect to that player
   - New player? Add to game
5. Server sends: { type: 'game_state', state: {...} }
6. Client renders current state
```

### Reconnection Flow

```
1. Client disconnects (network issue)
2. Server marks player.isConnected = false
3. Player character stays in game
4. Client reconnects, sends same nickname
5. Server matches nickname, sets isConnected = true
6. Server sends full game state
7. Client resumes control
```

---

## Build Validation

Server-side checks before allowing build:

```typescript
function validateBuild(state: GameState, playerId: string, gridX: number, gridY: number): string | null {
  // 1. Check phase
  if (state.phase !== 'prep' && state.phase !== 'wave') {
    return 'Cannot build during this phase';
  }
  
  // 2. Check resources
  if (state.resources.wood < TOWER.archer.COST_WOOD) {
    return 'Not enough wood';
  }
  
  // 3. Check grid bounds
  if (gridX < 0 || gridX >= GAME.GRID_WIDTH || gridY < 0 || gridY >= GAME.GRID_HEIGHT) {
    return 'Out of bounds';
  }
  
  // 4. Check not on keep
  if (isOverlappingKeep(gridX, gridY, state.keep)) {
    return 'Cannot build on keep';
  }
  
  // 5. Check not on altar
  if (isOverlappingAltar(gridX, gridY, state.altar)) {
    return 'Cannot build on altar';
  }
  
  // 6. Check not on existing tower
  for (const tower of state.towers.values()) {
    if (tower.position.x === gridX && tower.position.y === gridY) {
      return 'Space occupied';
    }
  }
  
  return null; // Valid
}
```

---

## Deployment (Localhost / Office LAN)

```
┌─────────────────────────────────────────────────────────┐
│                    HOST MACHINE                         │
│                  (Your computer)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Node.js Server                      │   │
│  │                                                  │   │
│  │   - Express (serves client files)               │   │
│  │   - Socket.io (game server)                     │   │
│  │   - Port: 3000                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
            Local Network (LAN)
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐          ┌────────┐          ┌────────┐
│Browser │          │Browser │          │Browser │
│Player 1│          │Player 2│          │Player N│
└────────┘          └────────┘          └────────┘
```

### How to Run

```bash
# 1. Start server
cd packages/server
npm run dev

# 2. Server shows:
#    Local:   http://localhost:3000
#    Network: http://192.168.1.XXX:3000  ← Share this with office

# 3. Host opens: http://localhost:3000
# 4. Others open: http://192.168.1.XXX:3000
# 5. Create game, share the game link
```

### Game Link Format

```
http://192.168.1.XXX:3000/game/ABC123
                              └── Random game ID
```

### Firewall Note

Host may need to allow Node.js through Windows Firewall (or equivalent) for LAN access.

---

## Development Phases

### Phase 1: Local Foundation
- [ ] Set up monorepo structure
- [ ] Phaser client with placeholder graphics
- [ ] Player movement (local only)
- [ ] Grid system and map rendering
- [ ] Build menu UI

### Phase 2: Server Foundation  
- [ ] Express + Socket.io server
- [ ] Basic lobby (create/join game)
- [ ] Player sync (positions)
- [ ] Game state broadcasting

### Phase 3: Core Gameplay
- [ ] Tower placement and sync
- [ ] Enemy spawning
- [ ] Enemy movement and pathfinding
- [ ] Tower targeting and shooting
- [ ] Combat and damage

### Phase 4: Game Loop
- [ ] Phase system (lobby → prep → wave)
- [ ] Wave progression
- [ ] Resource system
- [ ] Loot drops and collection
- [ ] Win/lose conditions

### Phase 5: Polish
- [ ] Player death and revival
- [ ] Chat system
- [ ] Reconnection
- [ ] Vote skip/pause
- [ ] Error handling

---

## Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authority | Server | Prevent cheating |
| WebSocket lib | Socket.io | Reconnection, rooms, fallbacks |
| Game loop | Fixed timestep (50ms) | Deterministic, fair |
| State sync | Delta compression | Bandwidth efficiency |
| Client prediction | Movement only | Simplicity |
| Entity interpolation | 100ms buffer | Smooth despite jitter |
| Monorepo | npm workspaces | Shared types, simple |

---

*Document version: 1.0*
