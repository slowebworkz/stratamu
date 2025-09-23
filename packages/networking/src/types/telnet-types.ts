import type { TelnetEventMap } from '@/telnet'
import { TelnetConfig } from '@/types'
import type { JsonObject, PartialDeep, SetRequired } from 'type-fest'

export type TelnetConfigRequired = SetRequired<
  TelnetConfig,
  'port' | 'idleTimeoutMs' | 'maxConnections' | 'maxConnectionsPerIP'
>
export type TelnetHandlers = PartialDeep<{
  [K in keyof TelnetEventMap]: Array<TelnetEventMap[K]>
}>
export type TelnetMiddleware = (
  clientId: string,
  message: JsonObject,
  next: () => void
) => void
export type TelnetClientState = JsonObject
export type TelnetGroupId = string
export type TelnetClientId = string
export type TelnetMessage = string | JsonObject
