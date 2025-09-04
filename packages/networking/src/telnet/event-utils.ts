import type { TelnetEventMap } from './telnet-event-map'

export type TelnetHandlers = Partial<{
  [K in keyof TelnetEventMap]: Array<TelnetEventMap[K]>
}>

export function emitEvent<K extends keyof TelnetEventMap>(
  handlers: TelnetHandlers,
  event: K,
  ...args: Parameters<TelnetEventMap[K]>
) {
  const eventHandlers = handlers[event] as Array<TelnetEventMap[K]> | undefined
  if (eventHandlers) {
    for (const handler of eventHandlers) {
      ;(handler as (...a: Parameters<TelnetEventMap[K]>) => void)(...args)
    }
  }
}

export function registerHandler<K extends keyof TelnetEventMap>(
  handlers: TelnetHandlers,
  event: K,
  handler: TelnetEventMap[K]
) {
  if (!handlers[event]) handlers[event] = []
  ;(handlers[event] as Array<TelnetEventMap[K]>).push(handler)
}
