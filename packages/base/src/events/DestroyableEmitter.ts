import { BubblingEmitter } from './BubbingEmitter'

export class DestroyableEmitter<
  TEvents extends Record<string, any>
> extends BubblingEmitter<TEvents> {
  unsubscribeAll(): void {
    super.clearListeners()
  }

  destroy(): void {
    this.unsubscribeAll()
    this.logger.flush?.()
    this.parent = undefined
  }
}
