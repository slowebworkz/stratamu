// Shared types for the presentation package

import type { BaseClient } from '@stratamu/types'
import type { PartialDeep, Simplify, ValueOf } from 'type-fest'

export type OutputFilter = (
  client: BaseClient,
  text: string,
  next: (text: string) => string
) => string

export const FILTER_NAMES = ['ansi', 'pueblo', 'mxp', 'msdp', 'utf8'] as const
export type FilterName = (typeof FILTER_NAMES)[number]

// Example: Use PartialDeep for deeply nested capability objects in the future
export type ClientCapabilities = Simplify<
  PartialDeep<Record<FilterName, boolean>> & {
    [key: string]: unknown
  }
>

// Example: ValueOf utility for extracting filter types
export type AnyFilter = ValueOf<Record<FilterName, OutputFilter>>
