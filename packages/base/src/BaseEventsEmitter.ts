import { DestroyableEmitter } from './events/index'

export class BaseEventEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends DestroyableEmitter<TEvents> {}
