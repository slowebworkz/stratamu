import { describe, expect, it, vi } from 'vitest'
import type { EntityMap, GameEntity } from '../entities/entity'
import { addEntity } from '../gameworld/addEntity'

// Helper: minimal valid GameEntity for tests
const baseEntity: Partial<GameEntity> = {
  id: '1',
  name: 'Test',
  type: 'item',
  createdAt: 0,
  updatedAt: 0,
  attributes: {}
}

describe('addEntity', () => {
  it('adds a new entity, tracks it, and marks it dirty', () => {
    const entities: EntityMap = new Map()
    const entity: Partial<GameEntity> = { ...baseEntity, id: '1' }
    const tracker = { markDirty: vi.fn() }
    const trackEntity = vi.fn((e) => ({ ...e, tracked: true }))

    addEntity(entities, entity as GameEntity, tracker, trackEntity)

    expect(entities.size).toBe(1)
    const stored = entities.get('1') as any
    expect(stored).toBeDefined()
    expect(stored.tracked).toBe(true)
    expect(typeof stored.createdAt).toBe('number')
    expect(typeof stored.updatedAt).toBe('number')
    expect(tracker.markDirty).toHaveBeenCalledWith('1')
    expect(trackEntity).toHaveBeenCalledWith(entity, tracker)
  })

  it('overwrites an existing entity with the same id', () => {
    const entities: EntityMap = new Map([
      ['1', { ...baseEntity, id: '1', name: 'Old' } as GameEntity]
    ])
    const entity: Partial<GameEntity> = { ...baseEntity, id: '1', name: 'New' }
    const tracker = { markDirty: vi.fn() }
    const trackEntity = vi.fn((e) => ({ ...e, tracked: true }))

    addEntity(entities, entity as GameEntity, tracker, trackEntity)

    expect(entities.size).toBe(1)
    const stored = entities.get('1') as any
    expect(stored.name).toBe('New')
    expect(stored.tracked).toBe(true)
    expect(tracker.markDirty).toHaveBeenCalledWith('1')
  })

  it('throws if entity is missing id', () => {
    const entities: EntityMap = new Map()
    const entity = { ...baseEntity } as any
    delete entity.id
    const tracker = { markDirty: vi.fn() }
    const trackEntity = vi.fn((e) => ({ ...e, tracked: true }))

    expect(() => addEntity(entities, entity, tracker, trackEntity)).toThrow()
  })

  it('throws if tracker.markDirty is not a function', () => {
    const entities: EntityMap = new Map()
    const entity: Partial<GameEntity> = { ...baseEntity, id: '2' }
    const tracker = { markDirty: undefined }
    const trackEntity = vi.fn((e) => ({ ...e, tracked: true }))

    expect(() =>
      addEntity(entities, entity as GameEntity, tracker as any, trackEntity)
    ).toThrow()
  })

  it('throws if trackEntity is not a function', () => {
    const entities: EntityMap = new Map()
    const entity: Partial<GameEntity> = { ...baseEntity, id: '3' }
    const tracker = { markDirty: vi.fn() }
    const trackEntity = undefined

    expect(() =>
      addEntity(entities, entity as GameEntity, tracker, trackEntity as any)
    ).toThrow()
  })

  it('sets createdAt and updatedAt to the same value', () => {
    const entities: EntityMap = new Map()
    const entity: Partial<GameEntity> = { ...baseEntity, id: '4' }
    const tracker = { markDirty: vi.fn() }
    const trackEntity = vi.fn((e) => ({ ...e }))

    addEntity(entities, entity as GameEntity, tracker, trackEntity)
    const stored = entities.get('4') as GameEntity
    expect(stored.createdAt).toBe(stored.updatedAt)
  })
})
