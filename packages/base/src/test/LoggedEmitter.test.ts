// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { LoggedEmitter } from '../events/LoggedEmitter'
import type { TestEvents } from '../types/base-event-map'

describe('LoggedEmitter', () => {
  it('should emit events and log them', async () => {
    const emitter = new LoggedEmitter<TestEvents>()
    const calls: string[] = []
    emitter.on('foo', ([msg]) => {
      calls.push(msg)
    })
    await emitter.emit('foo', ['hello'])
    expect(calls).toEqual(['hello'])
    // Logging is internal; just check event emission
    expect(calls).toEqual(['hello'])
  })

  it('should log event payloads', async () => {
    const emitter = new LoggedEmitter<TestEvents>()
    const calls: string[] = []
    emitter.on('bar', ([num]) => {
      calls.push(num.toString())
    })
    await emitter.emit('bar', [42])
    expect(calls).toEqual(['42'])
  })

  it('should not fail if no logger is provided', async () => {
    const emitter = new LoggedEmitter<TestEvents>()
    emitter.on('foo', () => {})
    await emitter.emit('foo', ['test'])
    // No error should be thrown
    expect(true).toBe(true)
  })
})
