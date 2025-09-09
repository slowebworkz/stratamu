/**
 * Tracks which entities have unsaved (dirty) changes in memory.
 * Useful for in-memory + YAML storage strategies.
 */
export interface DirtyEntityTracker {
  /** Set of entity IDs with unsaved changes. */
  dirtyEntities: Set<string>
  /** Mark an entity as dirty (changed). */
  markDirty(id: string): void
  /** Clear the dirty flag for an entity (after flush/save). */
  clear(id: string): void
}

/**
 * Simple implementation of DirtyEntityTracker.
 */
export class SimpleDirtyEntityTracker implements DirtyEntityTracker {
  dirtyEntities = new Set<string>()

  markDirty(id: string) {
    this.dirtyEntities.add(id)
  }

  clear(id: string) {
    this.dirtyEntities.delete(id)
  }
}
