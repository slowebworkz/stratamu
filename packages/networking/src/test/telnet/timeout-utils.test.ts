import * as net from 'node:net'
import { describe, expect, it } from 'vitest'
import { IdleTimeoutManager } from '../../shared'
import { setIdleTimeout } from '../../telnet/timeout-utils'

describe('timeout-utils', () => {
  it('sets idle timeout and calls callback', async () => {
    const idle = new IdleTimeoutManager()
    let called = false
    idle.set = (id, ms, cb) => {
      cb()
      called = true
    }
    // Provide a mock net.Socket
    const mockSocket = {
      destroy: () => {},
      end: () => {}
    } as unknown as net.Socket
    setIdleTimeout(idle, { getClient: () => mockSocket }, 'c1', 100, () => {})
    expect(called).toBe(true)
  })
})
