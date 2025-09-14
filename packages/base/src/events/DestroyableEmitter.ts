import { BubblingEmitter } from './BubblingEmitter'

/**
 * DestroyableEmitter extends BubblingEmitter to add lifecycle cleanup.
 *
 * - Provides a destroy() method to clean up listeners and parent references.
 * - Useful for objects that need explicit teardown (e.g., game entities, subsystems).
 *
 * @template TEvents - The event map for this emitter.
 */
export class DestroyableEmitter<
  TEvents extends Record<string, any>
> extends BubblingEmitter<TEvents> {
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
