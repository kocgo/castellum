export const PLAYER = {
  MAX_HP: 100,
  SPEED: 200,           // pixels per second
  RADIUS: 12,           // collision radius
} as const;

export const ENEMY = {
  barbarian: {
    MAX_HP: 3,
    SPEED: 100,
    DAMAGE: 10,         // to player and keep
    ATTACK_RATE: 1000,  // ms between attacks
    RADIUS: 10,
    LOOT_GOLD_MIN: 5,
    LOOT_GOLD_MAX: 10,
    LOOT_WOOD_MIN: 3,
    LOOT_WOOD_MAX: 5,
  },
} as const;

export const TOWER = {
  archer: {
    COST_WOOD: 50,
    UPGRADE_COST_GOLD: [0, 30, 60] as const, // L1, L2, L3
    MAX_HP: [20, 25, 30] as const,
    DAMAGE: [1, 2, 3] as const,
    FIRE_RATE: [1000, 750, 500] as const,    // ms between shots
    RANGE: [150, 175, 200] as const,
    SELL_REFUND_PERCENT: 0.5,
  },
} as const;

export const KEEP = {
  MAX_HP: 100,
  REPAIR_COST_GOLD: 10,  // per 5 HP
  REPAIR_AMOUNT: 5,
  WIDTH: 96,
  HEIGHT: 96,
} as const;

export const ALTAR = {
  REVIVE_COST_GOLD: 50,
  RADIUS: 20,
} as const;

export const LOOT = {
  DESPAWN_TIME: 15000,   // ms
  PICKUP_RADIUS: 20,
} as const;

export const RESOURCES = {
  STARTING_GOLD: 100,
  STARTING_WOOD: 100,
} as const;
