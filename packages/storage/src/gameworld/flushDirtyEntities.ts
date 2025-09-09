import {
  readFileSync as defaultReadFileSync,
  writeFileSync as defaultWriteFileSync
} from 'node:fs'
import YAML from 'yaml'
import { GameEntity } from '../entities/entity'

export function flushDirtyEntities(
  filePath: string,
  dirtyEntities: GameEntity[],
  opts?: {
    readFileSync?: (path: string, encoding: string) => string
    writeFileSync?: (path: string, data: string, encoding: string) => void
  }
) {
  if (!dirtyEntities.length) return

  const readFileSync = opts?.readFileSync ?? defaultReadFileSync
  const writeFileSync = opts?.writeFileSync ?? defaultWriteFileSync

  const currentYaml = YAML.parse(readFileSync(filePath, 'utf8')) || []
  const updatedYaml = currentYaml.map((e: GameEntity) => {
    const updated = dirtyEntities.find((d) => d.id === e.id)
    return updated ?? e
  })

  // Add any new entities not in file
  dirtyEntities.forEach((d) => {
    if (!updatedYaml.find((e) => e.id === d.id)) updatedYaml.push(d)
  })

  writeFileSync(filePath, YAML.stringify(updatedYaml), 'utf8')
}
