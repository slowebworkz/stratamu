// Common client type for networking and presentation packages

import type { ClientCapabilities } from '@stratamu/types'

export interface BaseClient {
  clientId: string
  capabilities?: ClientCapabilities
  connectionInfo?: {
    ip?: string
    port?: number
    connected?: Date
  }
  // Add more fields as needed for your use case
}
