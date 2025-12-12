import os from 'os';

// Server configuration
// Note: Using inline constants to avoid module resolution issues with tsx
export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  tickRate: 20,
  tickMs: 50,
};

export function getNetworkAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        addresses.push(alias.address);
      }
    }
  }

  return addresses;
}
