import type { Args } from '../types'
import { LoggedEmitter } from './LoggedEmitter'

/**
 * SafeEmitter ensures that event emissions don't crash the system by catching errors
 * and routing them to `onEmitError`. This is useful for game engines or servers where
 * a single listener error should not bring down the process.
 *
 * - All emits are wrapped in try/catch.
 * - Errors are routed to a customizable handler (default: logs with context).
 * - Normalizes argument handling for 0/1-argument events.
 *
 * @template TEvents - The event map for this emitter.
 */
export class SafeEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends LoggedEmitter<TEvents> {
  /**
   * Emits an event safely, wrapping errors and routing them to onEmitError.
   * @param eventName The event name.
   * @param args Arguments for the event.
   */
  async emitSafe<Name extends keyof TEvents>(
    eventName: Name,
    ...args: Args<TEvents[Name]>
  ): Promise<void> {
    try {
      const tuple = this.normalizeArgs<TEvents[Name]>(args)
      if (tuple.length === 0) {
        await super.emit(eventName as any)
      } else {
        await super.emit(eventName, tuple[0])
      }
    } catch (err) {
      this.onEmitError(eventName, err)
    }
  }

  /**
   * Normalizes args into a 0- or 1-length tuple for event emission.
   * @param args The arguments array.
   * @returns [] if no args, [T] if one arg.
   */
  protected normalizeArgs<T>(args: unknown[]): [] | [T] {
    return args.length === 0 ? [] : [args[0] as T]
  }

  /**
   * Default error handler: logs error with event context.
   * Can be overridden in subclasses for custom error handling.
   * @param eventName The event name.
   * @param error The error thrown by a listener.
   */
  protected onEmitError<Name extends keyof TEvents>(
    eventName: Name,
    error: unknown
  ): void {
    this.log.error(
      { event: String(eventName), error },
      'SafeEmitter caught an error during emit'
    )
  }
}
