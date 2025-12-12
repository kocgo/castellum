import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager';

interface Player {
  id: string;
  nickname: string;
  color: string;
  isReady: boolean;
  isConnected: boolean;
}

interface GameState {
  id: string;
  players: Player[];
}

export class LobbyScene extends Phaser.Scene {
  private network!: NetworkManager;
  private gameId: string = '';
  private playerId: string = '';
  private isReady: boolean = false;
  private players: Player[] = [];

  // UI Elements
  private gameIdText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private playerListText!: Phaser.GameObjects.Text;
  private nicknameInput!: HTMLInputElement;
  private gameIdInput!: HTMLInputElement;
  private createBtn!: HTMLButtonElement;
  private joinBtn!: HTMLButtonElement;
  private readyBtn!: HTMLButtonElement;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    this.network = NetworkManager.getInstance();
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    this.add
      .text(400, 50, 'CASTELLUM', {
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(400, 100, 'Tower Defense Survival', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Status text
    this.statusText = this.add
      .text(400, 150, 'Connecting to server...', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Game ID display
    this.gameIdText = this.add
      .text(400, 200, '', {
        fontSize: '24px',
        color: '#00ff00',
      })
      .setOrigin(0.5);

    // Player list
    this.playerListText = this.add
      .text(400, 300, '', {
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    // Create HTML UI elements
    this.createHTMLUI();

    // Connect to server
    this.network.connect();

    // Setup network listeners
    this.setupNetworkListeners();
  }

  private createHTMLUI(): void {
    // Create container
    const container = document.createElement('div');
    container.id = 'lobby-ui';
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-family: 'Segoe UI', sans-serif;
    `;

    // Nickname input
    this.nicknameInput = document.createElement('input');
    this.nicknameInput.type = 'text';
    this.nicknameInput.placeholder = 'Enter nickname';
    this.nicknameInput.maxLength = 20;
    this.nicknameInput.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      border: 2px solid #4a4a6a;
      border-radius: 4px;
      background: #2a2a4a;
      color: white;
      outline: none;
    `;

    // Create Game button
    this.createBtn = document.createElement('button');
    this.createBtn.textContent = 'Create Game';
    this.createBtn.style.cssText = this.getButtonStyle('#4169e1');
    this.createBtn.onclick = () => this.handleCreateGame();

    // Separator
    const separator = document.createElement('div');
    separator.textContent = '— or join existing —';
    separator.style.cssText = 'color: #888; margin: 10px 0;';

    // Game ID input
    this.gameIdInput = document.createElement('input');
    this.gameIdInput.type = 'text';
    this.gameIdInput.placeholder = 'Enter Game ID';
    this.gameIdInput.maxLength = 6;
    this.gameIdInput.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      border: 2px solid #4a4a6a;
      border-radius: 4px;
      background: #2a2a4a;
      color: white;
      outline: none;
      text-transform: uppercase;
    `;

    // Join Game button
    this.joinBtn = document.createElement('button');
    this.joinBtn.textContent = 'Join Game';
    this.joinBtn.style.cssText = this.getButtonStyle('#32cd32');
    this.joinBtn.onclick = () => this.handleJoinGame();

    // Ready button (hidden initially)
    this.readyBtn = document.createElement('button');
    this.readyBtn.textContent = 'Ready';
    this.readyBtn.style.cssText = this.getButtonStyle('#ffa500');
    this.readyBtn.style.display = 'none';
    this.readyBtn.onclick = () => this.handleReady();

    container.appendChild(this.nicknameInput);
    container.appendChild(this.createBtn);
    container.appendChild(separator);
    container.appendChild(this.gameIdInput);
    container.appendChild(this.joinBtn);
    container.appendChild(this.readyBtn);

    document.body.appendChild(container);
  }

  private getButtonStyle(color: string): string {
    return `
      padding: 10px 30px;
      font-size: 16px;
      border: none;
      border-radius: 4px;
      background: ${color};
      color: white;
      cursor: pointer;
      transition: opacity 0.2s;
    `;
  }

  private setupNetworkListeners(): void {
    this.network.on('connected', () => {
      this.statusText.setText('Connected! Enter nickname to start.');
    });

    this.network.on('disconnected', () => {
      this.statusText.setText('Disconnected from server');
    });

    this.network.on('game_created', (data: { gameId: string; playerId: string }) => {
      this.gameId = data.gameId;
      this.playerId = data.playerId;
      this.gameIdText.setText(`Game ID: ${this.gameId}`);
      this.statusText.setText('Game created! Share the ID with friends.');
      this.showLobbyUI();
    });

    this.network.on('game_state', (data: { state: GameState; playerId: string }) => {
      this.gameId = data.state.id;
      this.playerId = data.playerId;
      this.players = data.state.players;
      this.gameIdText.setText(`Game ID: ${this.gameId}`);
      this.updatePlayerList();
      this.showLobbyUI();
    });

    this.network.on('player_joined', (data: { player: Player }) => {
      this.players.push(data.player);
      this.updatePlayerList();
    });

    this.network.on('player_left', (data: { playerId: string }) => {
      this.players = this.players.filter((p) => p.id !== data.playerId);
      this.updatePlayerList();
    });

    this.network.on('player_ready', (data: { playerId: string; ready: boolean }) => {
      const player = this.players.find((p) => p.id === data.playerId);
      if (player) {
        player.isReady = data.ready;
        this.updatePlayerList();
      }
    });

    this.network.on('phase_change', (data: { phase: string }) => {
      if (data.phase === 'prep' || data.phase === 'wave') {
        this.removeHTMLUI();
        this.scene.start('GameScene', { gameId: this.gameId, playerId: this.playerId });
      }
    });

    this.network.on('error', (data: { message: string }) => {
      this.statusText.setText(`Error: ${data.message}`);
    });
  }

  private handleCreateGame(): void {
    const nickname = this.nicknameInput.value.trim();
    if (!nickname) {
      this.statusText.setText('Please enter a nickname');
      return;
    }
    this.network.createGame(nickname);
    this.statusText.setText('Creating game...');
  }

  private handleJoinGame(): void {
    const nickname = this.nicknameInput.value.trim();
    const gameId = this.gameIdInput.value.trim().toUpperCase();

    if (!nickname) {
      this.statusText.setText('Please enter a nickname');
      return;
    }
    if (!gameId) {
      this.statusText.setText('Please enter a game ID');
      return;
    }

    this.network.joinGame(gameId, nickname);
    this.statusText.setText('Joining game...');
  }

  private handleReady(): void {
    this.isReady = !this.isReady;
    this.network.setReady(this.isReady);
    this.readyBtn.textContent = this.isReady ? 'Not Ready' : 'Ready';
    this.readyBtn.style.background = this.isReady ? '#cc3333' : '#ffa500';
  }

  private showLobbyUI(): void {
    this.nicknameInput.style.display = 'none';
    this.createBtn.style.display = 'none';
    this.gameIdInput.style.display = 'none';
    this.joinBtn.style.display = 'none';
    (document.querySelector('#lobby-ui div') as HTMLElement)?.style.setProperty('display', 'none');
    this.readyBtn.style.display = 'block';
  }

  private updatePlayerList(): void {
    const lines = this.players.map((p) => {
      const ready = p.isReady ? '[READY]' : '';
      const you = p.id === this.playerId ? '(You)' : '';
      return `${p.nickname} ${you} ${ready}`;
    });
    this.playerListText.setText(`Players:\n${lines.join('\n')}`);
  }

  private removeHTMLUI(): void {
    const container = document.getElementById('lobby-ui');
    if (container) {
      container.remove();
    }
  }

  shutdown(): void {
    this.removeHTMLUI();
    this.network.removeAllListeners();
  }
}
