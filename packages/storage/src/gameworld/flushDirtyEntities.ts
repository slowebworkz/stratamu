import { promises as fsp } from 'node:fs'
import * as YAML from 'yaml'
import {
  readFileSync as defaultReadFileSync,
  writeFileSync as defaultWriteFileSync
} from 'node:fs'
import { GameEntity } from '../entities/entity'

/**
 * Async version of flushDirtyEntities using fs.promises
 */
export async function flushDirtyEntitiesAsync(
  filePath: string,
  dirtyEntities: GameEntity[],
  opts?: {
    readFile?: (path: string, encoding: string) => Promise<string>
    writeFile?: (path: string, data: string, encoding: string) => Promise<void>
  }
): Promise<void> {
  if (!dirtyEntities.length) return

  const readFile = opts?.readFile ?? fsp.readFile
  const writeFile = opts?.writeFile ?? fsp.writeFile

  const currentYaml = YAML.parse(await readFile(filePath, 'utf8')) || []
  const updatedYaml = currentYaml.map((e: GameEntity) => {
    const updated = dirtyEntities.find((d) => d.id === e.id)
    return updated ?? e
  })

  // Add any new entities not in file
  dirtyEntities.forEach((d) => {
    if (!updatedYaml.find((e) => e.id === d.id)) updatedYaml.push(d)
  })

  await writeFile(filePath, YAML.stringify(updatedYaml), 'utf8')
}

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
