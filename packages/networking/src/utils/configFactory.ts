// configFactory.ts - Convert game constants to networking configurations
import type { GameNetworkingConstants } from '@/types/gameConstants';
import type { TelnetConfig, WebSocketConfig } from '@/types/config';

/**
 * Creates a TelnetConfig from game-specific constants
 */
export function createTelnetConfig(gameConstants: GameNetworkingConstants): TelnetConfig {
  return {
    port: gameConstants.defaultPort,
    idleTimeoutMs: gameConstants.idleTimeoutMs,
    maxConnections: gameConstants.maxConnections,
    maxConnectionsPerIP: gameConstants.maxConnectionsPerIP
  };
}

/**
 * Creates a WebSocketConfig from game-specific constants
 */
export function createWebSocketConfig(
  gameConstants: GameNetworkingConstants,
  options?: { path?: string; cors?: boolean }
): WebSocketConfig {
  return {
    port: gameConstants.defaultPort,
    idleTimeoutMs: gameConstants.idleTimeoutMs,
    maxConnections: gameConstants.maxConnections,
    maxConnectionsPerIP: gameConstants.maxConnectionsPerIP,
    path: options?.path || '/ws',
    cors: options?.cors || false
  };
}

/**
 * Validates that game constants are within reasonable limits
 */
export function validateGameConstants(constants: GameNetworkingConstants): void {
  const errors: string[] = [];

  if (constants.maxConnections <= 0 || constants.maxConnections > 10000) {
    errors.push(`maxConnections must be between 1 and 10000, got ${constants.maxConnections}`);
  }

  if (constants.maxConnectionsPerIP <= 0 || constants.maxConnectionsPerIP > 100) {
    errors.push(`maxConnectionsPerIP must be between 1 and 100, got ${constants.maxConnectionsPerIP}`);
  }

  if (constants.defaultPort <= 1024 || constants.defaultPort > 65535) {
    errors.push(`defaultPort must be between 1025 and 65535, got ${constants.defaultPort}`);
  }

  if (constants.idleTimeoutMs < 60000 || constants.idleTimeoutMs > 7200000) { // 1 min to 2 hours
    errors.push(`idleTimeoutMs must be between 60000 and 7200000, got ${constants.idleTimeoutMs}`);
  }

  if (constants.maxInputLength < 256 || constants.maxInputLength > 32768) {
    errors.push(`maxInputLength must be between 256 and 32768, got ${constants.maxInputLength}`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid game constants:\n${errors.join('\n')}`);
  }
}
