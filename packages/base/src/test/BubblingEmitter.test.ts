// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { BubblingEmitter } from '../events/BubblingEmitter'
import type { TestEvents } from '../types/base-event-map'

describe('BubblingEmitter', () => {
  it('should bubble events to parent emitter', async () => {
    const parent = new BubblingEmitter<TestEvents>()
    const child = new BubblingEmitter<TestEvents>(parent)
    const calls: string[] = []

    parent.on('foo', ([msg]) => {
      calls.push('parent:' + msg)
    })
    child.on('foo', ([msg]) => {
      calls.push('child:' + msg)
    })
    child.enableBubble('foo')

    await child.emitWithBubble('foo', ['bubble'])
    expect(calls).toEqual(['child:bubble', 'parent:bubble'])
  })

  it('should not bubble if disabled', async () => {
    const parent = new BubblingEmitter<TestEvents>()
    const child = new BubblingEmitter<TestEvents>(parent)
    const calls: string[] = []

    parent.on('foo', ([msg]) => {
      calls.push('parent:' + msg)
    })
    child.on('foo', ([msg]) => {
      calls.push('child:' + msg)
    })
    child.disableBubble('foo')

    await child.emitWithBubble('foo', ['bubble'])
    expect(calls).toEqual(['child:bubble'])
  })

  it('should enable bubbling for specific events', async () => {
    const parent = new BubblingEmitter<TestEvents>()
    const child = new BubblingEmitter<TestEvents>(parent)
    const calls: string[] = []

    parent.on('bar', ([num]) => {
      calls.push('parent:' + num)
    })
    child.on('bar', ([num]) => {
      calls.push('child:' + num)
    })
    child.enableBubble('bar')

    await child.emitWithBubble('bar', [42])
    expect(calls).toEqual(['child:42', 'parent:42'])
  })
})
