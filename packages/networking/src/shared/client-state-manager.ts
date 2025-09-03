// clientStateManager.ts

export class ClientStateManager {
  private states = new Map<string, Record<string, any>>()

  get(clientId: string): Record<string, any> {
    return this.states.get(clientId) || {}
  }

  set(clientId: string, state: Record<string, any>): void {
    this.states.set(clientId, state)
  }

  delete(clientId: string): void {
    this.states.delete(clientId)
  }

  has(clientId: string): boolean {
    return this.states.has(clientId)
  }

  clear(): void {
    this.states.clear()
  }
}
