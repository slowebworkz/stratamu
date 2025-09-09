import * as net from 'node:net'
import { describe, expect, it } from 'vitest'
import { IdleTimeoutManager } from '../shared/idle-timeout-manager'
import { setIdleTimeout } from '../telnet/timeout-utils'

describe('timeout-utils', () => {
  it('sets idle timeout and calls callback', async () => {
    const idle = new IdleTimeoutManager()
    let called = false
    idle.set = (id: string, ms: number, cb: () => void): void => {
      cb()
      called = true
    }
    // Provide a mock net.Socket
    const mockSocket: net.Socket = {
      destroy: () => {},
      end: () => {}
    } as net.Socket
    setIdleTimeout(
      idle,
      { getClient: (): net.Socket => mockSocket },
      'c1',
      100,
      () => {}
    )
    expect(called).toBe(true)
  })
})
