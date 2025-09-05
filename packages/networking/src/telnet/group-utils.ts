import { GroupManager } from '@/shared'
import type * as net from 'node:net'

export function addClientToGroup(
  groupManager: GroupManager,
  clientId: string,
  groupId: string
): void {
  groupManager.addClientToGroup(clientId, groupId)
}

export function removeClientFromGroup(
  groupManager: GroupManager,
  clientId: string,
  groupId: string
): void {
  groupManager.removeClientFromGroup(clientId, groupId)
}

export function broadcastToGroup(
  groupManager: GroupManager,
  clients: Map<string, net.Socket>,
  message: string | object,
  sendFn: (socket: net.Socket, msg: string | object) => void,
  groupId?: string
) {
  groupManager.broadcast(clients, message, sendFn, groupId)
}
