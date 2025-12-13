# Castellum - Developer Guide

This guide provides detailed information for developers working on Castellum.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Folder Structure](#folder-structure)
3. [Development Workflow](#development-workflow)
4. [Code Organization](#code-organization)
5. [Key Concepts](#key-concepts)
6. [Adding New Features](#adding-new-features)
7. [Testing](#testing)
8. [Debugging](#debugging)

---

## Project Architecture

Castellum uses a **monorepo architecture** with three packages managed by npm workspaces:

```
┌─────────────────────────────────────────────────────────────┐
│                      castellum/ (root)                      │
│                                                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │  @client   │    │  @server   │    │  @shared   │       │
│  │  (Phaser)  │    │  (Node.js) │    │  (Types)   │       │
│  └──────┬─────┘    └──────┬─────┘    └──────┬─────┘       │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    imports from shared                      │
└─────────────────────────────────────────────────────────────┘
```

### Why This Structure?

- **Shared Types:** TypeScript types and constants are shared between client and server, preventing mismatches
- **Independent Building:** Each package can be built independently
- **Type Safety:** Changes to shared types automatically propagate to both client and server
- **Simple Tooling:** Uses npm workspaces - no need for Lerna, Nx, or other tools

---

## Folder Structure

### Root Level

```
castellum/
├── package.json              # Root workspace, npm scripts
├── package-lock.json         # Locked dependencies
├── tsconfig.json             # Base TypeScript config (extended by packages)
├── .gitignore                # Git ignore rules
├── README.md                 # User-facing documentation
├── DEVELOPER_GUIDE.md        # This file
├── CLAUDE_CODE_PROMPT.md     # Implementation task list
├── docs/                     # Design documentation
│   ├── game-design-doc.md    # Game mechanics specification
│   └── architecture.md       # Technical architecture details
└── packages/                 # Monorepo packages
    ├── client/
    ├── server/
    └── shared/
```

### Client Package (`packages/client/`)

The **Phaser 3 game client** that runs in the browser.

```
packages/client/
├── package.json              # Client dependencies
├── tsconfig.json             # Client TypeScript config
├── vite.config.ts            # Vite build configuration
├── index.html                # HTML entry point
├── dist/                     # Built files (git-ignored)
└── src/
    ├── main.ts               # Entry point - creates Phaser game
    ├── config.ts             # Game configuration (colors, server URL)
    │
    ├── scenes/               # Phaser scenes
    │   ├── BootScene.ts      # Asset loading (currently minimal)
    │   ├── LobbyScene.ts     # Join/create game, ready system
    │   ├── GameScene.ts      # Main gameplay scene
    │   ├── VictoryScene.ts   # Win screen (TODO)
    │   └── GameOverScene.ts  # Lose screen (TODO)
    │
    ├── network/              # Networking layer
    │   ├── NetworkManager.ts # Socket.io client wrapper
    │   └── StateSync.ts      # Apply server state updates
    │
    └── ui/                   # UI components
        ├── HUD.ts            # In-game HUD (resources, wave, timer)
        ├── BuildMenu.ts      # Tower building menu
        └── ChatBubble.ts     # Chat message display
```

**Key Files:**
- [main.ts](packages/client/src/main.ts) - Creates Phaser game instance, registers scenes
- [GameScene.ts](packages/client/src/scenes/GameScene.ts) - Main gameplay loop, entity rendering
- [NetworkManager.ts](packages/client/src/network/NetworkManager.ts) - Handles all Socket.io communication

### Server Package (`packages/server/`)

The **Node.js game server** using Express and Socket.io.

```
packages/server/
├── package.json              # Server dependencies
├── tsconfig.json             # Server TypeScript config
├── dist/                     # Built files (git-ignored)
└── src/
    ├── index.ts              # Entry point - Express + Socket.io setup
    ├── config.ts             # Server configuration (port, tick rate)
    │
    ├── lobby/                # Lobby management
    │   └── LobbyManager.ts   # Create/join games, player connections
    │
    ├── game/                 # Core game logic
    │   ├── GameInstance.ts   # One instance per active game
    │   ├── PhaseManager.ts   # Lobby → Prep → Wave → Victory/GameOver
    │   ├── WaveManager.ts    # Enemy spawning logic
    │   ├── CombatManager.ts  # Damage calculation, targeting
    │   └── EntityManager.ts  # CRUD operations for entities
    │
    └── network/              # Network layer
        ├── SocketServer.ts   # Socket.io server instance
        └── MessageHandler.ts # Route incoming client messages
```

**Key Files:**
- [index.ts](packages/server/src/index.ts) - Main server file, message routing, game loop
- [GameInstance.ts](packages/server/src/game/GameInstance.ts) - Core game state and logic
- [LobbyManager.ts](packages/server/src/lobby/LobbyManager.ts) - Multiplayer lobby system

### Shared Package (`packages/shared/`)

**Shared TypeScript code** used by both client and server.

```
packages/shared/
├── package.json              # Shared package config
├── tsconfig.json             # Shared TypeScript config
├── dist/                     # Built files (git-ignored)
└── src/
    ├── index.ts              # Re-exports everything
    │
    ├── types/                # TypeScript type definitions
    │   ├── entities.ts       # Player, Enemy, Tower, Keep, Altar, Loot, Projectile
    │   ├── game.ts           # GameState, GamePhase, Resources
    │   └── network.ts        # All client→server and server→client messages
    │
    ├── constants/            # Game balance and configuration
    │   ├── balance.ts        # HP, damage, costs, speeds
    │   ├── game.ts           # Map size, wave configs, timings
    │   └── network.ts        # Tick rate, interpolation settings
    │
    └── utils/                # Utility functions
        ├── math.ts           # Vector math, distance, collision detection
        └── ids.ts            # ID generation (nanoid)
```

**Key Files:**
- [types/network.ts](packages/shared/src/types/network.ts) - Defines all message contracts
- [constants/balance.ts](packages/shared/src/constants/balance.ts) - Game balance values
- [utils/math.ts](packages/shared/src/utils/math.ts) - Collision detection helpers

---

## Development Workflow

### Initial Setup

```bash
# Clone and install
git clone <repository-url>
cd castellum
npm install
```

This installs dependencies for all packages (root, client, server, shared).

### Day-to-Day Development

**Option 1: Development Mode - Single Command (Recommended)**

```bash
npm run dev
```

This runs both client and server in one terminal with color-coded output:
- **Server** (blue) on `http://localhost:3000` - Auto-restarts on code changes
- **Client** (green) on `http://localhost:5173` - Hot-reloads on code changes

**Option 2: Development Mode - Separate Terminals**

If you prefer separate terminals for easier log reading:

```bash
# Terminal 1
npm run dev:server
# Auto-restarts on server code changes

# Terminal 2
npm run dev:client
# Hot-reloads on client code changes
```

- Server runs on `http://localhost:3000`
- Client dev server runs on `http://localhost:5173`
- Client dev server proxies WebSocket to the server

**Option 3: Production-like Mode**

Build everything and run the production server:

```bash
npm run build
npm start
```

- Server serves built client from `packages/client/dist/`
- No hot-reload, must rebuild after changes

### Making Changes

#### 1. Changing Shared Types

```bash
# Edit shared types
vim packages/shared/src/types/entities.ts

# Rebuild shared package
npm run build:shared

# TypeScript will now show errors in client/server if they use outdated types
```

**Important:** After changing shared types, restart both dev servers to pick up changes.

#### 2. Changing Client Code

```bash
# Edit client code
vim packages/client/src/scenes/GameScene.ts

# If dev:client is running, changes auto-reload
# Otherwise, rebuild manually:
npm run build:client
```

#### 3. Changing Server Code

```bash
# Edit server code
vim packages/server/src/game/GameInstance.ts

# If dev:server is running, server auto-restarts
# Otherwise, rebuild manually:
npm run build:server
```

### Build Commands

```bash
# Build everything (shared → client → server)
npm run build

# Build individual packages
npm run build:shared
npm run build:client
npm run build:server

# Clean build artifacts
rm -rf packages/*/dist
```

---

## Code Organization

### Client-Side Organization

**Scenes** - Phaser scenes represent different screens:
- `BootScene` - Loads assets (currently minimal)
- `LobbyScene` - Join/create game UI
- `GameScene` - Main gameplay
- `VictoryScene` / `GameOverScene` - End screens

**Network Layer** - Abstraction over Socket.io:
- `NetworkManager` - Wraps Socket.io client, provides typed methods
- `StateSync` - Applies server state updates to local game state

**UI Components** - Phaser UI elements:
- `HUD` - Shows resources, wave, keep HP
- `BuildMenu` - Tower placement UI
- `ChatBubble` - Displays chat messages

### Server-Side Organization

**Lobby Management:**
- `LobbyManager` - Creates games, manages player joins/leaves
- Maintains `Map<gameId, GameInstance>`

**Game Logic:**
- `GameInstance` - One per active game, holds all state
- `PhaseManager` - State machine for game phases
- `WaveManager` - Handles enemy spawning
- `CombatManager` - Damage calculation, targeting
- `EntityManager` - CRUD for game entities

**Network Layer:**
- `SocketServer` - Socket.io server setup
- `MessageHandler` - Routes client messages to appropriate handlers

### Shared Code Organization

**Types:**
- `entities.ts` - Game object interfaces (Player, Enemy, Tower, etc.)
- `game.ts` - Game state and phase definitions
- `network.ts` - All network message types (C2S and S2C)

**Constants:**
- `balance.ts` - Gameplay values (HP, damage, costs)
- `game.ts` - Map size, wave configurations
- `network.ts` - Network tick rate, interpolation buffer

**Utils:**
- `math.ts` - Vector math, collision detection
- `ids.ts` - Unique ID generation

---

## Key Concepts

### Server-Authoritative Architecture

**The server is the source of truth** for all game state.

```
Client                          Server
  │                               │
  ├─ Input: Move Left ────────►  │
  │                               ├─ Validate
  │                               ├─ Update position
  │                               ├─ Check collisions
  │                               │
  │  ◄──── Position Update ───────┤
  │                               │
  └─ Render at new position       │
```

**Why?**
- Prevents cheating (speed hacks, position hacks, etc.)
- Ensures all players see the same game state
- Single source of truth for complex interactions

### Fixed Timestep Game Loop

The server updates at a **fixed rate of 20 ticks/second** (50ms per tick):

```typescript
setInterval(() => {
  // Update all game instances
  for (const game of games) {
    game.update(50); // Always 50ms
  }
}, 50);
```

**Benefits:**
- Deterministic physics (same inputs = same outputs)
- Fair for all players (no advantage from higher FPS)
- Easier to debug and replay

### Network State Synchronization

**Full State** - Sent when player joins:
```typescript
{
  type: 'game_state',
  state: { players: [...], enemies: [...], towers: [...], ... }
}
```

**Delta Updates** - Sent every tick during gameplay:
```typescript
{
  type: 'state_delta',
  timestamp: 123456789,
  players: [{ id: 'p1', position: {x: 100, y: 200} }],  // Only changed
  enemies: [{ id: 'e1', hp: 2 }],                        // Only changed
}
```

**Why deltas?**
- Bandwidth efficiency (only send what changed)
- Scales better with more entities
- Easier to debug (see exactly what changed)

### Client Prediction and Interpolation

**Prediction (for local player):**
```typescript
// Client immediately moves player on input
player.x += speed * dt;

// Server validates and sends correction
if (serverPos !== clientPos) {
  player.x = serverPos.x; // Snap to server position
}
```

**Interpolation (for remote entities):**
```typescript
// Client buffers positions and interpolates
const renderTime = now - 100ms; // Render 100ms in the past
const pos = interpolate(positionBuffer, renderTime);
enemy.x = pos.x;
enemy.y = pos.y;
```

This makes movement smooth despite network jitter.

---

## Adding New Features

### Example: Adding a New Tower Type

**1. Update Shared Types**

```typescript
// packages/shared/src/types/entities.ts
export type TowerType = 'archer' | 'cannon'; // Add 'cannon'

export interface Tower {
  id: string;
  type: TowerType;
  // ... rest unchanged
}
```

**2. Add Balance Constants**

```typescript
// packages/shared/src/constants/balance.ts
export const TOWER = {
  archer: { /* ... */ },
  cannon: {  // New tower type
    COST_WOOD: 75,
    UPGRADE_COST_GOLD: [0, 40, 80],
    MAX_HP: [30, 40, 50],
    DAMAGE: [5, 8, 12],
    FIRE_RATE: [2000, 1500, 1000],
    RANGE: [200, 250, 300],
  },
};
```

**3. Update Server Logic**

```typescript
// packages/server/src/game/GameInstance.ts
buildTower(gridX: number, gridY: number, type: TowerType) {
  const cost = TOWER[type].COST_WOOD;

  if (this.resources.wood < cost) {
    return { success: false, error: 'Not enough wood' };
  }

  // Create tower...
  const tower: Tower = {
    id: generateId(),
    type: type,  // Now supports 'cannon'
    // ...
  };

  this.towers.set(tower.id, tower);
  this.resources.wood -= cost;

  return { success: true, tower };
}
```

**4. Update Client Rendering**

```typescript
// packages/client/src/scenes/GameScene.ts
private renderTower(tower: Tower) {
  const color = tower.type === 'archer' ? 0x00ff00 : 0xff9900; // Orange for cannon
  const rect = this.add.rectangle(x, y, 32, 32, color);
  // ...
}
```

**5. Update Build Menu**

```typescript
// packages/client/src/ui/BuildMenu.ts
this.add.text(10, 10, 'Build Archer (50w)', { /* ... */ });
this.add.text(10, 40, 'Build Cannon (75w)', { /* ... */ }); // New option
```

**6. Rebuild and Test**

```bash
npm run build:shared
# Restart dev servers to pick up changes
npm run dev:server
npm run dev:client
```

---

## Testing

**Current Status:** No automated tests (see project review for recommendations).

### Manual Testing Checklist

When adding features, test:

1. **Single Player**
   - Create game, start playing alone
   - Verify feature works as expected

2. **Multiplayer**
   - Open two browser tabs
   - Join same game
   - Verify both players see the same state

3. **Network Issues**
   - Disconnect and reconnect
   - Verify game state is preserved

4. **Edge Cases**
   - Test with 0 resources
   - Test with max resources
   - Test rapid clicking/spamming

### Recommended: Add Automated Tests

See the project review for test setup recommendations using Vitest.

---

## Debugging

### Client-Side Debugging

**Browser DevTools:**
```javascript
// Open console (F12)

// Inspect network messages
// Go to Network tab → WS (WebSocket) → Click connection → Messages

// Access Phaser game instance
window.game; // If exposed in main.ts

// Access current scene
const scene = window.game.scene.getScene('GameScene');
scene.gameState; // Inspect game state
```

**Common Issues:**

- **Sprites not rendering:** Check if position is within camera bounds (0-800, 0-600)
- **Input not working:** Verify scene has input focus
- **Network messages not received:** Check browser console for WebSocket errors

### Server-Side Debugging

**Enable Verbose Logging:**
```typescript
// packages/server/src/index.ts
console.log('[Game] Player moved to', position);
console.log('[Game] Enemy spawned', enemy.id);
console.log('[Game] Tower fired at', target.id);
```

**Debug Game State:**
```typescript
// In any server file
console.log('Current phase:', game.phase);
console.log('Players:', game.players.size);
console.log('Enemies:', game.enemies.size);
console.log('Resources:', game.resources);
```

**Use tsx Debug Mode:**
```bash
# Run server with Node.js debugger
node --inspect node_modules/.bin/tsx packages/server/src/index.ts

# In Chrome, navigate to chrome://inspect
# Click "inspect" under your Node process
```

**Common Issues:**

- **Players can't join:** Check `LobbyManager`, verify game ID is valid
- **Entities not updating:** Check `update()` is being called in game loop
- **Collisions not working:** Verify collision detection math in `circleRectCollide()`

### Network Debugging

**Monitor Messages:**
```bash
# Add to server index.ts
io.on('connection', (socket) => {
  socket.onAny((event, ...args) => {
    console.log('[Socket IN]', event, args);
  });

  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    console.log('[Socket OUT]', event, args);
    return originalEmit.apply(socket, [event, ...args]);
  };
});
```

**Test Latency:**
```typescript
// Client sends timestamp
network.send({ type: 'move', timestamp: Date.now() });

// Server echoes back
socket.emit('pong', { serverTime: Date.now() });

// Client calculates roundtrip
const latency = Date.now() - timestamp;
console.log('Latency:', latency, 'ms');
```

---

## Best Practices

### TypeScript

- **Use strict mode** (already enabled in `tsconfig.json`)
- **Define interfaces** for all game objects in `shared/types/`
- **Avoid `any`** - use `unknown` if type is truly unknown
- **Export types** from shared package, import in client/server

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-tower-type

# Make changes, commit frequently
git add .
git commit -m "Add cannon tower type"

# Push and create PR
git push origin feature/new-tower-type
```

### Code Style

- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and types
- Use **UPPER_SNAKE_CASE** for constants
- Keep functions **small and focused** (< 50 lines)
- Add comments for **complex logic only**

### Performance

- **Avoid premature optimization** - get it working first
- **Profile before optimizing** - use Chrome DevTools
- **Minimize state sent over network** - use delta updates
- **Pool objects** if creating/destroying frequently (e.g., projectiles)

---

## Useful Resources

### Phaser 3
- [Official Docs](https://photonstorm.github.io/phaser3-docs/)
- [Examples](https://phaser.io/examples)
- [Community Discord](https://discord.gg/phaser)

### Socket.io
- [Official Docs](https://socket.io/docs/v4/)
- [TypeScript Guide](https://socket.io/docs/v4/typescript/)

### TypeScript
- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Multiplayer Game Dev
- [Fast-Paced Multiplayer (Gabriel Gambetta)](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Valve's Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)

---

## Getting Help

- **Check existing documentation** in `docs/` folder
- **Read the source code** - it's well-structured and < 3000 lines
- **Console.log everything** - add logging to understand flow
- **Test in isolation** - comment out code to isolate issues
- **Ask in team chat** or create a GitHub issue

---

**Happy coding!**
