import Emittery from 'emittery'
import type { Args } from './types'

export class FilteredPriorityEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends Emittery<TEvents> {
  private _priorityListeners: {
    [K in keyof TEvents]?: Array<{
      callback: (...args: Args<TEvents[K]>) => void
      priority: number
      filter?: (...args: Args<TEvents[K]>) => boolean
    }>
  } = {}

  /**
   * Register a listener with optional priority and filter.
   * Returns an unsubscribe function.
   */
  onWithOptions<Name extends keyof TEvents>(
    event: Name,
    callback: (...args: Args<TEvents[Name]>) => void,
    options?: {
      priority?: number
      filter?: (...args: Args<TEvents[Name]>) => boolean
    }
  ): () => void {
    const arr = this._priorityListeners[event] ?? []
    const listener = {
      callback,
      priority: options?.priority ?? 0,
      filter: options?.filter
    }
    arr.push(listener)
    arr.sort((a, b) => b.priority - a.priority)
    this._priorityListeners[event] = arr
    return () => {
      this._priorityListeners[event] = (
        this._priorityListeners[event] || []
      ).filter((l) => l !== listener)
    }
  }

  /**
   * Emit an event, calling priority listeners first (in order, with filters), then Emittery listeners.
   * Returns a Promise that resolves when all listeners have completed.
   */
  async emitWithPriority<Name extends keyof TEvents>(
    event: Name,
    ...args: Args<TEvents[Name]>
  ): Promise<void> {
    const arr = this._priorityListeners[event] ?? []
    for (const listener of arr) {
      if (!listener.filter || listener.filter(...args)) {
        await listener.callback(...args)
      }
    }
    await super.emit(event, ...(args as [any]))
  }

  /**
   * Remove all priority listeners.
   */
  clearPriorityListeners(): void {
    this._priorityListeners = {}
  }
}
