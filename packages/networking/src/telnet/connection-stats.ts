import type * as net from 'node:net'
// Update the import path to the correct location if '../types' does not exist
import type { ConnectionLimits } from '@/types'

export function getConnectionInfo(
  connectionManager: {
    getClient: (id: string) => net.Socket | undefined
    getConnectionInfo: (id: string) => any
  },
  clientId: string
): { ip?: string; port?: number; connected: Date } | null {
  return connectionManager.getConnectionInfo(clientId)
}

export function getConnectionStats(connectionManager: {
  getActiveConnections: () => number
  getConnectionsByIP: () => Map<string, number>
  getConnectionLimits: () => ConnectionLimits
}): {
  total: number
  byIP: Map<string, number>
  limits: ConnectionLimits
  canAcceptNew: boolean
} {
  const limits = connectionManager.getConnectionLimits()
  const total = connectionManager.getActiveConnections()
  const byIP = connectionManager.getConnectionsByIP()
  return {
    total,
    byIP,
    limits,
    canAcceptNew: total < limits.maxConnections
  }
}
