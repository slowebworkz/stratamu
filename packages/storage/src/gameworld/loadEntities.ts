import type { EntityMap, GameEntity } from '@entities/entity'
import { DirtyTracker } from '@gameworld/DirtyTracker'
import { trackEntity } from '@gameworld/trackEntity'
import { readFileSync } from 'node:fs'
import YAML from 'yaml'

export function loadEntities(
  filePath: string,
  tracker: DirtyTracker
): EntityMap {
  const fileContent = readFileSync(filePath, 'utf8')
  const rawEntities: GameEntity[] = YAML.parse(fileContent) || []
  const entities: EntityMap = new Map()
  rawEntities.forEach((e) => {
    const tracked = trackEntity(e, tracker)
    entities.set(e.id, tracked)
  })
  return entities
}
