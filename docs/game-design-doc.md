# Castellum - Tower Defense Survival

> Working title. Roman theme, cooperative survival.

---

## Overview

| Attribute | Value |
|-----------|-------|
| Genre | Tower Defense / Survival / Co-op |
| Platform | Browser (desktop first) |
| Engine | Phaser 3 + TypeScript |
| Players | 1-10 (full co-op) |
| Perspective | Top-down |
| Art Style | Caesar 3 inspired (Roman/ancient) |
| MVP Art | Colored shapes (placeholders) |

---

## Core Fantasy

> You and your friends defend a Roman keep against waves of barbarians. Venture out to collect resources, but stay too long and you die. Work together or fall together.

---

## Win / Lose Conditions

| Condition | Trigger |
|-----------|---------|
| **WIN** | Survive 10 waves |
| **LOSE** | Keep HP reaches 0 |

---

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         LOBBY                               │
│  - Players join via shared link                             │
│  - 5 minute countdown (or all players ready)                │
│  - Players see each other, can chat                         │
│  - Observers can spectate                                   │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      PREP PHASE                             │
│  - Duration: 20 seconds (first round: 30 seconds)           │
│  - Players can: build, upgrade, repair, move, chat          │
│  - Players can vote to skip remaining time                  │
│  - No enemies                                               │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      WAVE PHASE                             │
│  - Enemies spawn from map edges                             │
│  - Towers shoot (including friendly fire!)                  │
│  - Enemies drop loot on death                               │
│  - Players collect loot (risky!)                            │
│  - Wave ends when all enemies are dead                      │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
                   ┌──────┴──────┐
                   │ Keep HP > 0? │
                   └──────┬──────┘
                    No    │    Yes
                    ▼     │     ▼
               GAME OVER  │  Wave++
                          │     │
                          │  ┌──┴──┐
                          │  │ <10? │
                          │  └──┬──┘
                          │ Yes │  No
                          │  ▼  │   ▼
                          └►PREP│ VICTORY
                           PHASE│ SCREEN
```

---

## Lobby System

| Feature | Behavior |
|---------|----------|
| Join method | Shareable URL (e.g., `game.com/join/abc123`) |
| Lobby timer | 5 minutes max, or starts when all ready |
| Ready system | Players click ready, unready anytime |
| Late join | Allowed during lobby only |
| Mid-wave join | Not allowed, become observer |
| Observer → Player | Can join at start of next round |
| Host leaves | Game ends for everyone |

---

## Player Character

| Attribute | Value |
|-----------|-------|
| Health | 100 HP |
| Speed | Faster than enemies (1.5x) |
| Attack | None (cannot fight) |
| Collision | Solid (blocks other players, not enemies) |
| Identification | Nickname + random color |

### Player Death

| Event | Behavior |
|-------|----------|
| Death trigger | HP reaches 0 |
| On death | Become ghost at altar, await revival |
| Dead state | Spectate from altar, cannot move or act |
| Revival | Another player interacts with altar + pays gold |
| Revival cost | 50 gold per revival |
| Respawn location | At the altar |
| All players dead | Wave continues, towers still shoot |
| Auto-revive | All dead players revive free at next prep phase |

### Player Actions

| Action | Input | Notes |
|--------|-------|-------|
| Move | WASD or Arrow keys | 8-directional |
| Build | Click on valid ground | Opens build menu |
| Upgrade/Repair | Click on owned structure | If resources available |
| Collect loot | Walk over it | Auto-pickup |
| Chat | Enter → type → Enter | Appears above head |
| Vote skip | Button or /skip | Skip prep phase |
| Vote pause | Button or /pause | Pause between waves |

---

## Resources

| Resource | Icon (placeholder) | Used for |
|----------|-------------------|----------|
| Gold | Yellow circle | Upgrades, repairs, revival |
| Wood | Brown circle | Building towers |

### Resource Rules

| Rule | Value |
|------|-------|
| Pool | Shared (team-wide) |
| Starting resources | 100 wood, 100 gold |
| Loot source | Enemy drops only |
| Loot despawn | 15 seconds |
| Collection | Walk over (instant) |

---

## Enemies

### MVP Enemy: Barbarian

| Attribute | Value |
|-----------|-------|
| Appearance | Red rectangle (placeholder) |
| HP | 3 |
| Speed | Base 1.0 |
| Damage | 1 (to keep), 1 (to players) |
| Attack rate | 1 per second |
| Behavior | Walk toward keep, attack it |
| Player aggro | Attacks players if touched/blocked |
| Pathfinding | Simple (straight line to keep, avoids obstacles) |
| Loot drop | 5-10 gold, 3-5 wood |

### Wave Scaling

| Wave | Enemy Count | HP Multiplier | Speed Multiplier |
|------|-------------|---------------|------------------|
| 1 | 5 | 1.0x | 1.0x |
| 2 | 8 | 1.0x | 1.0x |
| 3 | 12 | 1.2x | 1.0x |
| 4 | 15 | 1.2x | 1.1x |
| 5 | 20 | 1.5x | 1.1x |
| 6 | 25 | 1.5x | 1.2x |
| 7 | 30 | 1.8x | 1.2x |
| 8 | 35 | 2.0x | 1.3x |
| 9 | 40 | 2.5x | 1.3x |
| 10 | 50 | 3.0x | 1.5x |

### Player Count Scaling

```
Enemy count = Base count × (1 + (player_count - 1) × 0.3)

Example: Wave 5 with 4 players
20 × (1 + 3 × 0.3) = 20 × 1.9 = 38 enemies
```

### Spawn Behavior

| Setting | Value |
|---------|-------|
| Spawn location | Random points on map edges (all 4 sides) |
| Spawn pattern | Trickle (1 enemy per 0.5 seconds) |
| Wave end | All enemies dead |

---

## Structures

### Archer Tower

| Attribute | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Build cost | 50 wood | - | - |
| Upgrade cost | - | 30 gold | 60 gold |
| HP | 20 | 25 | 30 |
| Damage | 1 | 2 | 3 |
| Fire rate | 1/sec | 1.5/sec | 2/sec |
| Range | 150px | 175px | 200px |
| Targets | Nearest enemy | ← | ← |

### Altar (Pre-placed)

| Attribute | Value |
|-----------|-------|
| Position | Next to keep |
| Interaction | Click while near to revive dead player |
| Revival cost | 50 gold |
| Behavior | Shows ghost of dead players waiting for revival |

### Keep (Pre-placed)

| Attribute | Value |
|-----------|-------|
| HP | 100 |
| Repair cost | 10 gold per 5 HP |
| Position | Center of map |
| Size | 3x3 grid tiles |

### Building Rules

| Rule | Value |
|------|-------|
| Placement | Grid-based (32x32 tiles) |
| Build zones | Anywhere except keep, altar, spawn edges |
| Sell/remove | Yes, 50% resource refund |
| Who can build | Any player |
| Who can upgrade | Any player |
| Destruction | Enemies attack towers in their path |

---

## Combat

### Targeting Priority (Towers)

```
1. Nearest enemy in range
```

### Damage Calculation

```
Simple: Damage = Attack value (no armor, no crits for MVP)
```

### Projectiles

| Type | Speed | Behavior |
|------|-------|----------|
| Arrow | Fast (500px/sec) | Travels to target, hits first thing in path |

---

## Map

| Attribute | Value |
|-----------|-------|
| Size | 800 x 600 pixels (single screen, no scroll) |
| Grid | 25 x 19 tiles (32px each) |
| Keep position | Center |
| Terrain | Grass (buildable), path (visual only) |
| Spawn zones | 4 edges, enemies spawn outside visible area |

### Layout (ASCII)

```
S = Spawn zone (off-screen)
K = Keep
A = Altar
. = Buildable grass

    SSSSSSSSSSSSSSSSSSSSSSSS
   ┌────────────────────────┐
 S │........................│ S
 S │........................│ S
 S │........................│ S
 S │.........┌───┐..........│ S
 S │.........│ K │..........│ S
 S │.........└───┘..........│ S
 S │...........(A)..........│ S
 S │........................│ S
 S │........................│ S
   └────────────────────────┘
    SSSSSSSSSSSSSSSSSSSSSSSS
```

---

## Chat System

| Feature | Behavior |
|---------|----------|
| Input | Press Enter → type → press Enter |
| Display | Text appears above character |
| Duration | 5 seconds, then fades |
| Max length | 100 characters |
| Profanity filter | None for MVP |
| Observers | Can read, cannot send |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Wave: 3/10              Wood: 150   Gold: 200              │
│                                          Keep HP: ████████░ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                         GAME AREA                           │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Build Tower 50w] [Repair Keep 10g]                         │
│                                              [Vote Skip]    │
└─────────────────────────────────────────────────────────────┘

Selected structure shows: [Upgrade 30g] [Sell 50%] [Repair]
```

---

## Multiplayer Architecture

| Aspect | Decision |
|--------|----------|
| Authority | Server authoritative |
| Protocol | WebSocket (Socket.io) |
| Tick rate | 20 ticks/second (50ms) |
| Client prediction | Player movement only |
| Interpolation | Enemy/other player positions |

### What Syncs

| Data | Sync method |
|------|-------------|
| Player positions | Every tick |
| Player HP/death | On change |
| Enemy spawns | Server broadcasts spawn event |
| Enemy positions | Every tick |
| Enemy deaths | On change |
| Tower builds | On change |
| Tower upgrades | On change |
| Resource count | On change |
| Game phase | On change |
| Chat messages | On send |

### What Doesn't Sync (Client-side only)

| Data | Reason |
|------|--------|
| Arrow animations | Visual only, server just says "hit" |
| Damage numbers | Visual only |
| Sound effects | Local |
| UI state | Local |

---

## Placeholder Visuals (MVP)

| Entity | Shape | Color | Size |
|--------|-------|-------|------|
| Player | Circle | Random (per player) | 24px |
| Player (dead) | Circle | Semi-transparent | 24px |
| Barbarian | Rectangle | Red | 20x20px |
| Archer Tower L1 | Rectangle | Green | 32x32px |
| Archer Tower L2 | Rectangle | Darker green | 32x32px |
| Archer Tower L3 | Rectangle | Dark green | 32x32px |
| Keep | Rectangle | Light gray | 96x96px |
| Altar | Circle | Purple | 40px |
| Arrow | Line | White | 10px |
| Gold loot | Circle | Yellow | 10px |
| Wood loot | Circle | Brown | 10px |
| Health bar (back) | Rectangle | Dark red | 32x4px |
| Health bar (fill) | Rectangle | Bright red | Variable |

---

## Audio (MVP)

None. Add later.

---

## Technical Stack

| Component | Choice |
|-----------|--------|
| Client engine | Phaser 3 |
| Language | TypeScript |
| Build tool | Vite |
| Server | Node.js + Express |
| WebSocket | Socket.io |
| Hosting | TBD (Fly.io, Railway, or similar) |
| State management | Simple objects (no Redux) |

---

## File Structure (Suggested)

```
/client
  /src
    /scenes
      BootScene.ts
      LobbyScene.ts
      GameScene.ts
      VictoryScene.ts
      GameOverScene.ts
    /entities
      Player.ts
      Enemy.ts
      Tower.ts
      Wall.ts
      Keep.ts
      Loot.ts
    /systems
      InputSystem.ts
      BuildingSystem.ts
      CombatSystem.ts
    /network
      SocketClient.ts
      SyncManager.ts
    /ui
      HUD.ts
      BuildMenu.ts
      ChatBox.ts
    main.ts
    config.ts
  index.html
  
/server
  /src
    /game
      GameState.ts
      WaveManager.ts
      CombatManager.ts
      LootManager.ts
    /network
      SocketServer.ts
      LobbyManager.ts
    /entities
      Player.ts
      Enemy.ts
      Tower.ts
    index.ts
    config.ts
    
/shared
  /types
    GameTypes.ts
    NetworkMessages.ts
  /constants
    Balance.ts
```

---

## MVP Checklist

### Phase 1: Foundation
- [ ] Phaser project setup
- [ ] Basic scene structure
- [ ] Player movement (local)
- [ ] Grid system
- [ ] Placeholder graphics

### Phase 2: Core Gameplay (Single Player)
- [ ] Keep with HP
- [ ] Tower placement
- [ ] Tower shooting
- [ ] Enemy spawning
- [ ] Enemy pathfinding
- [ ] Enemy attacks keep
- [ ] Wave system
- [ ] Win/lose conditions

### Phase 3: Economy
- [ ] Resource display
- [ ] Loot drops
- [ ] Loot collection
- [ ] Build costs
- [ ] Upgrade costs

### Phase 4: Multiplayer
- [ ] Socket.io setup
- [ ] Lobby system
- [ ] Player sync
- [ ] Enemy sync
- [ ] Resource sync
- [ ] Building sync
- [ ] Chat system

### Phase 5: Polish
- [ ] Player death/respawn
- [ ] Structure HP/repair
- [ ] Friendly fire
- [ ] Vote skip/pause
- [ ] Observer mode
- [ ] Reconnection

### Phase 6: Juice
- [ ] Real art assets
- [ ] Sound effects
- [ ] Music
- [ ] Particle effects
- [ ] Screen shake

---

## Out of Scope (Post-MVP)

- Walls (buildable defense structures)
- Friendly fire from towers
- Multiple enemy types
- Multiple tower types
- Player abilities/classes
- Persistent progression
- Leaderboards
- More than 10 waves
- Endless mode
- Multiple maps
- Mobile support

---

## Open Questions

1. Should walls block player movement when added later?
2. Should there be a mini-map or is single-screen enough?
3. Should observers be able to ping/highlight things?
4. Should revival cost scale (more expensive each time)?

---

## Appendix: Balance Tuning Notes

These numbers are starting points. Playtest and adjust.

```
Expected game length: 15-20 minutes
Expected tower count by wave 10: 8-12 towers
Expected deaths per game: 2-5 (with revival)
Resource flow: Slightly tight (forces risk-taking for loot)
Revival cost: 50 gold (meaningful but not crippling)
```

---

*Document version: 1.0*
*Last updated: [Today]*
