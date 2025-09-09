/**
 * EntityStore manages the in-memory map of entities, with support for dirty tracking and transactional snapshots.
 * Provides type safety and error handling for all operations.
 */
import type { GameEntity } from '@entities/entity'

export class EntityStore {
  private entities = new Map<string, GameEntity>()
  private snapshot?: Map<string, GameEntity>
  private tracker?: { markDirty(entity: GameEntity): void }

  /**
   * Create a new EntityStore.
   * @param tracker Optional dirty tracker for change notification.
   */
  constructor(tracker?: { markDirty(entity: GameEntity): void }) {
    this.tracker = tracker
  }

  /**
   * Wrap an entity in a Proxy to mark as dirty on mutation.
   */
  private proxify(entity: GameEntity): GameEntity {
    if (!this.tracker) return entity
    const tracker = this.tracker
    return new Proxy(entity, {
      set(target, prop, value, receiver) {
        const result = Reflect.set(target, prop, value, receiver)
        tracker.markDirty(target)
        return result
      }
    })
  }

  /**
   * Add an entity to the store.
   * @throws if entity is missing an id.
   */
  add(entity: GameEntity): void {
    if (!entity?.id) throw new Error('EntityStore: Cannot add entity without id.')
    this.entities.set(entity.id, this.proxify(entity))
  }

  /**
   * Get an entity by id.
   */
  get(id: string): GameEntity | undefined {
    if (!id) throw new Error('EntityStore: id is required for get().')
    return this.entities.get(id)
  }

  /**
   * Delete an entity by id.
   */
  delete(id: string): void {
    if (!id) throw new Error('EntityStore: id is required for delete().')
    this.entities.delete(id)
  }

  /**
   * Get all entities in the store.
   */
  getAll(): GameEntity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Replace all entities in the store.
   */
  replaceAll(entities: GameEntity[]): void {
    this.entities.clear()
    for (const e of entities) {
      if (!e?.id) throw new Error('EntityStore: Cannot replace with entity missing id.')
      this.entities.set(e.id, this.proxify(e))
    }
  }

  /**
   * Take a snapshot of the current state for transaction rollback.
   */
  snapshotState(): void {
    this.snapshot = new Map(this.entities)
  }

  /**
   * Restore the last snapshot (transaction rollback).
   */
  restoreSnapshot(): void {
    if (this.snapshot) {
      this.entities = new Map(this.snapshot)
      this.snapshot = undefined
    }
  }
}
