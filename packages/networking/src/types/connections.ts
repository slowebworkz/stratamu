// connections.ts - Connection management interfaces

export interface ConnectionLimits {
  maxConnections: number
  maxConnectionsPerIP: number
}

export interface ConnectionInfo {
  ip?: string
  port?: number
  connected: Date
}

export interface ClientInfo {
  clientId: string
  connectionInfo: ConnectionInfo
  state: Record<string, any>
  groups: string[]
}

// Traditional MUD-style connection statistics
export interface ConnectionStats {
  total: number
  byIP: Map<string, number>
  limits: ConnectionLimits
  canAcceptNew: boolean
  oldestConnection?: Date
  newestConnection?: Date
}

// Traditional MUD connection policies
export interface ConnectionPolicy {
  maxConnections: number
  maxConnectionsPerIP: number
  maxGuestConnections?: number
  maxNewbieConnections?: number
  idleTimeoutMs: number
  connectTimeoutMs?: number
  allowSiteban?: boolean
  requireDNSLookup?: boolean
}
