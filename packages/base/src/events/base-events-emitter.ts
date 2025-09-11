import Emittery from 'emittery'
import type { Args } from '../types'

export class BaseEventEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends Emittery<TEvents> {
  private bubbleEvents = new Set<keyof TEvents>()

  constructor(private parent?: BaseEventEmitter<any>) {
    super()
  }

  // Public API

  async emitSafe<Name extends keyof TEvents>(
    eventName: Name,
    ...args: Args<TEvents[Name]>
  ): Promise<void> {
    try {
      await super.emit(eventName, ...(args as [TEvents[Name]]))
    } catch (err) {
      this.onEmitError(eventName, err)
    }
  }

  async emitWithBubble<Name extends keyof TEvents>(
    eventName: Name,
    ...args: Args<TEvents[Name]>
  ): Promise<void> {
    await this.emitSafe(eventName, ...args)
    if (this.bubbleEvents.has(eventName)) {
      await this.bubbleToParent(eventName, args)
    }
  }

  protected async bubbleToParent<Name extends keyof TEvents>(
    eventName: Name,
    args: Args<TEvents[Name]>,
    visited = new Set<BaseEventEmitter<any>>()
  ): Promise<void> {
    if (!this.parent || visited.has(this)) return
    visited.add(this)
    const parentAny = this.parent as any
    if (args.length === 0) {
      await parentAny.emitSafe(eventName)
      await parentAny.bubbleToParent(eventName, [], visited)
    } else {
      await parentAny.emitSafe(eventName, args[0])
      await parentAny.bubbleToParent(eventName, [args[0]], visited)
    }
  }

  unsubscribeAll(): void {
    super.clearListeners()
  }

  destroy(): void {
    this.unsubscribeAll()
    this.parent = undefined
  }

  // Protected API

  protected enableBubble<Name extends keyof TEvents>(event: Name): void {
    this.bubbleEvents.add(event)
  }

  protected onEmitError<Name extends keyof TEvents>(
    eventName: Name,
    error: unknown
  ): void {
    console.error(`EventEmitter error on event '${String(eventName)}':`, error)
  }
}
