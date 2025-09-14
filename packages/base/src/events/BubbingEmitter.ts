import type { Args } from '../types'
import { SafeEmitter } from './SafeEmitter'

export class BubblingEmitter<
  TEvents extends Record<string, any>,
  TParentEvents extends Record<string, any> = TEvents
> extends SafeEmitter<TEvents> {
  protected parent?: BubblingEmitter<TParentEvents>
  private bubbleEvents = new Set<keyof TEvents>()

  constructor(parent?: BubblingEmitter<TParentEvents>) {
    super()
    this.parent = parent
  }

  public getParent(): BubblingEmitter<TParentEvents> | undefined {
    return this.parent
  }

  public enableBubble<Name extends keyof TEvents>(event: Name): void {
    this.bubbleEvents.add(event)
  }

  public disableBubble<Name extends keyof TEvents>(event: Name): void {
    this.bubbleEvents.delete(event)
  }

  public isBubbling<Name extends keyof TEvents>(event: Name): boolean {
    return this.bubbleEvents.has(event)
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
    visited: Set<BubblingEmitter<any>> = new Set()
  ): Promise<void> {
    const parent = this.parent
    if (!parent || visited.has(this) || visited.has(parent)) return

    visited.add(this)
    visited.add(parent)

    // Type assertion: allow bubbling to parent with a different event map
    await parent.emitSafe(
      eventName as keyof TParentEvents,
      ...(args as unknown as Args<TParentEvents[keyof TParentEvents]>)
    )
    await parent.bubbleToParent(
      eventName as keyof TParentEvents,
      args as unknown as Args<TParentEvents[keyof TParentEvents]>,
      visited
    )
  }
}
