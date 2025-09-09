import type { EntityMap, GameEntity } from '@entities/entity'
import {
  addEntity,
  DirtyTracker,
  flushDirtyEntities,
  flushEntities,
  getDirtyEntities,
  getEntity,
  loadEntities,
  trackEntity
} from './gameworld'

/**
 * In-memory world with YAML persistence and dirty tracking.
 */
export class GameWorld {
  private entities: EntityMap = new Map()
  private tracker = new DirtyTracker()
  private filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  /**
   * Load YAML file into memory and wrap entities for tracking.
   */
  load() {
    this.entities = loadEntities(this.filePath, this.tracker)
  }

  /**
   * Get entity by ID.
   */
  get(id: string): GameEntity | undefined {
    return getEntity(this.entities, id)
  }

  /**
   * Add new entity and mark as dirty.
   */
  add(entity: GameEntity) {
    addEntity(this.entities, entity, this.tracker, trackEntity)
  }

  /**
   * Get all dirty entities.
   */
  getDirtyEntities(): GameEntity[] {
    return getDirtyEntities(this.entities, this.tracker)
  }

  /**
   * Flush all dirty entities to YAML file and clear dirty flags.
   */
  flush() {
    flushEntities(this.filePath, this.entities)
    this.tracker.clearAll()
  }

  /**
   * Flush only dirty entities to YAML file, merging with existing file contents.
   */
  flushDirty() {
    flushDirtyEntities(this.filePath, this.getDirtyEntities())
    this.tracker.clearAll()
  }
}
