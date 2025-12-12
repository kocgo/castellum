export const NETWORK = {
  TICK_RATE: 20,             // Server ticks per second
  TICK_MS: 50,               // 1000 / 20
  CLIENT_SEND_RATE: 15,      // Client input sends per second
  INTERPOLATION_BUFFER: 100, // ms of buffer for smoothing
  SERVER_PORT: 3000,
} as const;
