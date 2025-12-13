# Castellum

> A multiplayer cooperative tower defense game for your office LAN

**Castellum** is a browser-based tower defense survival game where 1-10 players work together to defend a Roman keep against 10 waves of barbarian invaders. Built with Phaser 3, Node.js, and Socket.io.

## Game Overview

- **Genre:** Cooperative Tower Defense / Survival
- **Players:** 1-10 (cooperative multiplayer)
- **Platform:** Browser (desktop)
- **Theme:** Roman/Caesar III inspired
- **Win Condition:** Survive 10 waves
- **Lose Condition:** Keep HP reaches 0

### Core Gameplay

Players defend a central keep by:
- **Building archer towers** to attack enemies
- **Collecting loot** dropped by defeated enemies (risky but necessary)
- **Managing shared resources** (gold and wood)
- **Reviving fallen teammates** at the altar
- **Working together** - all players share the same resource pool

The challenge escalates as enemy waves grow stronger, faster, and more numerous.

---

## Quick Start

### Prerequisites

- **Node.js 20+** installed
- A modern browser (Chrome, Firefox, Edge)
- Same local network if playing with others

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd castellum

# Install dependencies
npm install
```

### Running the Game

**Development Mode (Recommended):**

```bash
npm run dev
```

This starts both the server and client in a single terminal with color-coded output:
- **Server** (blue) runs on `http://localhost:3000` (game server + WebSocket)
- **Client** (green) runs on `http://localhost:5173` and network (Vite dev server with hot-reload)

⚠️ **Important:** Open `http://localhost:5173` in your browser (NOT 3000)

The client terminal will show your network URL for sharing with others on your LAN:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XXX:5173/
```

**Alternative - Separate Terminals:**

If you prefer separate terminals:

```bash
# Terminal 1 - Server only
npm run dev:server

# Terminal 2 - Client only
npm run dev:client
```

Then open `http://localhost:5173` in your browser.

### How to Play

1. **Open your browser** to `http://localhost:5173` (Vite dev server)

2. **Create a new game** - You'll get a game ID like `ABC123`

3. **Share the game link** with friends on your network:
   ```
   http://192.168.1.XXX:5173/game/ABC123
   ```

   (Use the network URL shown in the client terminal output)

4. **Everyone clicks "Ready"** in the lobby

5. **Game starts!**
   - **Prep Phase (20-30 sec):** Build towers, plan defenses
   - **Wave Phase:** Enemies attack! Collect loot, stay alive
   - **Repeat** until wave 10 or the keep falls

---

## Production Mode

For production deployment (single server, no Vite):

```bash
# Build all packages (client, server, shared)
npm run build

# Start production server (serves built client from dist/)
npm start
```

In production mode:
- Server runs on `http://localhost:3000`
- Server serves the built client files (no separate Vite server)
- Open `http://localhost:3000` or `http://192.168.1.XXX:3000`

---

## Project Structure

```
castellum/
├── package.json              # Root workspace configuration
├── tsconfig.json             # TypeScript configuration
├── packages/
│   ├── client/               # Phaser 3 game client
│   │   ├── src/
│   │   │   ├── scenes/       # Game scenes (Lobby, Game, etc.)
│   │   │   ├── network/      # Socket.io client & state sync
│   │   │   └── ui/           # HUD, menus, UI components
│   │   ├── index.html
│   │   └── vite.config.ts    # Vite build configuration
│   ├── server/               # Node.js game server
│   │   └── src/
│   │       ├── index.ts      # Entry point, Express + Socket.io
│   │       ├── lobby/        # Game creation & player management
│   │       └── game/         # Game loop, phases, combat
│   └── shared/               # Shared TypeScript types & constants
│       └── src/
│           ├── types/        # Entity and network message types
│           ├── constants/    # Game balance values
│           └── utils/        # Math helpers, collision detection
└── docs/                     # Documentation
    ├── game-design-doc.md    # Complete game mechanics spec
    └── architecture.md       # Technical architecture details
```

For detailed documentation, see:
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development workflow and folder structure
- [docs/game-design-doc.md](./game-design-doc.md) - Game rules and mechanics
- [docs/architecture.md](./architecture.md) - Technical architecture

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Client Engine** | Phaser 3 | 2D game rendering and physics |
| **Client Build** | Vite | Fast development and production builds |
| **Server** | Node.js + Express | HTTP server and static file serving |
| **Networking** | Socket.io | Real-time WebSocket communication |
| **Language** | TypeScript | Type-safe development across all packages |
| **Monorepo** | npm workspaces | Shared code between client and server |

---

## Game Controls

| Action | Input |
|--------|-------|
| Move | WASD or Arrow Keys |
| Build Tower | Click on empty grid tile |
| Upgrade/Sell Tower | Click on existing tower |
| Chat | Enter → Type → Enter |
| Vote Skip (Prep) | Button in UI |

---

## Firewall Note

If other players on your network can't connect, you may need to allow network access:

**Windows:**
1. Open Windows Defender Firewall
2. Allow Node.js through the firewall
3. Create inbound rules for ports 3000 (game server) and 5173 (Vite dev server)

**Mac/Linux:**
```bash
# Usually not an issue, but check firewall settings if needed
sudo ufw allow 3000   # Game server (Ubuntu/Debian)
sudo ufw allow 5173   # Vite dev server
```

**Note:** In development mode, both ports need to be accessible. In production mode (`npm start`), only port 3000 is needed.

---

## Development

```bash
# Install dependencies
npm install

# Run client in development mode (with hot reload)
npm run dev:client

# Run server in development mode (with auto-restart)
npm run dev:server

# Build all packages
npm run build

# Build individual packages
npm run build:shared
npm run build:client
npm run build:server
```

---

## Current Status

**Implementation Progress: ~65%**

✅ **Completed:**
- Monorepo structure with shared types
- Multiplayer lobby system
- Player movement and synchronization
- Tower building, upgrading, and selling
- Enemy spawning with wave scaling
- Phase management (Lobby → Prep → Wave)
- HUD and basic UI

⚠️ **In Progress:**
- Combat system (projectiles, damage)
- Player death and revival
- Victory/Game Over screens
- Chat system

See [docs/IMPLEMENTATION_ROADMAP.md](./docs/IMPLEMENTATION_ROADMAP.md) for the full implementation roadmap.

---

## Contributing

This is a personal/office project. Feel free to fork and customize!

---

## License

MIT (or your preferred license)

---

## Troubleshooting

**Problem:** "ENOENT: no such file or directory" or blank page at `:3000`
- **Solution:** You're accessing the wrong port. In development mode, use `http://localhost:5173` (Vite dev server), NOT `:3000`

**Problem:** Server won't start
- **Solution:** Port 3000 is in use. Check with `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows), then kill the process

**Problem:** Client won't start
- **Solution:** Port 5173 is in use. Kill the process or change the port in `packages/client/vite.config.ts`

**Problem:** "Cannot connect to server" or WebSocket errors
- **Solution:** Make sure BOTH server AND client are running (`npm run dev`). The client needs the server's WebSocket connection.

**Problem:** Other players can't connect
- **Solution:** Share the **Network URL from the Vite output** (e.g., `http://192.168.1.XXX:5173`), and ensure firewall allows connections on ports 3000 and 5173

**Problem:** Game is laggy
- **Solution:** This is a LAN game optimized for low-latency local networks. Internet play may be laggy.

**Problem:** Build fails
- **Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Problem:** Changes not showing up
- **Solution:** If using `npm run dev`, both servers auto-reload. If using production mode, run `npm run build` after each change.

---

**Have fun defending the keep!**
