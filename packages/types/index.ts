// Shared types for stratamu monorepo
import type { PartialDeep, Simplify, ValueOf } from 'type-fest'

export type OutputFilter = (
  client: BaseClient,
  text: string,
  next: (text: string) => string
) => string

export const FILTER_NAMES = ['ansi', 'pueblo', 'mxp', 'msdp', 'utf8'] as const
export type FilterName = (typeof FILTER_NAMES)[number]

export type ClientCapabilities = Simplify<
  PartialDeep<Record<FilterName, boolean>> & {
    [key: string]: unknown
  }
>

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

export type AnyFilter = ValueOf<Record<FilterName, OutputFilter>>
