import { emitEvent, registerHandler } from '../index'
import { describe, expect, it } from 'vitest'

describe('event-utils', () => {
  it('registers and emits events', () => {
    const handlers: any = {}
    let called = false
    registerHandler(handlers, 'connect', () => {
      called = true
    })
    emitEvent(handlers, 'connect', undefined)
    expect(called).toBe(true)
  })
})
