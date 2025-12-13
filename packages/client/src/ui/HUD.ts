import Phaser from 'phaser';

interface GameState {
  wave: number;
  maxWaves: number;
  resources: {
    wood: number;
    gold: number;
  };
  keep: {
    hp: number;
    maxHp: number;
  };
  phase: string;
  phaseTimer: number;
}

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // UI Elements
  private waveText!: Phaser.GameObjects.Text;
  private resourceText!: Phaser.GameObjects.Text;
  private keepHpBar!: Phaser.GameObjects.Graphics;
  private keepHpText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private buildButton!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.createHUD();
  }

  private createHUD(): void {
    const width = this.scene.cameras.main.width;

    // Top bar background
    const topBar = this.scene.add.rectangle(0, 0, width, 50, 0x1a1a2e, 0.9);
    topBar.setOrigin(0, 0);
    this.container.add(topBar);

    // Wave counter (top left)
    this.waveText = this.scene.add
      .text(10, 10, 'Wave: 1/10', {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.container.add(this.waveText);

    // Resources (top center)
    this.resourceText = this.scene.add
      .text(width / 2, 10, 'Wood: 100  Gold: 100', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);
    this.container.add(this.resourceText);

    // Keep HP (top right)
    this.keepHpText = this.scene.add
      .text(width - 10, 10, 'Keep HP:', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(1, 0);
    this.container.add(this.keepHpText);

    // Keep HP Bar
    this.keepHpBar = this.scene.add.graphics();
    this.container.add(this.keepHpBar);

    // Phase indicator (below top bar)
    this.phaseText = this.scene.add
      .text(width / 2, 60, 'PREP PHASE', {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.container.add(this.phaseText);

    // Timer
    this.timerText = this.scene.add
      .text(width / 2, 90, '30', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);
    this.container.add(this.timerText);

    // Build button (bottom of screen - placeholder)
    this.buildButton = this.scene.add
      .text(10, this.scene.cameras.main.height - 40, '[B] Build', {
        fontSize: '16px',
        color: '#888888',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.container.add(this.buildButton);
  }

  update(state: Partial<GameState>): void {
    if (state.wave !== undefined && state.maxWaves !== undefined) {
      this.waveText.setText(`Wave: ${state.wave}/${state.maxWaves}`);
    }

    if (state.resources) {
      this.resourceText.setText(
        `Wood: ${state.resources.wood}  Gold: ${state.resources.gold}`
      );
    }

    if (state.keep) {
      this.updateKeepHpBar(state.keep.hp, state.keep.maxHp);
    }

    if (state.phase) {
      this.updatePhaseDisplay(state.phase);
    }

    if (state.phaseTimer !== undefined) {
      const seconds = Math.ceil(state.phaseTimer / 1000);
      this.timerText.setText(`${seconds}`);
    }
  }

  private updateKeepHpBar(hp: number, maxHp: number): void {
    this.keepHpBar.clear();

    const barWidth = 100;
    const barHeight = 8;
    const barX = this.scene.cameras.main.width - 10 - barWidth;
    const barY = 30;

    // Background (dark red)
    this.keepHpBar.fillStyle(0x660000, 1);
    this.keepHpBar.fillRect(barX, barY, barWidth, barHeight);

    // HP fill (green to red based on health)
    const hpPercent = hp / maxHp;
    const color = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffaa00 : 0xff0000;
    this.keepHpBar.fillStyle(color, 1);
    this.keepHpBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    this.keepHpBar.lineStyle(1, 0xffffff, 0.5);
    this.keepHpBar.strokeRect(barX, barY, barWidth, barHeight);

    // HP text
    this.keepHpText.setText(`Keep HP: ${hp}/${maxHp}`);
  }

  private updatePhaseDisplay(phase: string): void {
    switch (phase) {
      case 'prep':
        this.phaseText.setText('PREP PHASE');
        this.phaseText.setColor('#00ff00');
        this.timerText.setVisible(true);
        break;
      case 'wave':
        this.phaseText.setText('WAVE IN PROGRESS');
        this.phaseText.setColor('#ff0000');
        this.timerText.setVisible(false);
        break;
      case 'victory':
        this.phaseText.setText('VICTORY!');
        this.phaseText.setColor('#ffd700');
        this.timerText.setVisible(false);
        break;
      case 'gameover':
        this.phaseText.setText('GAME OVER');
        this.phaseText.setColor('#ff0000');
        this.timerText.setVisible(false);
        break;
      default:
        this.phaseText.setText('');
        this.timerText.setVisible(false);
    }
  }

  setBuildModeActive(active: boolean): void {
    if (active) {
      this.buildButton.setColor('#32cd32');
      this.buildButton.setText('[B] Build (ACTIVE - Click to place)');
    } else {
      this.buildButton.setColor('#888888');
      this.buildButton.setText('[B] Build');
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
