import type { Args } from '../types'
import { SafeEmitter } from './SafeEmitter'

/**
 * BubblingEmitter extends SafeEmitter to support event bubbling up a parent chain.
 *
 * - Allows selective bubbling of events to a parent emitter (e.g., for hierarchical game objects).
 * - Prevents infinite loops via a visited set.
 * - Supports enabling/disabling bubbling per event type.
 *
 * @template TEvents - The event map for this emitter.
 * @template TParentEvents - The event map for the parent emitter (defaults to TEvents).
 */
export class BubblingEmitter<
  TEvents extends Record<string, any>,
  TParentEvents extends Record<string, any> = TEvents
> extends SafeEmitter<TEvents> {
  /**
   * Optional parent emitter to which events may bubble.
   */
  protected parent?: BubblingEmitter<TParentEvents>
  /**
   * Set of event names that should bubble to the parent.
   */
  private bubbleEvents = new Set<keyof TEvents>()

  /**
   * Construct a BubblingEmitter with an optional parent.
   * @param parent Optional parent emitter for bubbling.
   */
  constructor(parent?: BubblingEmitter<TParentEvents>) {
    super()
    this.parent = parent
  }

  /**
   * Get the parent emitter, if any.
   */
  public getParent(): BubblingEmitter<TParentEvents> | undefined {
    return this.parent
  }

  /**
   * Enable bubbling for a specific event type.
   * @param event The event name to enable bubbling for.
   */
  public enableBubble<Name extends keyof TEvents>(event: Name): void {
    this.bubbleEvents.add(event)
  }

  /**
   * Disable bubbling for a specific event type.
   * @param event The event name to disable bubbling for.
   */
  public disableBubble<Name extends keyof TEvents>(event: Name): void {
    this.bubbleEvents.delete(event)
  }

  /**
   * Check if bubbling is enabled for a specific event.
   * @param event The event name to check.
   */
  public isBubbling<Name extends keyof TEvents>(event: Name): boolean {
    return this.bubbleEvents.has(event)
  }

  /**
   * Emit an event and bubble it to the parent if enabled.
   * @param eventName The event name.
   * @param args Arguments for the event.
   */
  async emitWithBubble<Name extends keyof TEvents>(
    eventName: Name,
    ...args: Args<TEvents[Name]>
  ): Promise<void> {
    await this.emitSafe(eventName, ...args)
    if (this.bubbleEvents.has(eventName)) {
      await this.bubbleToParent(eventName, args)
    }
  }

  /**
   * Bubble an event to the parent emitter, recursively.
   * Prevents cycles via the visited set.
   * @param eventName The event name.
   * @param args Arguments for the event.
   * @param visited Set of visited emitters to prevent cycles.
   */
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
