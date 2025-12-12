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
