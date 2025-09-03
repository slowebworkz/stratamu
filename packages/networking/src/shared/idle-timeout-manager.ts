// idleTimeoutManager.ts

export class IdleTimeoutManager {
  private timers = new Map<string, NodeJS.Timeout>()

  set(clientId: string, ms: number, onTimeout: () => void): void {
    this.clear(clientId)
    const timer = setTimeout(onTimeout, ms)
    this.timers.set(clientId, timer)
  }

  clear(clientId: string): void {
    const timer = this.timers.get(clientId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(clientId)
    }
  }

  has(clientId: string): boolean {
    return this.timers.has(clientId)
  }

  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }
}
