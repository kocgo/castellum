import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../config';

export class NetworkManager extends Phaser.Events.EventEmitter {
  private socket: Socket | null = null;
  private static instance: NetworkManager;

  private constructor() {
    super();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Network] Connected to server');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[Network] Disconnected from server');
      this.emit('disconnected');
    });

    // Route all server messages to event emitter
    this.socket.onAny((event: string, data: unknown) => {
      console.log(`[Network] Received: ${event}`, data);
      this.emit(event, data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Game actions
  createGame(nickname: string): void {
    this.socket?.emit('create_game', { nickname });
  }

  joinGame(gameId: string, nickname: string): void {
    this.socket?.emit('join', { gameId, nickname });
  }

  setReady(ready: boolean): void {
    this.socket?.emit('ready', { ready });
  }

  sendMove(direction: { x: number; y: number }): void {
    this.socket?.emit('move', { direction, timestamp: Date.now() });
  }

  sendChat(message: string): void {
    this.socket?.emit('chat', { message });
  }

  voteSkip(): void {
    this.socket?.emit('vote_skip');
  }
}
