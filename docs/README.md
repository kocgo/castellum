# Castellum Documentation

This folder contains comprehensive documentation for the Castellum project.

## Documentation Files

### For Players & Quick Start
- **[../README.md](../README.md)** - Main README with quick start instructions

### For Developers
- **[../DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** - Development workflow, folder structure, debugging tips

### Game Design
- **[game-design-doc.md](./game-design-doc.md)** - Complete game mechanics specification
  - Game rules, entity stats, wave scaling
  - Win/lose conditions, resource economy
  - Map layout, combat mechanics
  - Multiplayer synchronization rules

### Technical Architecture
- **[architecture.md](./architecture.md)** - Technical implementation details
  - Server-authoritative design
  - Network message types (client ↔ server)
  - Type definitions and constants
  - State synchronization strategy
  - Deployment architecture

### Implementation
- **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** - 12-phase task breakdown
  - Step-by-step implementation guide
  - Task verification steps
  - Originally created for AI-assisted development

## Reading Order

**If you're new to the project:**
1. Start with [../README.md](../README.md) - Get the game running
2. Read [game-design-doc.md](./game-design-doc.md) - Understand what you're building
3. Read [../DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) - Learn the codebase structure
4. Reference [architecture.md](./architecture.md) - Deep dive into technical details

**If you're implementing a feature:**
1. Check [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - See if it's already planned
2. Reference [game-design-doc.md](./game-design-doc.md) - Understand game mechanics
3. Reference [architecture.md](./architecture.md) - Find relevant types and constants
4. Use [../DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) - Follow best practices

---

**Document Status:** All docs current as of project review (65% implementation complete)
