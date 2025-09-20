// Example TelnetConfig type. Replace with your actual config shape.
export interface TelnetConfig {
  port?: number
  idleTimeoutMs?: number
  maxConnections?: number
  maxConnectionsPerIP?: number
  // Add more config options as needed
}

export interface ConnectionLimits {
  maxConnections: number
  maxConnectionsPerIP: number
}
