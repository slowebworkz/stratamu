import type { EntityMap } from '@entities/entity'
import { writeFileSync } from 'node:fs'
import YAML from 'yaml'

export function flushEntities(filePath: string, entities: EntityMap): void {
  const allEntities = Array.from(entities.values())
  const yamlStr = YAML.stringify(allEntities)
  writeFileSync(filePath, yamlStr, 'utf8')
}
