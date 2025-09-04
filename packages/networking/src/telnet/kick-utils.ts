import type * as net from 'node:net'

export type KickStats = {
  total: number
  byIP: Map<string, number>
  limits: { maxConnections: number; maxConnectionsPerIP: number }
  canAcceptNew: boolean
}

/**
 * Returns the newest clientIds to kick for a given IP, based on excess count.
 * Keeps older connections, kicks newer ones.
 *
 * Ordering guarantee: This function relies on Map preserving insertion order.
 * If another data structure is used, ordering may not be correct.
 */
export function getClientsToKickByIP(
  clients: Map<string, net.Socket>,
  ip: string,
  excess: number
): Array<[string, net.Socket]> {
  if (excess <= 0) return []
  return Array.from(clients.entries())
    .filter(([, socket]) => socket.remoteAddress === ip)
    .slice(-excess)
}

/**
 * Kicks excess connections for all IPs, returns number kicked.
 * Emits disconnect events via the provided callback.
 *
 * Note: emitDisconnect is called before clients.delete().
 * If downstream logic in emitDisconnect needs to query clients, the entry will still exist.
 */
export function kickExcessConnections(
  clients: Map<string, net.Socket>,
  stats: KickStats,
  emitDisconnect: (clientId: string, socket: net.Socket) => void
): { kicked: number; clientIds: string[] } {
  let kicked = 0
  const clientIds: string[] = []
  stats.byIP.forEach((count, ip) => {
    if (count > stats.limits.maxConnectionsPerIP) {
      const excess = count - stats.limits.maxConnectionsPerIP
      const toKick = getClientsToKickByIP(clients, ip, excess)
      toKick.forEach(([clientId, socket]) => {
        try {
          socket.end('Too many connections from your IP address.\r\n')
        } catch {
          socket.destroy()
        }
        emitDisconnect(clientId, socket)
        clients.delete(clientId)
        kicked++
        clientIds.push(clientId)
      })
    }
  })
  return { kicked, clientIds }
}
