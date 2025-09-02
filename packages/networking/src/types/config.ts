// config.ts - Configuration interfaces for different adapter types

export interface TelnetConfig {
  port?: number;
  idleTimeoutMs?: number;
  maxConnections?: number;
  maxConnectionsPerIP?: number;
}

export interface WebSocketConfig {
  port?: number;
  idleTimeoutMs?: number;
  maxConnections?: number;
  maxConnectionsPerIP?: number;
  path?: string;
  cors?: boolean;
}

export interface BaseNetworkConfig {
  port?: number;
  idleTimeoutMs?: number;
  maxConnections?: number;
  maxConnectionsPerIP?: number;
}
