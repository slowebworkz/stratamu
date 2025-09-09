import type { EntityMap, GameEntity } from '@entities/entity'

export function getEntity(
  entities: EntityMap,
  id: string
): GameEntity | undefined {
  return entities.get(id)
}
