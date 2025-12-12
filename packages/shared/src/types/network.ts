import { Vector2, Player, Enemy, Tower, Loot, Projectile, Keep } from './entities';
import { GamePhase, Resources, SerializedGameState } from './game';

// ============ CLIENT → SERVER ============

export interface C2S_CreateGame {
  type: 'create_game';
  nickname: string;
}

export interface C2S_Join {
  type: 'join';
  gameId: string;
  nickname: string;
}

export interface C2S_Ready {
  type: 'ready';
  ready: boolean;
}

export interface C2S_Move {
  type: 'move';
  direction: Vector2;      // Normalized (-1 to 1)
  timestamp: number;
}

export interface C2S_Build {
  type: 'build';
  towerType: 'archer';
  gridX: number;
  gridY: number;
}

export interface C2S_Upgrade {
  type: 'upgrade';
  towerId: string;
}

export interface C2S_Sell {
  type: 'sell';
  towerId: string;
}

export interface C2S_Repair {
  type: 'repair';
  targetType: 'keep' | 'tower';
  targetId?: string;       // For tower
}

export interface C2S_Revive {
  type: 'revive';
  targetPlayerId: string;
}

export interface C2S_Chat {
  type: 'chat';
  message: string;
}

export interface C2S_VoteSkip {
  type: 'vote_skip';
}

export interface C2S_VotePause {
  type: 'vote_pause';
}

export type ClientMessage =
  | C2S_CreateGame
  | C2S_Join
  | C2S_Ready
  | C2S_Move
  | C2S_Build
  | C2S_Upgrade
  | C2S_Sell
  | C2S_Repair
  | C2S_Revive
  | C2S_Chat
  | C2S_VoteSkip
  | C2S_VotePause;

// ============ SERVER → CLIENT ============

export interface S2C_GameCreated {
  type: 'game_created';
  gameId: string;
  playerId: string;
}

export interface S2C_GameState {
  type: 'game_state';
  state: SerializedGameState;
  playerId: string;
}

export interface S2C_StateDelta {
  type: 'state_delta';
  timestamp: number;
  players?: Partial<Player>[];
  enemies?: Partial<Enemy>[];
  towers?: Partial<Tower>[];
  loot?: Partial<Loot>[];
  resources?: Partial<Resources>;
  keep?: Partial<Keep>;
}

export interface S2C_PhaseChange {
  type: 'phase_change';
  phase: GamePhase;
  wave?: number;
  timer?: number;
}

export interface S2C_PlayerJoined {
  type: 'player_joined';
  player: Player;
}

export interface S2C_PlayerLeft {
  type: 'player_left';
  playerId: string;
}

export interface S2C_PlayerReady {
  type: 'player_ready';
  playerId: string;
  ready: boolean;
}

export interface S2C_PlayerDied {
  type: 'player_died';
  playerId: string;
  position: Vector2;
}

export interface S2C_PlayerRevived {
  type: 'player_revived';
  playerId: string;
}

export interface S2C_EnemySpawned {
  type: 'enemy_spawned';
  enemy: Enemy;
}

export interface S2C_EnemyDied {
  type: 'enemy_died';
  enemyId: string;
  position: Vector2;
  loot: Loot[];
}

export interface S2C_TowerBuilt {
  type: 'tower_built';
  tower: Tower;
}

export interface S2C_TowerUpgraded {
  type: 'tower_upgraded';
  towerId: string;
  level: number;
}

export interface S2C_TowerSold {
  type: 'tower_sold';
  towerId: string;
  refund: Resources;
}

export interface S2C_TowerFired {
  type: 'tower_fired';
  towerId: string;
  targetId: string;
  projectile: Projectile;
}

export interface S2C_LootCollected {
  type: 'loot_collected';
  lootId: string;
  playerId: string;
}

export interface S2C_LootDespawned {
  type: 'loot_despawned';
  lootId: string;
}

export interface S2C_ResourcesUpdated {
  type: 'resources_updated';
  resources: Resources;
}

export interface S2C_Chat {
  type: 'chat';
  playerId: string;
  nickname: string;
  message: string;
}

export interface S2C_Error {
  type: 'error';
  code: string;
  message: string;
}

export type ServerMessage =
  | S2C_GameCreated
  | S2C_GameState
  | S2C_StateDelta
  | S2C_PhaseChange
  | S2C_PlayerJoined
  | S2C_PlayerLeft
  | S2C_PlayerReady
  | S2C_PlayerDied
  | S2C_PlayerRevived
  | S2C_EnemySpawned
  | S2C_EnemyDied
  | S2C_TowerBuilt
  | S2C_TowerUpgraded
  | S2C_TowerSold
  | S2C_TowerFired
  | S2C_LootCollected
  | S2C_LootDespawned
  | S2C_ResourcesUpdated
  | S2C_Chat
  | S2C_Error;
