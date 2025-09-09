/**
 * EntityTracker manages dirty state for entities and supports event subscriptions.
 * Ensures transactional safety and extensibility for advanced use cases.
 */
import type { GameEntity } from '@entities/entity'
import { DirtyTracker } from '@gameworld/DirtyTracker'

export type EntityId = string

export class EntityTracker {
  private tracker = new DirtyTracker()
  private suspended = false
  private staged: Set<EntityId> = new Set()
  private dirtyListeners: Array<(entityId: EntityId) => void> = []

  /**
   * Mark an entity as dirty. If suspended, stage the change for later commit.
   * @param entity The entity to mark as dirty.
   */
  markDirty(entity: GameEntity): void {
    if (!entity?.id) throw new Error('EntityTracker: Cannot mark dirty, entity is missing id.')
    if (this.suspended) {
      this.staged.add(entity.id)
    } else {
      this.tracker.markDirty(entity.id)
      this.dirtyListeners.forEach((cb) => cb(entity.id))
    }
  }

  /**
   * Subscribe to dirty entity events.
   * @param callback Function called with the entityId when an entity is marked dirty.
   * @returns Unsubscribe function.
   */
  onDirty(callback: (entityId: EntityId) => void): () => void {
    if (typeof callback !== 'function') throw new TypeError('EntityTracker: onDirty callback must be a function')
    this.dirtyListeners.push(callback)
    return () => {
      const idx = this.dirtyListeners.indexOf(callback)
      if (idx !== -1) this.dirtyListeners.splice(idx, 1)
    }
  }

  /**
   * Check if an entity is dirty.
   * @param entity The entity to check.
   */
  isDirty(entity: GameEntity): boolean {
    if (!entity?.id) throw new Error('EntityTracker: Cannot check dirty, entity is missing id.')
    return this.tracker.isDirty(entity.id)
  }

  /**
   * Get all dirty entity IDs.
   */
  getDirty(): EntityId[] {
    return this.tracker.getAll()
  }

  /**
   * Clear all dirty state.
   */
  clear(): void {
    this.tracker.clearAll()
  }

  /**
   * Suspend dirty tracking (for transactions).
   */
  suspend(): void {
    this.suspended = true
    this.staged.clear()
  }

  /**
   * Resume dirty tracking and mark all staged entities as dirty.
   */
  resumeAndMark(): void {
    this.suspended = false
    for (const id of this.staged) {
      this.tracker.markDirty(id)
    }
    this.staged.clear()
  }
}
