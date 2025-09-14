import type { Args } from '../types'
import { LoggedEmitter } from './LoggedEmitter'

/**
 * SafeEmitter ensures that event emissions don't crash
 * the system by catching errors and routing them to `onEmitError`.
 */
export class SafeEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends LoggedEmitter<TEvents> {
  /**
   * Emits an event safely, wrapping errors.
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
   * Normalizes args into a 0- or 1-length tuple.
   */
  protected normalizeArgs<T>(args: unknown[]): [] | [T] {
    return args.length === 0 ? [] : [args[0] as T]
  }

  /**
   * Default error handler: logs error with context.
   * Can be overridden in subclasses.
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
