import {
  ansiFilter,
  msdpFilter,
  mxpFilter,
  puebloFilter,
  utf8Filter
} from './middleware/index'
import { OutputFilter } from './middleware/outputFilter'

// List of supported filter names
export const FILTER_NAMES = ['ansi', 'pueblo', 'mxp', 'msdp', 'utf8'] as const

export type FilterName = (typeof FILTER_NAMES)[number]

export type ClientCapabilities = Partial<Record<FilterName, boolean>> & {
  [key: string]: any
}

// Map capability keys to their corresponding filters
const capabilityFilterMap: Record<string, OutputFilter> = {
  ansi: ansiFilter,
  pueblo: puebloFilter,
  mxp: mxpFilter,
  msdp: msdpFilter,
  utf8: utf8Filter
}

/**
 * Utility to detect capabilities from initial negotiation data.
 * Should only be called at connection/handshake time.
 */
export function detectCapabilitiesFromData(
  negotiationData: any
): ClientCapabilities {
  // TODO: Implement real detection logic based on negotiationData
  // Example: return { ansi: true, pueblo: false, mxp: false, msdp: false, utf8: true }
  return { ansi: true }
}

/**
 * CapabilitiesManager: manages detection, explicit setting, mapping to filters, and retrieval of client filter queues.
 */
export class CapabilitiesManager {
  private capabilities: Map<string, ClientCapabilities> = new Map()
  private filterQueues: Map<string, OutputFilter[]> = new Map()

  /**
   * Extract explicit capabilities from a layered data stream (game adapter or protocol layer).
   * This is a stub for demonstration; real implementation would parse the stream.
   */
  extractExplicitCapabilities(dataStream: any): ClientCapabilities | undefined {
    // TODO: Implement extraction logic based on your protocol/data structure
    // Example: return dataStream.capabilities || undefined;
    return undefined
  }

  /**
   * Initialize or update capabilities and filter queue for a client.
   * @param clientId Unique identifier for the client/session
   * @param dataStream The incoming data stream (may contain explicit capabilities)
   * @param negotiationData Data to use for detection if explicit not provided (optional)
   */
  set(clientId: string, dataStream?: any, negotiationData?: any) {
    // a) Find explicit capabilities in the data stream
    const explicit = this.extractExplicitCapabilities(dataStream)
    // b) Run detection if explicit not found
    const caps = explicit || detectCapabilitiesFromData(negotiationData)
    this.capabilities.set(clientId, caps)
    // c) Determine which filters to use for this client
    const queue: OutputFilter[] = []
    for (const [key, value] of Object.entries(caps)) {
      if (value && capabilityFilterMap[key]) {
        queue.push(capabilityFilterMap[key])
      }
    }
    // d) Store the filter queue
    this.filterQueues.set(clientId, queue)
  }

  /**
   * Get the filter queue for a client.
   * @param clientId Unique identifier for the client/session
   */
  getFilterQueue(clientId: string): OutputFilter[] {
    return this.filterQueues.get(clientId) || []
  }

  /**
   * Get capabilities for a client.
   * @param clientId Unique identifier for the client/session
   */
  get(clientId: string): ClientCapabilities | undefined {
    return this.capabilities.get(clientId)
  }

  /**
   * Remove capabilities and filter queue for a client (e.g., on disconnect).
   * @param clientId Unique identifier for the client/session
   */
  clear(clientId: string) {
    this.capabilities.delete(clientId)
    this.filterQueues.delete(clientId)
  }

  /**
   * Clear all capabilities and filter queues (e.g., on server shutdown).
   */
  clearAll() {
    this.capabilities.clear()
    this.filterQueues.clear()
  }
}
