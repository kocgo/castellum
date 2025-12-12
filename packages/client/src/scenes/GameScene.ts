import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';
import { NetworkManager } from '../network/NetworkManager';
import { HUD } from '../ui/HUD';

// Constants inline to avoid import issues
const KEEP_WIDTH = 96;
const KEEP_HEIGHT = 96;
const PLAYER_RADIUS = 12;
const PLAYER_SPEED = 200;
const ALTAR_RADIUS = 20;

interface Player {
  id: string;
  nickname: string;
  color: string;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

interface GameSceneData {
  gameId?: string;
  playerId?: string;
}

interface GameState {
  wave: number;
  maxWaves: number;
  phase: string;
  phaseTimer: number;
  resources: {
    wood: number;
    gold: number;
  };
  keep: {
    hp: number;
    maxHp: number;
  };
}

export class GameScene extends Phaser.Scene {
  // Network
  private network!: NetworkManager;
  private _gameId: string = '';
  private localPlayerId: string = '';

  // Structures
  private keepGraphics!: Phaser.GameObjects.Rectangle;
  private altarGraphics!: Phaser.GameObjects.Arc;

  // Players
  private localPlayerGraphics!: Phaser.GameObjects.Arc;
  private localPlayerHpBar!: Phaser.GameObjects.Graphics;
  private remotePlayers: Map<string, Phaser.GameObjects.Arc> = new Map();
  private remotePlayerHpBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private playerLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private players: Map<string, Player> = new Map();

  // Local player position
  private localPlayerX: number = 100;
  private localPlayerY: number = 100;

  // Keep and Altar positions
  private keepX!: number;
  private keepY!: number;
  private altarX!: number;
  private altarY!: number;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Movement tracking
  private lastMoveTime: number = 0;
  private moveInterval: number = 50; // Send move updates every 50ms

  // HUD
  private hud!: HUD;

  // Game state
  private gameState: Partial<GameState> = {
    wave: 1,
    maxWaves: 10,
    phase: 'prep',
    phaseTimer: 30000,
    resources: { wood: 100, gold: 100 },
    keep: { hp: 100, maxHp: 100 },
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this._gameId = data.gameId || '';
    this.localPlayerId = data.playerId || '';
  }

  create(): void {
    // Get network manager
    this.network = NetworkManager.getInstance();

    // Set background
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Calculate positions
    this.keepX = GAME_CONFIG.width / 2;
    this.keepY = GAME_CONFIG.height / 2 - 32;
    this.altarX = GAME_CONFIG.width / 2;
    this.altarY = GAME_CONFIG.height / 2 + 48;

    // Draw grid
    this.drawGrid();

    // Draw keep (center of map)
    this.drawKeep();

    // Draw altar (below keep)
    this.drawAltar();

    // Create local player
    this.createLocalPlayer();

    // Set up input
    this.setupInput();

    // Set up network listeners
    this.setupNetworkListeners();

    // Create HUD
    this.hud = new HUD(this);
    this.hud.update(this.gameState);
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, COLORS.grid, 0.3);

    // Draw vertical lines
    for (let x = 0; x <= GAME_CONFIG.width; x += GAME_CONFIG.tileSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, GAME_CONFIG.height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= GAME_CONFIG.height; y += GAME_CONFIG.tileSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_CONFIG.width, y);
    }

    graphics.strokePath();
  }

  private drawKeep(): void {
    this.keepGraphics = this.add.rectangle(
      this.keepX,
      this.keepY,
      KEEP_WIDTH,
      KEEP_HEIGHT,
      COLORS.keep
    );
    this.keepGraphics.setStrokeStyle(2, 0x888888);
  }

  private drawAltar(): void {
    this.altarGraphics = this.add.circle(this.altarX, this.altarY, ALTAR_RADIUS, COLORS.altar);
    this.altarGraphics.setStrokeStyle(2, 0x7b28a8);
  }

  private createLocalPlayer(): void {
    this.localPlayerGraphics = this.add.circle(
      this.localPlayerX,
      this.localPlayerY,
      PLAYER_RADIUS,
      COLORS.player
    );
    this.localPlayerGraphics.setStrokeStyle(2, 0x2c4c9a);
    this.localPlayerGraphics.setDepth(10);

    // Create HP bar
    this.localPlayerHpBar = this.add.graphics();
    this.localPlayerHpBar.setDepth(11);
    this.updateLocalPlayerHpBar();
  }

  private updateLocalPlayerHpBar(): void {
    this.localPlayerHpBar.clear();

    const barWidth = 32;
    const barHeight = 4;
    const barX = this.localPlayerX - barWidth / 2;
    const barY = this.localPlayerY + PLAYER_RADIUS + 5;

    // Background (dark red)
    this.localPlayerHpBar.fillStyle(0x660000, 1);
    this.localPlayerHpBar.fillRect(barX, barY, barWidth, barHeight);

    // HP fill (bright red)
    const hpPercent = 1.0; // 100% for now
    this.localPlayerHpBar.fillStyle(0xff0000, 1);
    this.localPlayerHpBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    this.localPlayerHpBar.lineStyle(1, 0xffffff, 0.5);
    this.localPlayerHpBar.strokeRect(barX, barY, barWidth, barHeight);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  private setupNetworkListeners(): void {
    // Handle game state (full state on join)
    this.network.on('game_state', (data: { state: GameState }) => {
      this.gameState = data.state;
      this.hud.update(this.gameState);
    });

    // Handle phase changes
    this.network.on(
      'phase_change',
      (data: { phase: string; wave?: number; timer?: number }) => {
        this.gameState.phase = data.phase;
        if (data.wave !== undefined) this.gameState.wave = data.wave;
        if (data.timer !== undefined) this.gameState.phaseTimer = data.timer;
        this.hud.update(this.gameState);
      }
    );

    // Handle state updates
    this.network.on('state_delta', (data: { players?: Partial<Player>[] }) => {
      if (data.players) {
        for (const playerData of data.players) {
          if (!playerData.id) continue;

          if (playerData.id === this.localPlayerId) {
            // Update local player from server (reconciliation)
            if (playerData.position) {
              this.localPlayerX = playerData.position.x;
              this.localPlayerY = playerData.position.y;
            }
          } else {
            // Update remote player
            this.updateRemotePlayer(playerData as Player);
          }
        }
      }
    });

    // Handle new player joining
    this.network.on('player_joined', (data: { player: Player }) => {
      if (data.player.id !== this.localPlayerId) {
        this.addRemotePlayer(data.player);
      }
    });

    // Handle player leaving
    this.network.on('player_left', (data: { playerId: string }) => {
      this.removeRemotePlayer(data.playerId);
    });
  }

  private addRemotePlayer(player: Player): void {
    if (this.remotePlayers.has(player.id)) return;

    const color = parseInt(player.color.replace('#', '0x'));
    const graphics = this.add.circle(player.position.x, player.position.y, PLAYER_RADIUS, color);
    graphics.setStrokeStyle(2, color - 0x222222);

    // Add name label
    const label = this.add
      .text(player.position.x, player.position.y - 25, player.nickname, {
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Add HP bar
    const hpBar = this.add.graphics();
    hpBar.setDepth(11);

    this.remotePlayers.set(player.id, graphics);
    this.remotePlayerHpBars.set(player.id, hpBar);
    this.playerLabels.set(player.id, label);
    this.players.set(player.id, player);

    this.updateRemotePlayerHpBar(player.id, player.position.x, player.position.y, 1.0);
  }

  private updateRemotePlayerHpBar(
    playerId: string,
    x: number,
    y: number,
    hpPercent: number
  ): void {
    const hpBar = this.remotePlayerHpBars.get(playerId);
    if (!hpBar) return;

    hpBar.clear();

    const barWidth = 32;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y + PLAYER_RADIUS + 5;

    // Background (dark red)
    hpBar.fillStyle(0x660000, 1);
    hpBar.fillRect(barX, barY, barWidth, barHeight);

    // HP fill (bright red)
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    hpBar.lineStyle(1, 0xffffff, 0.5);
    hpBar.strokeRect(barX, barY, barWidth, barHeight);
  }

  private updateRemotePlayer(player: Partial<Player> & { id: string }): void {
    const graphics = this.remotePlayers.get(player.id);
    const label = this.playerLabels.get(player.id);
    const existingPlayer = this.players.get(player.id);

    if (player.position) {
      if (graphics) {
        graphics.setPosition(player.position.x, player.position.y);
      }
      if (label) {
        label.setPosition(player.position.x, player.position.y - 25);
      }

      // Update HP bar position and value
      const hpPercent =
        player.hp !== undefined && player.maxHp !== undefined
          ? player.hp / player.maxHp
          : existingPlayer
            ? existingPlayer.hp / existingPlayer.maxHp
            : 1.0;

      this.updateRemotePlayerHpBar(player.id, player.position.x, player.position.y, hpPercent);
    }

    // Update stored player data
    if (existingPlayer) {
      Object.assign(existingPlayer, player);
    }
  }

  private removeRemotePlayer(playerId: string): void {
    const graphics = this.remotePlayers.get(playerId);
    const label = this.playerLabels.get(playerId);
    const hpBar = this.remotePlayerHpBars.get(playerId);

    if (graphics) {
      graphics.destroy();
      this.remotePlayers.delete(playerId);
    }
    if (label) {
      label.destroy();
      this.playerLabels.delete(playerId);
    }
    if (hpBar) {
      hpBar.destroy();
      this.remotePlayerHpBars.delete(playerId);
    }
    this.players.delete(playerId);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private circleRectCollide(
    circleX: number,
    circleY: number,
    circleRadius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    const closestX = this.clamp(circleX, rectX, rectX + rectWidth);
    const closestY = this.clamp(circleY, rectY, rectY + rectHeight);
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    return dx * dx + dy * dy < circleRadius * circleRadius;
  }

  private circlesCollide(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
  }

  private checkCollision(newX: number, newY: number): boolean {
    // Check collision with keep (rectangle)
    const keepLeft = this.keepX - KEEP_WIDTH / 2;
    const keepTop = this.keepY - KEEP_HEIGHT / 2;

    if (
      this.circleRectCollide(
        newX,
        newY,
        PLAYER_RADIUS,
        keepLeft,
        keepTop,
        KEEP_WIDTH,
        KEEP_HEIGHT
      )
    ) {
      return true;
    }

    // Check collision with altar (circle)
    if (this.circlesCollide(newX, newY, PLAYER_RADIUS, this.altarX, this.altarY, ALTAR_RADIUS)) {
      return true;
    }

    return false;
  }

  update(time: number, delta: number): void {
    if (!this.cursors || !this.wasd) return;

    // Update HUD
    if (this.gameState.phase === 'prep' && this.gameState.phaseTimer !== undefined) {
      // Client-side timer countdown for smooth display
      this.gameState.phaseTimer = Math.max(0, this.gameState.phaseTimer - delta);
      this.hud.update(this.gameState);
    }

    // Calculate movement direction
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    // Calculate new position (client prediction)
    const speed = PLAYER_SPEED * (delta / 1000);
    let newX = this.localPlayerX + dx * speed;
    let newY = this.localPlayerY + dy * speed;

    // Clamp to map bounds
    newX = this.clamp(newX, PLAYER_RADIUS, GAME_CONFIG.width - PLAYER_RADIUS);
    newY = this.clamp(newY, PLAYER_RADIUS, GAME_CONFIG.height - PLAYER_RADIUS);

    // Check collisions
    if (!this.checkCollision(newX, newY)) {
      this.localPlayerX = newX;
      this.localPlayerY = newY;
    } else {
      // Try sliding along walls
      if (!this.checkCollision(newX, this.localPlayerY)) {
        this.localPlayerX = newX;
      } else if (!this.checkCollision(this.localPlayerX, newY)) {
        this.localPlayerY = newY;
      }
    }

    // Update player graphics
    this.localPlayerGraphics.setPosition(this.localPlayerX, this.localPlayerY);

    // Update HP bar position
    this.updateLocalPlayerHpBar();

    // Send movement to server
    if (dx !== 0 || dy !== 0) {
      if (time - this.lastMoveTime > this.moveInterval) {
        this.network.sendMove({ x: dx, y: dy });
        this.lastMoveTime = time;
      }
    }
  }

  shutdown(): void {
    this.network.removeAllListeners();
    this.remotePlayers.forEach((g) => g.destroy());
    this.remotePlayerHpBars.forEach((h) => h.destroy());
    this.playerLabels.forEach((l) => l.destroy());
    this.remotePlayers.clear();
    this.remotePlayerHpBars.clear();
    this.playerLabels.clear();
    this.players.clear();

    if (this.hud) {
      this.hud.destroy();
    }
  }
}
