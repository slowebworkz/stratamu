// Middleware pipeline for output formatting

import { CapabilitiesManager } from './capabilities'

export class PresentationLayer {
  private capabilitiesManager = new CapabilitiesManager()

  /**
   * Delegate to CapabilitiesManager to initialize filters/capabilities for a client.
   */
  initializeClient(
    clientId: string,
    dataStream?: unknown,
    negotiationData?: unknown
  ) {
    this.capabilitiesManager.set(clientId, dataStream, negotiationData)
  }

  /**
   * Delegate to CapabilitiesManager to clear filters/capabilities for a client.
   */
  clearClient(clientId: string) {
    this.capabilitiesManager.clear(clientId)
  }

  /**
   * Delegate to CapabilitiesManager to clear all filters/capabilities.
   */
  clearAll() {
    this.capabilitiesManager.clearAll()
  }

  /**
   * Process data for a client using the stored filter queue.
   */
  process(
    clientId: string,
    data: string,
    client?: import('@stratamu/types').BaseClient
  ): string {
    const capabilities =
      this.capabilitiesManager.get(clientId) || client?.capabilities || {}
    const clientObj = { ...client, capabilities }
    const filters = this.capabilitiesManager.getFilterQueue(clientId)
    let idx = 0
    const next = (t: string): string => {
      const filter = filters[idx++]
      return filter ? filter(clientObj, t, next) : t
    }
    return next(data)
  }
}
