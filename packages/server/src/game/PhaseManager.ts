import { GameInstance } from './GameInstance';

type GamePhase = 'lobby' | 'prep' | 'wave' | 'victory' | 'gameover';

const PREP_TIME_FIRST = 30 * 1000; // 30 seconds for first prep
const PREP_TIME = 20 * 1000; // 20 seconds for other preps

export class PhaseManager {
  constructor(private game: GameInstance) {}

  update(dt: number): void {
    if (this.game.phase === 'prep') {
      this.updatePrep(dt);
    } else if (this.game.phase === 'wave') {
      this.updateWave(dt);
    }
    // Lobby phase is handled by LobbyManager
    // Victory and gameover are end states
  }

  private updatePrep(dt: number): void {
    this.game.phaseTimer -= dt;

    if (this.game.phaseTimer <= 0) {
      this.startWavePhase();
    }
  }

  private updateWave(_dt: number): void {
    // Wave phase continues until all enemies are dead
    // This will be implemented in Phase 7 when we add enemies
    // For now, just check if we should end the wave manually
  }

  startWavePhase(): void {
    console.log(`[Phase] Starting wave ${this.game.wave}`);
    this.game.phase = 'wave';
    this.game.phaseTimer = 0;

    this.game.broadcast('phase_change', {
      type: 'phase_change',
      phase: 'wave',
      wave: this.game.wave,
    });
  }

  endWave(): void {
    console.log(`[Phase] Wave ${this.game.wave} completed`);

    // Check for victory
    if (this.game.wave >= 10) {
      this.startVictory();
      return;
    }

    // Start next prep phase
    this.game.wave++;
    this.startPrepPhase();
  }

  startPrepPhase(): void {
    console.log(`[Phase] Starting prep phase for wave ${this.game.wave}`);
    this.game.phase = 'prep';
    this.game.phaseTimer = this.game.wave === 1 ? PREP_TIME_FIRST : PREP_TIME;

    // Revive all dead players for free
    for (const player of this.game.getPlayers()) {
      if (!player.isAlive) {
        player.isAlive = true;
        player.hp = player.maxHp;
      }
    }

    this.game.broadcast('phase_change', {
      type: 'phase_change',
      phase: 'prep',
      wave: this.game.wave,
      timer: this.game.phaseTimer,
    });
  }

  startVictory(): void {
    console.log(`[Phase] Victory! Game ${this.game.id} completed`);
    this.game.phase = 'victory';

    this.game.broadcast('phase_change', {
      type: 'phase_change',
      phase: 'victory',
    });
  }

  gameOver(): void {
    console.log(`[Phase] Game Over! Game ${this.game.id} failed at wave ${this.game.wave}`);
    this.game.phase = 'gameover';

    this.game.broadcast('phase_change', {
      type: 'phase_change',
      phase: 'gameover',
      wave: this.game.wave,
    });
  }
}
