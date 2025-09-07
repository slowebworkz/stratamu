import type {
  ClientCapabilities,
  FilterName,
  OutputFilter
} from '@stratamu/types'
import { FILTER_NAMES } from '@stratamu/types'
import {
  ansiFilter,
  msdpFilter,
  mxpFilter,
  puebloFilter,
  utf8Filter
} from './middleware/index'

/**
 * Implementation mapping for all supported output filters.
 * Each key must match a value in FILTER_NAMES.
 */
const filterImpls: Record<FilterName, OutputFilter> = {
  ansi: ansiFilter,
  pueblo: puebloFilter,
  mxp: mxpFilter,
  msdp: msdpFilter,
  utf8: utf8Filter
}

/**
 * Maps each FilterName to its corresponding OutputFilter implementation.
 * Constructed dynamically from FILTER_NAMES for type safety and maintainability.
 */
const capabilityFilterMap: Record<FilterName, OutputFilter> =
  Object.fromEntries(
    FILTER_NAMES.map((name) => [name, filterImpls[name]])
  ) as Record<FilterName, OutputFilter>

/**
 * Detect client capabilities from initial negotiation data.
 * Should only be called at connection/handshake time.
 */
export function detectCapabilitiesFromData(
  negotiationData: unknown
): ClientCapabilities {
  // TODO: Replace with real detection logic
  return { ansi: true }
}

/**
 * CapabilitiesManager: manages detection, explicit setting, mapping to filters, and retrieval of client filter queues.
 */
/**
 * Manages client capabilities, filter queue construction, and capability detection.
 * Provides methods to set, get, and clear capabilities and filter queues for clients.
 */
export class CapabilitiesManager {
  private readonly capabilities = new Map<string, ClientCapabilities>()
  private readonly filterQueues = new Map<string, OutputFilter[]>()

  /**
   * Extract explicit capabilities from a layered data stream.
   * Stub: Replace with protocol-specific logic.
   */
  extractExplicitCapabilities(
    dataStream: unknown
  ): ClientCapabilities | undefined {
    // Example: return (dataStream as { capabilities?: ClientCapabilities })?.capabilities
    return undefined
  }

  /**
   * Initialize or update capabilities and filter queue for a client.
   */
  set(clientId: string, dataStream?: unknown, negotiationData?: unknown): void {
    const explicit = this.extractExplicitCapabilities(dataStream)
    const detected = detectCapabilitiesFromData(negotiationData)

    // Merge (explicit takes precedence)
    let caps: ClientCapabilities = { ...detected, ...explicit }
    // Ensure all FilterName keys are present, defaulting to false
    for (const name of FILTER_NAMES) {
      if (typeof caps[name] !== 'boolean') {
        caps[name] = false
      }
    }
    this.capabilities.set(clientId, caps)

    // Build filter queue
    const queue: OutputFilter[] = FILTER_NAMES.flatMap((name) =>
      caps[name] ? [capabilityFilterMap[name]] : []
    )

    this.filterQueues.set(clientId, queue)
  }

  /**
   * Get the filter queue for a client.
   */
  getFilterQueue(clientId: string): OutputFilter[] {
    return this.filterQueues.get(clientId) ?? []
  }

  /**
   * Get capabilities for a client.
   */
  get(clientId: string): ClientCapabilities | undefined {
    return this.capabilities.get(clientId)
  }

  /**
   * Remove capabilities and filter queue for a client.
   */
  clear(clientId: string): void {
    this.capabilities.delete(clientId)
    this.filterQueues.delete(clientId)
  }

  /**
   * Clear all capabilities and filter queues (e.g., on shutdown).
   */
  clearAll(): void {
    this.capabilities.clear()
    this.filterQueues.clear()
  }
}
