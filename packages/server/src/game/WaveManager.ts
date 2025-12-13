import { GameInstance } from './GameInstance';
import { Enemy } from '@castellum/shared/types/entities';
import { ENEMY } from '@castellum/shared/constants/balance';
import { GAME, WAVES, getEnemyCountForWave } from '@castellum/shared/constants/game';

export class WaveManager {
  private enemiesToSpawn: number = 0;
  private spawnTimer: number = 0;
  private nextEnemyId: number = 0;

  constructor(private game: GameInstance) {}

  /**
   * Start spawning enemies for the current wave
   */
  startWave(): void {
    const waveIndex = this.game.wave - 1; // Wave 1 = index 0
    const playerCount = this.game.getConnectedPlayers().length;

    // Calculate enemy count based on wave and player count
    this.enemiesToSpawn = getEnemyCountForWave(waveIndex, playerCount);
    this.spawnTimer = 0;

    console.log(`[WaveManager] Starting wave ${this.game.wave} with ${this.enemiesToSpawn} enemies`);
  }

  /**
   * Update wave spawning logic
   */
  update(dt: number): void {
    if (this.enemiesToSpawn <= 0) {
      return;
    }

    this.spawnTimer += dt;

    // Spawn enemies at interval
    if (this.spawnTimer >= GAME.ENEMY_SPAWN_INTERVAL) {
      this.spawnEnemy();
      this.enemiesToSpawn--;
      this.spawnTimer = 0;
    }
  }

  /**
   * Spawn a single enemy at a random edge position
   */
  private spawnEnemy(): void {
    const waveIndex = this.game.wave - 1;
    const waveConfig = WAVES[waveIndex] || WAVES[0];

    // Get random spawn position from edges
    const spawnPos = this.getRandomEdgePosition();

    const enemy: Enemy = {
      id: `enemy_${this.nextEnemyId++}`,
      type: 'barbarian',
      position: spawnPos,
      hp: ENEMY.barbarian.MAX_HP * waveConfig.hpMult,
      maxHp: ENEMY.barbarian.MAX_HP * waveConfig.hpMult,
      speed: ENEMY.barbarian.SPEED * waveConfig.speedMult,
      damage: ENEMY.barbarian.DAMAGE,
      targetId: 'keep', // Always target the keep
    };

    this.game.addEnemy(enemy);

    // Broadcast enemy spawn
    this.game.broadcast('enemy_spawned', {
      type: 'enemy_spawned',
      enemy,
    });
  }

  /**
   * Get a random position on the map edges (outside visible area)
   */
  private getRandomEdgePosition(): { x: number; y: number } {
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const mapWidth = GAME.MAP_WIDTH;
    const mapHeight = GAME.MAP_HEIGHT;

    switch (edge) {
      case 0: // Top
        return { x: Math.random() * mapWidth, y: -20 };
      case 1: // Right
        return { x: mapWidth + 20, y: Math.random() * mapHeight };
      case 2: // Bottom
        return { x: Math.random() * mapWidth, y: mapHeight + 20 };
      case 3: // Left
        return { x: -20, y: Math.random() * mapHeight };
      default:
        return { x: mapWidth / 2, y: -20 };
    }
  }

  /**
   * Check if all enemies have been spawned and defeated
   */
  isWaveComplete(): boolean {
    return this.enemiesToSpawn === 0 && this.game.getEnemies().length === 0;
  }
}
