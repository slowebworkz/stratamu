/**
 * EntityPersistence handles loading and saving entities to persistent storage (YAML file).
 * Provides type safety, documentation, and error handling for all operations.
 */
import type { GameEntity } from '@entities/entity'
import {
  flushDirtyEntities,
  flushDirtyEntitiesAsync
} from '@gameworld/flush-dirty-entities'
import { loadEntities, loadEntitiesAsync } from '@gameworld/load-entities'

export class EntityPersistence {
  private filePath: string

  /**
   * Create a new EntityPersistence for a given file path.
   * @param filePath Path to the YAML file for persistence.
   */
  constructor(filePath: string) {
    if (!filePath) throw new Error('EntityPersistence: filePath is required.')
    this.filePath = filePath
  }

  /**
   * Load all entities from storage (sync).
   * @returns Array of GameEntity objects.
   */
  load(): GameEntity[] {
    const tracker = { markDirty: () => {} } as any
    try {
      const map = loadEntities(this.filePath, tracker)
      return Array.from(map.values())
    } catch (err) {
      throw new Error(
        `EntityPersistence: Failed to load entities: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  /**
   * Load all entities from storage (async).
   * @returns Promise of GameEntity array.
   */
  async loadAsync(): Promise<GameEntity[]> {
    const tracker = { markDirty: () => {} } as any
    try {
      const map = await loadEntitiesAsync(this.filePath, tracker)
      return Array.from(map.values())
    } catch (err) {
      throw new Error(
        `EntityPersistence: Failed to load entities (async): ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  /**
   * Flush all entities to storage (sync).
   * @param entities Array of GameEntity objects to persist.
   */
  flush(entities: GameEntity[]): void {
    try {
      flushDirtyEntities(this.filePath, entities)
    } catch (err) {
      throw new Error(
        `EntityPersistence: Failed to flush entities: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  /**
   * Flush all entities to storage (async).
   * @param entities Array of GameEntity objects to persist.
   */
  async flushAsync(entities: GameEntity[]): Promise<void> {
    try {
      await flushDirtyEntitiesAsync(this.filePath, entities)
    } catch (err) {
      throw new Error(
        `EntityPersistence: Failed to flush entities (async): ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}
