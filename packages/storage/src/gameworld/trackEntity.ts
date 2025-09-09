import { GameEntity } from '@entities/entity'
import { DirtyTracker } from '@gameworld/DirtyTracker'

/**
 * Wraps an entity in a Proxy to intercept changes and mark as dirty.
 */
export function trackEntity(
  entity: GameEntity,
  tracker: DirtyTracker
): GameEntity {
  return new Proxy(entity, {
    set(target: GameEntity, prop: keyof GameEntity, value: any) {
      if ((target as any)[prop] !== value) {
        ;(target as any)[prop] = value
        ;(target as any).updatedAt = Date.now()
        tracker.markDirty((target as any).id)
      }
      return true
    }
  })
}
