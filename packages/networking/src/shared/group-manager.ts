export class GroupManager {
  private groups: Map<string, Set<string>> = new Map()

  /**
   * Add a client to a group
   */
  addClientToGroup(clientId: string, groupId: string): void {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new Set())
    }
    this.groups.get(groupId)!.add(clientId)
  }

  /**
   * Remove a client from a specific group
   */
  removeClientFromGroup(clientId: string, groupId: string): void {
    const group = this.groups.get(groupId)
    if (group) {
      group.delete(clientId)
      if (group.size === 0) {
        this.groups.delete(groupId)
      }
    }
  }

  /**
   * Remove a client from all groups
   */
  removeClientFromAllGroups(clientId: string): void {
    this.groups.forEach((group, groupId) => {
      group.delete(clientId)
      if (group.size === 0) {
        this.groups.delete(groupId)
        console.info(`Group ${groupId} is now empty and has been deleted.`)
      } else {
        console.info(
          `Client ${clientId} removed from group ${groupId}. Remaining members: ${Array.from(group).join(', ')}`
        )
      }
    })
  }

  /**
   * Generic broadcast method that accepts a callback for sending messages
   * This makes it transport-agnostic (works with telnet, websockets, etc.)
   */
  broadcast<T>(
    clients: Map<string, T>,
    message: string | object,
    sendFunction: (client: T, message: string | object) => void,
    groupId?: string
  ): void {
    if (groupId) {
      const group = this.groups.get(groupId)
      if (group) {
        for (const clientId of group) {
          const client = clients.get(clientId)
          if (client) {
            sendFunction(client, message)
          }
        }
      }
    } else {
      // Broadcast to all clients
      clients.forEach((client) => {
        sendFunction(client, message)
      })
    }
  }

  /**
   * Get all groups
   */
  getAllGroups(): Map<string, Set<string>> {
    return this.groups
  }

  /**
   * Get clients in a specific group
   */
  getGroupClients(groupId: string): Set<string> | undefined {
    return this.groups.get(groupId)
  }

  /**
   * Get groups that a client belongs to
   */
  getClientGroups(clientId: string): string[] {
    const clientGroups: string[] = []
    this.groups.forEach((group, groupId) => {
      if (group.has(clientId)) {
        clientGroups.push(groupId)
      }
    })
    return clientGroups
  }

  /**
   * Check if a group exists
   */
  hasGroup(groupId: string): boolean {
    return this.groups.has(groupId)
  }

  /**
   * Get the number of clients in a group
   */
  getGroupSize(groupId: string): number {
    const group = this.groups.get(groupId)
    return group ? group.size : 0
  }

  /**
   * Clear all groups
   */
  clear(): void {
    this.groups.clear()
  }
}
