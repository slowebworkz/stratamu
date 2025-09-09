/**
 * GameWorld orchestrates in-memory entity management, persistence, dirty tracking, and transactions.
 * Provides type safety, documentation, and robust error handling for all operations.
 */
import type { GameEntity } from '@entities/entity'
import { EntityStore } from '@entities/EntityStore'
import { EntityTracker } from '@tracking/EntityTracker'
import { EntityPersistence } from '@persistence/EntityPersistence'

export class GameWorld {
  // --- Private Fields ---
  private tracker = new EntityTracker()
  private store = new EntityStore(this.tracker)
  private persistence: EntityPersistence
  private loaded = false
  private autoFlushTimer?: ReturnType<typeof setInterval>

  /**
   * Create a new GameWorld with the given persistence file path.
   * @param filePath Path to the YAML file for persistence.
   */
  constructor(filePath: string) {
    if (!filePath) throw new Error('GameWorld: filePath is required.')
    this.persistence = new EntityPersistence(filePath)
  }

  // --- Public API ---

  /** Expose managers for advanced usage (read-only access) */
  get entityStore(): EntityStore {
    return this.store
  }
  get entityTracker(): EntityTracker {
    return this.tracker
  }
  get entityPersistence(): EntityPersistence {
    return this.persistence
  }

  /**
   * Subscribe to dirty entity events.
   * Usage: gameWorld.onEntityDirty(cb)
   */
  get onEntityDirty() {
    return this.tracker.onDirty.bind(this.tracker)
  }

  /**
   * Load all entities from persistence and initialize the world.
   * @throws if loading fails.
   */
  async load(): Promise<void> {
    try {
      const entities = await this.persistence.loadAsync()
      this.store.replaceAll(entities)
      this.tracker.clear()
      this.loaded = true
    } catch (err) {
      console.error('GameWorld: Failed to load entities:', err)
      throw new Error(`GameWorld: Failed to load entities: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * Reload all entities from persistence.
   */
  async reload(): Promise<void> {
    await this.load()
  }

  /**
   * Get an entity by id.
   * @throws if world is not loaded.
   */
  get<T extends GameEntity = GameEntity>(id: string): T | undefined {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before get().')
    return this.store.get(id) as T | undefined
  }

  /**
   * Add an entity to the world.
   * @throws if world is not loaded or entity is invalid.
   */
  add(entity: GameEntity): void {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before add().')
    this.store.add(entity)
    // No need to mark dirty here; proxy will do it on mutation
  }

  /**
   * Get all dirty entities.
   * @throws if world is not loaded.
   */
  getDirtyEntities(): GameEntity[] {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before getDirtyEntities().')
    const dirtyIds = this.tracker.getDirty()
    return dirtyIds.map((id) => this.store.get(id)).filter(Boolean) as GameEntity[]
  }

  /**
   * Flush all entities to persistence.
   * @throws if world is not loaded or flush fails.
   */
  async flush(): Promise<void> {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before flush().')
    try {
      const allEntities = this.store.getAll()
      await this.persistence.flushAsync(allEntities)
      this.tracker.clear()
    } catch (err) {
      console.error('GameWorld: Failed to flush entities:', err)
      throw new Error(`GameWorld: Failed to flush entities: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * Flush only dirty entities to persistence.
   * @throws if world is not loaded or flush fails.
   */
  async flushDirty(): Promise<void> {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before flushDirty().')
    try {
      const dirtyEntities = this.getDirtyEntities()
      await this.persistence.flushAsync(dirtyEntities)
      this.tracker.clear()
    } catch (err) {
      console.error('GameWorld: Failed to flush dirty entities:', err)
      throw new Error(`GameWorld: Failed to flush dirty entities: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // --- Transactional Methods ---

  /**
   * Begin a transaction (suspend dirty tracking and snapshot state).
   * @throws if world is not loaded.
   */
  beginTransaction(): void {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before beginTransaction().')
    this.tracker.suspend()
    this.store.snapshotState()
  }

  /**
   * Commit a transaction (resume dirty tracking and mark staged entities).
   * @throws if world is not loaded.
   */
  commitTransaction(): void {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before commitTransaction().')
    this.tracker.resumeAndMark()
  }

  /**
   * Rollback a transaction (restore last snapshot and clear dirty state).
   * @throws if world is not loaded.
   */
  rollback(): void {
    if (!this.loaded) throw new Error('GameWorld: Must call load() before rollback().')
    this.store.restoreSnapshot()
    this.tracker.clear() // Optionally clear dirty state for rolled-back changes
  }

  // --- Auto-Flush Methods ---

  /**
   * Start auto-flushing dirty entities at a given interval (ms).
   */
  startAutoFlush(intervalMs: number): void {
    if (this.autoFlushTimer) clearInterval(this.autoFlushTimer)
    this.autoFlushTimer = setInterval(() => {
      this.flushDirty().catch((err) => {
        console.error('GameWorld: Auto-flush failed:', err)
      })
    }, intervalMs)
  }

  /**
   * Stop auto-flushing.
   */
  stopAutoFlush(): void {
    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer)
      this.autoFlushTimer = undefined
    }
  }
}
