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
  async process(
    clientId: string,
    data: string,
    client?: import('@stratamu/types').BaseClient
  ): Promise<string> {
    const capabilities =
      this.capabilitiesManager.get(clientId) || client?.capabilities || {}
    const clientObj = { ...client, capabilities }
    const filters = this.capabilitiesManager.getFilterQueue(clientId)
    let idx = 0
    const next = async (t: string): Promise<string> => {
      const filter = filters[idx++]
      return filter ? await filter(clientObj, t, next) : t
    }
    return next(data)
  }
}
