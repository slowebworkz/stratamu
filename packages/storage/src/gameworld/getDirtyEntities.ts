import type { EntityMap, GameEntity } from '@entities/entity'

export function getDirtyEntities(
  entities: EntityMap,
  tracker: { getAll: () => string[] }
): GameEntity[] {
  return tracker
    .getAll()
    .map((id: string) => entities.get(id)!)
    .filter(Boolean)
}
