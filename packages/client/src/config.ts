import { GAME } from '@castellum/shared';

export const GAME_CONFIG = {
  width: GAME.MAP_WIDTH,
  height: GAME.MAP_HEIGHT,
  tileSize: GAME.TILE_SIZE,
  gridWidth: GAME.GRID_WIDTH,
  gridHeight: GAME.GRID_HEIGHT,
} as const;

export const COLORS = {
  background: 0x2d5a27,      // Grass green
  grid: 0x3d6a37,            // Slightly darker green for grid
  keep: 0xaaaaaa,            // Light gray
  altar: 0x9932cc,           // Purple
  player: 0x4169e1,          // Royal blue (default)
  enemy: 0xcc3333,           // Red
  towerLevel1: 0x32cd32,     // Lime green
  towerLevel2: 0x228b22,     // Forest green
  towerLevel3: 0x006400,     // Dark green
  gold: 0xffd700,            // Gold
  wood: 0x8b4513,            // Saddle brown
  projectile: 0xffffff,      // White
  healthBarBg: 0x333333,     // Dark gray
  healthBarFill: 0x00ff00,   // Green
  healthBarLow: 0xff0000,    // Red
} as const;

export const SERVER_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3000';
