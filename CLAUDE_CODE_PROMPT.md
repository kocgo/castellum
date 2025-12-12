# CLAUDE CODE INSTRUCTIONS

## Project Overview

You are building **Castellum**, a multiplayer cooperative tower defense game. All design decisions and technical architecture have been documented. Your job is to implement it.

## Documentation Files

Before starting ANY task, read these files thoroughly:

1. `docs/game-design-doc.md` - Game mechanics, rules, balance, entities
2. `docs/architecture.md` - Technical stack, types, networking, project structure

These documents are the source of truth. Follow them exactly.

---

## Task List

Complete these tasks in order. After each task, verify it works before moving on.

### Phase 1: Project Setup

**Task 1.1 - Monorepo Structure**
```
Create the monorepo structure using npm workspaces:
- packages/client (Phaser 3 + TypeScript + Vite)
- packages/server (Node.js + Express + Socket.io + TypeScript)
- packages/shared (TypeScript, shared types and constants)

Set up tsconfig.json files with proper references between packages.
Root package.json should have scripts to run client and server.
```

**Task 1.2 - Shared Package**
```
Implement the shared package exactly as defined in architecture.md:
- src/types/entities.ts (Player, Enemy, Tower, Keep, Altar, Loot, Projectile)
- src/types/game.ts (GamePhase, Resources, GameState)
- src/types/network.ts (All client→server and server→client messages)
- src/constants/balance.ts (PLAYER, ENEMY, TOWER, KEEP, ALTAR, LOOT, RESOURCES)
- src/constants/game.ts (GAME, WAVES)
- src/constants/network.ts (NETWORK)
- src/utils/math.ts (distance, normalize, collision helpers)
- src/utils/ids.ts (generateId function)
```

### Phase 2: Basic Client

**Task 2.1 - Phaser Setup**
```
Set up Phaser 3 client with Vite:
- index.html
- src/main.ts (Phaser game config)
- src/config.ts (game settings)
- src/scenes/BootScene.ts (placeholder, just transitions to GameScene)
- src/scenes/GameScene.ts (empty scene with gray background)

Verify: Running `npm run dev` in client shows a gray 800x600 canvas.
```

**Task 2.2 - Map and Grid**
```
In GameScene:
- Render the map as a grid (32x32 tiles)
- Draw the Keep as a light gray rectangle in the center (96x96)
- Draw the Altar as a purple circle below the keep
- Add subtle grid lines or checkerboard pattern for visual clarity

Verify: Can see the keep and altar on the grid.
```

**Task 2.3 - Local Player Movement**
```
Add local player (no networking yet):
- Blue circle (24px)
- WASD or Arrow key movement
- Player cannot walk through keep or altar
- Player stays within map bounds

Verify: Can move the blue circle around with keyboard.
```

### Phase 3: Basic Server

**Task 3.1 - Server Setup**
```
Set up the server:
- Express app serving static files from client dist folder
- Socket.io attached to Express server
- Basic connection/disconnection logging
- Server runs on port 3000

Verify: Running server and opening localhost:3000 shows the Phaser game.
```

**Task 3.2 - Lobby Manager**
```
Implement LobbyManager:
- Create game (generates random 6-char game ID)
- Join game (by game ID and nickname)
- Store games in memory (Map<gameId, GameInstance>)
- Handle player join/leave events
- Broadcast player list to all players in game

Verify: Can create a game, get a game ID, join with another browser tab.
```

**Task 3.3 - Lobby Scene (Client)**
```
Add LobbyScene to client:
- "Create Game" button → creates game, shows game ID
- "Join Game" input + button → joins existing game
- Show list of connected players
- "Ready" button to toggle ready state
- Start countdown when all players ready (or 5 min max)

Verify: Two browser tabs can join same game and see each other's names.
```

### Phase 4: Player Sync

**Task 4.1 - Player Movement Sync**
```
Sync player movement:
- Client sends movement input to server
- Server validates and updates player position
- Server broadcasts positions to all clients (20 ticks/sec)
- Clients interpolate other players' positions
- Local player uses client prediction

Verify: Open two tabs, move in one, see movement in the other smoothly.
```

**Task 4.2 - Player Visuals**
```
Improve player rendering:
- Each player has a random color
- Show player nickname above their circle
- Add HP bar below player
- Dead players show as semi-transparent at altar

Verify: Players have different colors and visible names.
```

### Phase 5: Game Loop

**Task 5.1 - Phase Manager**
```
Implement game phases on server:
- Lobby phase (waiting for ready)
- Prep phase (20 sec, first round 30 sec)
- Wave phase (enemies spawning)
- Victory / GameOver phases

Broadcast phase changes to clients.
Client shows current phase and timer in HUD.

Verify: Game transitions from lobby → prep → wave automatically.
```

**Task 5.2 - Basic HUD**
```
Add HUD to GameScene:
- Top bar: Wave X/10, Resources (Wood: X, Gold: X), Keep HP bar
- Phase indicator and countdown timer
- Build button (non-functional for now)

Verify: HUD displays and updates with phase changes.
```

### Phase 6: Towers

**Task 6.1 - Tower Placement**
```
Implement tower building:
- Click on grid to open build menu
- "Build Archer Tower (50 wood)" button
- Server validates (resources, position)
- Tower appears on grid (green rectangle)
- Resources deducted

Verify: Can place towers on the grid, resources decrease.
```

**Task 6.2 - Tower Upgrades and Selling**
```
Add tower interaction:
- Click existing tower to select it
- Show upgrade button (if resources available)
- Show sell button (50% refund)
- Tower visually changes with level (darker green)

Verify: Can upgrade and sell towers.
```

### Phase 7: Enemies

**Task 7.1 - Enemy Spawning**
```
Implement WaveManager:
- Spawn enemies based on WAVES config
- Scale count with player count
- Spawn from random edge positions
- Trickle spawn (one every 0.5 sec)

Verify: Enemies appear at map edges during wave phase.
```

**Task 7.2 - Enemy Movement**
```
Enemy behavior:
- Move toward keep (simple straight-line pathfinding)
- Stop when reaching keep and attack it
- Keep takes damage, HP updates in HUD

Verify: Enemies walk to keep and damage it.
```

**Task 7.3 - Enemy vs Player**
```
Add player damage:
- Enemies damage players on contact
- Player HP decreases
- When HP reaches 0, player dies
- Dead player becomes ghost at altar

Verify: Walking into enemies hurts, can die.
```

### Phase 8: Combat

**Task 8.1 - Tower Targeting**
```
Towers target enemies:
- Find nearest enemy in range
- Set as current target
- Re-target if target dies or leaves range

Verify: Towers visually track nearby enemies (rotation or indicator).
```

**Task 8.2 - Tower Shooting**
```
Towers fire projectiles:
- Server calculates hits, sends tower_fired event
- Client shows arrow animation (white line)
- Enemy takes damage
- Enemy dies when HP reaches 0

Verify: Towers shoot and kill enemies.
```

**Task 8.3 - Loot Drops**
```
Enemies drop loot on death:
- Gold (yellow circle) and Wood (brown circle)
- Loot stays on ground for 15 seconds
- Players collect by walking over
- Resources add to shared pool

Verify: Killing enemies drops loot, can pick it up.
```

### Phase 9: Death and Revival

**Task 9.1 - Player Revival**
```
Implement altar revival:
- Dead players shown as ghosts at altar
- Living player walks to altar, clicks to revive
- Costs 50 gold
- Revived player spawns at altar with full HP

Verify: Can revive dead players at altar for gold.
```

**Task 9.2 - Auto Revive**
```
At start of each prep phase:
- All dead players automatically revive for free
- Spawn at altar with full HP

Verify: Dead players come back when wave ends.
```

### Phase 10: Win/Lose

**Task 10.1 - Victory Condition**
```
After wave 10 completes:
- Transition to victory phase
- Show VictoryScene with "You Win!" message
- Option to return to lobby

Verify: Surviving 10 waves shows victory screen.
```

**Task 10.2 - Game Over Condition**
```
When keep HP reaches 0:
- Transition to gameover phase
- Show GameOverScene with "Game Over" message
- Show which wave reached
- Option to return to lobby

Verify: Keep dying shows game over screen.
```

### Phase 11: Chat

**Task 11.1 - Chat System**
```
Implement Ultima Online style chat:
- Press Enter to open chat input
- Type message, press Enter to send
- Message appears above player's head
- Fades after 5 seconds
- Max 100 characters

Verify: Can chat, messages appear above characters.
```

### Phase 12: Polish

**Task 12.1 - Vote Skip**
```
During prep phase:
- Add "Vote Skip" button
- Track votes on server
- If all players vote, skip to wave immediately

Verify: All players voting skip ends prep early.
```

**Task 12.2 - Reconnection**
```
Handle disconnection:
- Player disconnects → mark as disconnected
- Character stays in game
- Same nickname can reconnect and resume control

Verify: Closing tab and rejoining with same name works.
```

**Task 12.3 - Keep Repair**
```
Allow keep repair:
- Button or click on keep
- Costs 10 gold per 5 HP
- Only during prep phase

Verify: Can repair keep between waves.
```

---

## Running the Game

After implementation:

```bash
# Terminal 1 - Start server
cd packages/server
npm run dev
# Shows: http://localhost:3000 and http://192.168.X.X:3000

# Others in office open the network URL
# One person creates game, shares link
# Others join via link
```

---

## Important Notes

1. **Always read the docs first** - They contain exact types, constants, and message formats
2. **Test after each task** - Don't move on until current task works
3. **Use placeholder graphics** - Colored shapes only, no sprites
4. **Server is authoritative** - All game logic on server, client just renders
5. **Keep it simple** - Don't over-engineer, this is an office LAN game

---

## If You Get Stuck

- Re-read the relevant section of architecture.md
- Check that shared types are being used correctly
- Verify WebSocket messages match the defined types
- Check browser console and server logs for errors
