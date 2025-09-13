import { describe, expect, it } from 'vitest'
import { DirtyTracker } from '../gameworld/dirty-tracker'

describe('DirtyTracker', () => {
  it('marks and checks dirty entities', () => {
    const tracker = new DirtyTracker()
    tracker.markDirty('a')
    expect(tracker.isDirty('a')).toBe(true)
    expect(tracker.isDirty('b')).toBe(false)
  })

  it('clears dirty flag for an entity', () => {
    const tracker = new DirtyTracker()
    tracker.markDirty('a')
    tracker.clear('a')
    expect(tracker.isDirty('a')).toBe(false)
  })

  it('returns all dirty entity IDs', () => {
    const tracker = new DirtyTracker()
    tracker.markDirty('a')
    tracker.markDirty('b')
    expect(tracker.getAll().sort()).toEqual(['a', 'b'])
  })

  it('clears all dirty flags', () => {
    const tracker = new DirtyTracker()
    tracker.markDirty('a')
    tracker.markDirty('b')
    tracker.clearAll()
    expect(tracker.getAll()).toEqual([])
  })
})
