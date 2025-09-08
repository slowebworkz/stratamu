import type { PartialDeep, Promisable, Simplify, ValueOf } from 'type-fest'
import type { BaseClient } from './networking/client.js'

/**
 * Shared types for the stratamu monorepo.
 *
 * These types are intended for use across all packages.
 */

export type OutputPipeline = (text: string) => Promisable<string>

/**
 * A function that transforms output text for a client, possibly chaining to the next filter.
 * Supports both synchronous and asynchronous (Promise) pipelines.
 * @param client The client instance.
 * @param text The text to filter.
 * @param next The next filter in the chain.
 */
export type OutputFilter = (
  client: BaseClient,
  text: string,
  next: OutputPipeline
) => Promisable<string>

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
