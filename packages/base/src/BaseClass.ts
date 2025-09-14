import { BaseEventEmitter } from './BaseEventsEmitter'

export class BaseClass<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends BaseEventEmitter<TEvents> {
  // ...any shared logic
}
