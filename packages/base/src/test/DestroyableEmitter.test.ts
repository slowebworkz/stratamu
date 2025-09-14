// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { DestroyableEmitter } from '../events/DestroyableEmitter'
import type { TestEvents } from '../types/base-event-map'

describe('DestroyableEmitter', () => {
  it('should emit events before destruction', async () => {
    const emitter = new DestroyableEmitter<TestEvents>()
    const calls: string[] = []

    emitter.on('foo', ([msg]) => {
      calls.push(msg)
    })
    await emitter.emitSafe('foo', ['hello'])
    expect(calls).toEqual(['hello'])
  })

  it('should not emit events after destruction', async () => {
    const emitter = new DestroyableEmitter<TestEvents>()
    const calls: string[] = []

    emitter.on('foo', ([msg]) => {
      calls.push(msg)
    })
    emitter.destroy()
    await emitter.emitSafe('foo', ['world'])
    expect(calls).toEqual([])
  })
})
