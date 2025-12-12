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

  ENEMY_SPAWN_INTERVAL: 500, // ms between enemy spawns
} as const;

export interface WaveConfig {
  count: number;
  hpMult: number;
  speedMult: number;
}

export const WAVES: WaveConfig[] = [
  { count: 5, hpMult: 1.0, speedMult: 1.0 },
  { count: 8, hpMult: 1.0, speedMult: 1.0 },
  { count: 12, hpMult: 1.2, speedMult: 1.0 },
  { count: 15, hpMult: 1.2, speedMult: 1.1 },
  { count: 20, hpMult: 1.5, speedMult: 1.1 },
  { count: 25, hpMult: 1.5, speedMult: 1.2 },
  { count: 30, hpMult: 1.8, speedMult: 1.2 },
  { count: 35, hpMult: 2.0, speedMult: 1.3 },
  { count: 40, hpMult: 2.5, speedMult: 1.3 },
  { count: 50, hpMult: 3.0, speedMult: 1.5 },
];

// Player count scaling multiplier
export function getEnemyCountForWave(waveIndex: number, playerCount: number): number {
  const baseCount = WAVES[waveIndex]?.count ?? 5;
  return Math.floor(baseCount * (1 + (playerCount - 1) * 0.3));
}
