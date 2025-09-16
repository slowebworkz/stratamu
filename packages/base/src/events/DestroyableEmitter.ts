import { BubblingEmitter } from './BubblingEmitter'

/**
 * DestroyableEmitter extends BubblingEmitter to add lifecycle cleanup.
 *
 * - Provides a destroy() method to clean up listeners and parent references.
 * - Useful for objects that need explicit teardown (e.g., game entities, subsystems).
 *
 * @template EventMap - The event map for this emitter.
 */
export class DestroyableEmitter<
  EventMap extends Record<string, unknown[]> = Record<string, unknown[]>
> extends BubblingEmitter<EventMap> {
  /**
   * Remove all listeners from this emitter.
   */
  unsubscribeAll(): void {
    super.clearListeners()
  }

  /**
   * Destroy this emitter, cleaning up listeners and parent references.
   * Calls logger.flush if available.
   */
  destroy(): void {
    this.unsubscribeAll()
    this.logger.flush?.()
    this.parent = undefined
  }
}
