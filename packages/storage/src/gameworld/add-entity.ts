import type { EntityMap, GameEntity } from '@entities/entity'

export function addEntity(
  entities: EntityMap,
  entity: GameEntity,
  tracker: { markDirty: (id: string) => void },
  trackEntity: (entity: GameEntity, tracker: any) => GameEntity
): void {
  if (!entity.id) throw new Error('Entity must have an id')
  entity.createdAt = Date.now()
  entity.updatedAt = Date.now()
  const tracked = trackEntity(entity, tracker)
  entities.set(entity.id, tracked)
  tracker.markDirty(entity.id)
}
