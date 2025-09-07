import type { PartialDeep, Simplify, ValueOf } from 'type-fest'
import type { BaseClient } from './networking/client.js'

/**
 * Shared types for the stratamu monorepo.
 *
 * These types are intended for use across all packages.
 */

/**
 * A function that transforms output text for a client, possibly chaining to the next filter.
 * @param client The client instance.
 * @param text The text to filter.
 * @param next The next filter in the chain.
 */
export type OutputFilter = (
  client: BaseClient,
  text: string,
  next: (text: string) => string
) => string

/**
 * All supported output filter names.
 */
export const FILTER_NAMES = ['ansi', 'pueblo', 'mxp', 'msdp', 'utf8'] as const

/**
 * A union type of all filter names.
 */
export type FilterName = (typeof FILTER_NAMES)[number]

/**
 * Capabilities supported by a client, keyed by filter name and extensible for custom keys.
 */
export type ClientCapabilities = Simplify<
  PartialDeep<Record<FilterName, boolean>> & {
    [key: string]: unknown
  }
>

/**
 * A type representing any output filter function for any filter name.
 */
export type AnyFilter = ValueOf<Record<FilterName, OutputFilter>>
