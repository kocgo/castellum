import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // No assets to load for MVP - using colored shapes
  }

  create(): void {
    // Transition to LobbyScene
    this.scene.start('LobbyScene');
  }
}
