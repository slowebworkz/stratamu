// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { FilteredPriorityEmitter } from '../events/FilteredPriorityEmitter'
import type { TestEvents } from '../types/base-event-map'

describe('FilteredPriorityEmitter', () => {
  it('calls priority listeners in order', async () => {
    const emitter = new FilteredPriorityEmitter<TestEvents>()
    const calls: string[] = []

    emitter.onWithOptions(
      'foo',
      (msg) => {
        void calls.push('low:' + msg)
      },
      { priority: 1 }
    )

    emitter.onWithOptions(
      'foo',
      (msg) => {
        void calls.push('high:' + msg)
      },
      { priority: 10 }
    )

    await emitter.emitWithPriority('foo', ['test'])

    expect(calls).toEqual(['high:test', 'low:test'])
  })

  it('filters listeners correctly', async () => {
    const emitter = new FilteredPriorityEmitter<TestEvents>()
    const calls: string[] = []

    emitter.onWithOptions(
      'foo',
      ([msg]) => {
        void calls.push(msg)
      },
      { filter: ([msg]) => msg === 'ok' }
    )

    await emitter.emitWithPriority('foo', ['fail'])
    await emitter.emitWithPriority('foo', ['ok'])
    expect(calls).toEqual(['ok'])
  })

  it('removes priority listeners', async () => {
    const emitter = new FilteredPriorityEmitter<TestEvents>()
    const calls: string[] = []

    emitter.onWithOptions(
      'foo',
      ([msg]) => {
        void calls.push(msg)
      },
      { priority: 5 }
    )
    emitter.clearPriorityListeners()

    await emitter.emitWithPriority('foo', ['gone'])
    expect(calls).toEqual([])
  })

  it('still calls normal Emittery listeners after priority', async () => {
    const emitter = new FilteredPriorityEmitter<TestEvents>()
    const calls: string[] = []

    emitter.onWithOptions(
      'foo',
      (msg) => {
        void calls.push('priority:' + msg)
      },
      { priority: 2 }
    )

    emitter.onWithOptions('foo', ([msg]) => {
      void calls.push('normal:' + msg)
    })

    await emitter.emitWithPriority('foo', ['mix'])
    expect(calls).toEqual(['priority:mix', 'normal:mix'])
  })
})
