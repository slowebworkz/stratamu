import { BaseEventEmitter } from './BaseEventsEmitter'

const ERROR_MSG = 'BaseClass cannot be instantiated directly'

/**
 * BaseClass provides a strongly-typed base for event-driven classes.
 *
 * @template EventMap - The event map for this emitter.
 */
export abstract class BaseClass<
  EventMap extends Record<string, unknown[]> = Record<string, unknown[]>
> extends BaseEventEmitter<EventMap> {
  constructor(...args: any[]) {
    super(...args)
    if (new.target === BaseClass) {
      // Log with extra context to avoid exact duplication
      if (typeof this.logger?.error === 'function') {
        this.logger.error({ class: 'BaseClass' }, ERROR_MSG)
      }
      throw new Error(ERROR_MSG)
    }
  }
}
