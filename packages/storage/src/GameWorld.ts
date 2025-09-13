// ...existing code...

// ...existing code...
/**
 * GameWorld orchestrates in-memory entity management, persistence, dirty tracking, and transactions.
 * Provides type safety, documentation, and robust error handling for all operations.
 */

import { AutoFlushManager } from '@/auto-flush'
import type { GameEntity } from '@entities/entity'
import { EntityStore } from '@entities/EntityStore'
import { EntityPersistence } from '@persistence/EntityPersistence'
import { EntityTracker } from '@tracking/EntityTracker'

export class GameWorld {
  // --- Core State ---
  private tracker: EntityTracker
  private store: EntityStore
  private persistence: EntityPersistence
  private loaded = false

  // --- Auto-Flush State ---
  private autoFlush: AutoFlushManager
  private autoFlushStarted = false

  // --- Flush Monitoring ---
  private lastFlushTime: number | null = null
  private lastFlushDirtyTime: number | null = null
  private flushWarningThresholdMs = 120_000 // 2 minutes default

  // --- Event Hooks ---
  private flushListeners: Array<() => void | Promise<void>> = []
  private flushDirtyListeners: Array<() => void | Promise<void>> = []

  /**
   * Subscribe to the onFlush event (called after a full flush).
   */
  onFlush(listener: () => void | Promise<void>): void {
    this.flushListeners.push(listener)
  }

  /**
   * Subscribe to the onFlushDirty event (called after a dirty flush).
   */
  onFlushDirty(listener: () => void | Promise<void>): void {
    this.flushDirtyListeners.push(listener)
  }

  private async emitFlush(): Promise<void> {
    await Promise.all(
      this.flushListeners.map((fn) =>
        Promise.resolve().then(() => {
          try {
            return fn()
          } catch (err) {
            console.error('Flush listener failed:', err)
          }
        })
      )
    )
  }

  private async emitFlushDirty(): Promise<void> {
    await Promise.all(
      this.flushDirtyListeners.map((fn) =>
        Promise.resolve().then(() => {
          try {
            return fn()
          } catch (err) {
            console.error('FlushDirty listener failed:', err)
          }
        })
      )
    )
  }

  /**
   * Create a new GameWorld with the given persistence file path.
   * @param filePath Path to the YAML file for persistence.
   */
  constructor(filePath: string) {
    if (!filePath) throw new Error('GameWorld: filePath is required.')
    this.tracker = new EntityTracker()
    this.store = new EntityStore(this.tracker)
    this.persistence = new EntityPersistence(filePath)
    this.autoFlush = new AutoFlushManager()
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

  // --- Public API: Events ---
  /** Subscribe to dirty entity events. Usage: gameWorld.onEntityDirty(cb) */
  get onEntityDirty() {
    return this.tracker.onDirty.bind(this.tracker)
  }

  // --- Public API: Persistence ---
  /** Load all entities from persistence and initialize the world. */
  async load(): Promise<void> {
    try {
      const entities = await this.persistence.loadAsync()
      this.store.replaceAll(entities)
      this.tracker.clear()
      this.loaded = true
    } catch (err) {
      console.error('GameWorld: Failed to load entities:', err)
      throw new Error(
        `GameWorld: Failed to load entities: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  /** Reload all entities from persistence. */
  async reload(): Promise<void> {
    await this.load()
  }

  /** Get an entity by id. */
  get<T extends GameEntity = GameEntity>(id: string): T | undefined {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before get().')
    return this.store.get(id) as T | undefined
  }

  /** Add an entity to the world. */
  add(entity: GameEntity): void {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before add().')
    this.store.add(entity)
    // No need to mark dirty here; proxy will do it on mutation
  }

  /** Get all dirty entities. */
  getDirtyEntities(): GameEntity[] {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before getDirtyEntities().')
    const dirtyIds = this.tracker.getDirty()
    return dirtyIds
      .map((id) => this.store.get(id))
      .filter(Boolean) as GameEntity[]
  }

  /** Flush all entities to persistence. Emits onFlush after success. Performs consistency checks. Tracks last flush time. */
  async flush(): Promise<void> {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before flush().')
    try {
      let allEntities = this.store.getAll()
      // Consistency: filter out invalid or duplicate IDs
      const seen = new Set<string>()
      const validEntities: GameEntity[] = []
      for (const entity of allEntities) {
        if (!entity || typeof entity.id !== 'string') {
          console.warn('flush: Skipping invalid entity:', entity)
          continue
        }
        if (seen.has(entity.id)) {
          console.warn(
            'flush: Duplicate entity id detected, skipping:',
            entity.id
          )
          continue
        }
        seen.add(entity.id)
        validEntities.push(entity)
      }
      const now = Date.now()
      if (
        this.lastFlushTime &&
        now - this.lastFlushTime > this.flushWarningThresholdMs
      ) {
        console.warn(
          `Flush interval exceeded threshold: ${((now - this.lastFlushTime) / 1000).toFixed(1)}s since last successful flush.`
        )
      }
      const start = now
      await this.persistence.flushAsync(validEntities)
      const duration = Date.now() - start
      console.log(`Flushed ${validEntities.length} entities in ${duration}ms`)
      this.lastFlushTime = Date.now()
      this.tracker.clear()
      await this.emitFlush()
    } catch (err) {
      console.error('GameWorld: Failed to flush entities:', err)
      throw new Error(
        `GameWorld: Failed to flush entities: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  /**
   * Flush only dirty entities to persistence, in batches. Emits onFlushDirty after success.
   * @param batchSize Maximum number of entities to flush per batch (default: 100)
   */
  /**
   * Flush only dirty entities to persistence, in batches. Emits onFlushDirty after success.
   * Tracks last dirty flush time and warns if interval exceeds threshold.
   * @param batchSize Maximum number of entities to flush per batch (default: 100)
   */
  async flushDirty(batchSize = 100): Promise<void> {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before flushDirty().')
    try {
      const dirtyEntities = this.getDirtyEntities()
      // Consistency: filter out invalid or duplicate IDs in this batch
      const seen = new Set<string>()
      const validEntities: GameEntity[] = []
      for (const entity of dirtyEntities) {
        if (!entity || typeof entity.id !== 'string') {
          console.warn('flushDirty: Skipping invalid entity:', entity)
          continue
        }
        if (seen.has(entity.id)) {
          console.warn(
            'flushDirty: Duplicate entity id detected, skipping:',
            entity.id
          )
          continue
        }
        seen.add(entity.id)
        validEntities.push(entity)
      }
      const now = Date.now()
      if (
        this.lastFlushDirtyTime &&
        now - this.lastFlushDirtyTime > this.flushWarningThresholdMs
      ) {
        console.warn(
          `Dirty flush interval exceeded threshold: ${((now - this.lastFlushDirtyTime) / 1000).toFixed(1)}s since last successful dirty flush.`
        )
      }
      let totalFlushed = 0
      const start = now
      for (let i = 0; i < validEntities.length; i += batchSize) {
        const batch = validEntities.slice(i, i + batchSize)
        await this.persistence.flushAsync(batch)
        totalFlushed += batch.length
      }
      const duration = Date.now() - start
      console.log(`Flushed ${totalFlushed} dirty entities in ${duration}ms`)
      this.lastFlushDirtyTime = Date.now()
      this.tracker.clear()
      await this.emitFlushDirty()
    } catch (err) {
      console.error('GameWorld: Failed to flush dirty entities:', err)
      throw new Error(
        `GameWorld: Failed to flush dirty entities: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // --- Public API: Transactions ---
  /** Begin a transaction (suspend dirty tracking and snapshot state). */
  beginTransaction(): void {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before beginTransaction().')
    this.tracker.suspend()
    this.store.snapshotState()
  }

  /** Commit a transaction (resume dirty tracking and mark staged entities). */
  commitTransaction(): void {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before commitTransaction().')
    this.tracker.resumeAndMark()
  }

  /** Rollback a transaction (restore last snapshot and clear dirty state). */
  rollback(): void {
    if (!this.loaded)
      throw new Error('GameWorld: Must call load() before rollback().')
    this.store.restoreSnapshot()
    this.tracker.clear() // Optionally clear dirty state for rolled-back changes
  }

  // --- Public API: Auto-Flush ---

  // ...existing code...

  /**
   * Start auto-flushing dirty entities at a given interval (ms). Idempotent.
   * Optionally flush immediately before starting the interval.
   *
   * ## Recommended intervals for MUD/MUSH:
   * - Small world (10–50 players): 10–15 seconds
   * - Medium (50–200): 20–30 seconds
   * - Large (200+): 30–60 seconds
   *
   * Always use flushOnStop = true to avoid losing data on crashes.
   */
  startAutoFlush(
    intervalMs: number,
    flushImmediately = true,
    batchSize = 100
  ): void {
    if (this.autoFlushStarted) return
    this.autoFlushStarted = true
    if (flushImmediately) void this.flushDirty(batchSize).catch(console.error)
    this.autoFlush.start(
      () => this.flushDirty(batchSize).catch(console.error),
      intervalMs
    )
  }

  /**
   * Stop auto-flushing and optionally flush all entities one last time. Idempotent.
   * Ensures no overlap: waits for any in-flight flush to finish before final flush.
   */
  async stopAutoFlush(flushOnStop = true): Promise<void> {
    if (!this.autoFlushStarted) return
    this.autoFlushStarted = false
    // Wait for any in-flight flush to finish
    await this.autoFlush.stop()
    // Now do the final flush if requested
    if (flushOnStop) {
      try {
        await this.flush()
      } catch (err) {
        console.error('Final flush failed:', err)
      }
    }
  }

  /** Manually trigger a flush of dirty entities (for admin/debug). */
  async flushNow(batchSize = 100): Promise<void> {
    await this.flushDirty(batchSize).catch(console.error)
  }
}
