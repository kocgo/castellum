import { Player, Enemy, Tower, Keep, Altar, Loot, Projectile } from './entities';

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

// Serialized version for network transmission
export interface SerializedGameState {
  id: string;
  phase: GamePhase;
  wave: number;
  maxWaves: number;
  phaseTimer: number;
  resources: Resources;
  players: Player[];
  enemies: Enemy[];
  towers: Tower[];
  loot: Loot[];
  projectiles: Projectile[];
  keep: Keep;
  altar: Altar;
  skipVotes: string[];
  pauseVotes: string[];
}
