import type { Args } from '../types'
import { SafeEmitter } from './SafeEmitter'

/**
 * BubblingEmitter extends SafeEmitter to support event bubbling up a parent chain.
 *
 * - Allows selective bubbling of events to a parent emitter (e.g., for hierarchical game objects).
 * - Prevents infinite loops via a visited set.
 * - Supports enabling/disabling bubbling per event type.
 *
 * @template EventMap - The event map for this emitter.
 * @template ParentEventMap - The event map for the parent emitter (defaults to EventMap).
 */
export class BubblingEmitter<
  EventMap extends Record<string, unknown[]> = Record<string, unknown[]>,
  ParentEventMap extends Record<string, unknown[]> = EventMap
> extends SafeEmitter<EventMap> {
  /**
   * Optional parent emitter to which events may bubble.
   */
  protected parent?: BubblingEmitter<ParentEventMap>
  /**
   * Set of event names that should bubble to the parent.
   */
  private bubbleEvents = new Set<keyof EventMap>()

  /**
   * Construct a BubblingEmitter with an optional parent.
   * @param parent Optional parent emitter for bubbling.
   */
  constructor(parent?: BubblingEmitter<ParentEventMap>) {
    super()
    this.parent = parent
  }

  /**
   * Get the parent emitter, if any.
   */
  public getParent(): BubblingEmitter<ParentEventMap> | undefined {
    return this.parent
  }

  /**
   * Enable bubbling for a specific event type.
   * @param event The event name to enable bubbling for.
   */
  public enableBubble<Name extends keyof EventMap>(event: Name): void {
    this.bubbleEvents.add(event)
  }

  /**
   * Disable bubbling for a specific event type.
   * @param event The event name to disable bubbling for.
   */
  public disableBubble<Name extends keyof EventMap>(event: Name): void {
    this.bubbleEvents.delete(event)
  }

  /**
   * Check if bubbling is enabled for a specific event.
   * @param event The event name to check.
   */
  public isBubbling<Name extends keyof EventMap>(event: Name): boolean {
    return this.bubbleEvents.has(event)
  }

  /**
   * Emit an event and bubble it to the parent if enabled.
   * @param eventName The event name.
   * @param args Arguments for the event.
   */
  async emitWithBubble<Name extends keyof EventMap>(
    eventName: Name,
    ...args: Args<EventMap[Name]>
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
  protected async bubbleToParent<Name extends keyof EventMap>(
    eventName: Name,
    args: Args<EventMap[Name]>,
    visited: Set<BubblingEmitter<any>> = new Set()
  ): Promise<void> {
    const parent = this.parent
    if (!parent || visited.has(this) || visited.has(parent)) return

    visited.add(this)
    visited.add(parent)

    // Type assertion: allow bubbling to parent with a different event map
    await parent.emitSafe(
      eventName as keyof ParentEventMap,
      ...(args as unknown as Args<ParentEventMap[keyof ParentEventMap]>)
    )
    await parent.bubbleToParent(
      eventName as keyof ParentEventMap,
      args as unknown as Args<ParentEventMap[keyof ParentEventMap]>,
      visited
    )
  }
}
