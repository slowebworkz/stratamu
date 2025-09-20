import type { JsonObject, PartialDeep, SetRequired } from 'type-fest'
// NOTE: Update these paths to the correct .js extension once the files exist and are exported via barrel files
import type { TelnetConfig } from './adapters/index.js'
import type { TelnetEventMap } from './networking/index.js'

export type TelnetConfigRequired = SetRequired<
  TelnetConfig,
  'port' | 'idleTimeoutMs' | 'maxConnections' | 'maxConnectionsPerIP'
>
export type TelnetHandlers = PartialDeep<{
  [K in keyof TelnetEventMap]: Array<TelnetEventMap[K]>
}>
export type TelnetMiddleware = (
  clientId: string,
  message: any,
  next: () => void
) => void
export type TelnetClientState = JsonObject
export type TelnetGroupId = string
export type TelnetClientId = string
export type TelnetMessage = string | object
