import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { LobbyScene } from './scenes/LobbyScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: COLORS.background,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, LobbyScene, GameScene],
  dom: {
    createContainer: true,
  },
};

new Phaser.Game(config);
