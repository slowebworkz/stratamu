import type * as net from 'node:net'
import { IdleTimeoutManager } from '@/shared'

export function setIdleTimeout(
  idleTimeouts: IdleTimeoutManager,
  connectionManager: { getClient: (id: string) => net.Socket | undefined },
  clientId: string,
  ms: number,
  onTimeout: (clientId: string, socket: net.Socket) => void
) {
  idleTimeouts.set(clientId, ms, () => {
    const socket = connectionManager.getClient(clientId)
    if (socket) {
      onTimeout(clientId, socket)
    }
  })
}
