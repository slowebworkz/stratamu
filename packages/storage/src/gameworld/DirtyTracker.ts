/**
 * DirtyTracker manages the set of entity IDs with unsaved (dirty) changes.
 * Patterned after ConnectionManager for modularity and testability.
 */
export class DirtyTracker {
  private dirtyEntities = new Set<string>()

  /** Mark an entity as dirty (changed). */
  markDirty(id: string) {
    this.dirtyEntities.add(id)
  }

  /** Clear the dirty flag for an entity. */
  clear(id: string) {
    this.dirtyEntities.delete(id)
  }

  /** Get all dirty entity IDs. */
  getAll(): string[] {
    return Array.from(this.dirtyEntities)
  }

  /** Clear all dirty flags. */
  clearAll() {
    this.dirtyEntities.clear()
  }

  /** Check if an entity is dirty. */
  isDirty(id: string): boolean {
    return this.dirtyEntities.has(id)
  }
}
