// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { SafeEmitter } from '../events/SafeEmitter'
import type { BaseEventMap } from '../types/base-event-map'

type TestEvents = BaseEventMap & {
  foo: [string]
  bar: [number]
}

describe('SafeEmitter', () => {
  it('should emit events to listeners', async () => {
    const emitter = new SafeEmitter<TestEvents>()
    const calls: string[] = []
    emitter.on('foo', ([msg]) => {
      calls.push(msg)
    })
    await emitter.emit('foo', ['hello'])
    expect(calls).toEqual(['hello'])
  })

  it('should handle errors in listeners safely', async () => {
    const emitter = new SafeEmitter<TestEvents>()
    let errorCaught = false
    emitter.on('foo', () => {
      throw new Error('fail')
    })
    try {
      await emitter.emit('foo', ['test'])
    } catch {
      errorCaught = true
    }
    expect(errorCaught).toBe(true)
  })

  it('should remove listeners', async () => {
    const emitter = new SafeEmitter<TestEvents>()
    const calls: string[] = []
    const unsub = emitter.on('foo', ([msg]) => {
      calls.push(msg)
    })
    unsub()
    await emitter.emit('foo', ['bye'])
    expect(calls).toEqual([])
  })

  it('should emit events with no args', async () => {
    const emitter = new SafeEmitter<{ ping: [] }>()
    let called = false
    emitter.on('ping', () => {
      called = true
    })
    await emitter.emit('ping')
    expect(called).toBe(true)
  })
})
