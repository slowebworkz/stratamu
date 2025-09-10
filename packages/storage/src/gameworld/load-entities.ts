import type { EntityMap, GameEntity } from '@entities/entity'
import { DirtyTracker } from '@gameworld/dirty-tracker'
import { trackEntity } from '@gameworld/track-entity'
import { promises as fsp, readFileSync } from 'node:fs'
import * as YAML from 'yaml'
/**
 * Async version of loadEntities using fs.promises
 */
export async function loadEntitiesAsync(
  filePath: string,
  tracker: DirtyTracker
): Promise<EntityMap> {
  const fileContent = await fsp.readFile(filePath, 'utf8')
  const rawEntities: GameEntity[] = YAML.parse(fileContent) || []
  const entities: EntityMap = new Map()
  rawEntities.forEach((e) => {
    const tracked = trackEntity(e, tracker)
    entities.set(e.id, tracked)
  })
  return entities
}

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
