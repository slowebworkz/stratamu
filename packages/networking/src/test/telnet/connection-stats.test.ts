import * as net from 'node:net'
import { describe, expect, it } from 'vitest'
import {
  getConnectionInfo,
  getConnectionStats
} from '../../telnet/connection-stats'

describe('connection-stats', () => {
  it('gets connection info', () => {
    const mockSocket = {
      destroy: () => {},
      end: () => {}
    } as unknown as net.Socket
    const cm = {
      getConnectionInfo: (id: string) => ({
        ip: '1.2.3.4',
        port: 1234,
        connected: new Date()
      }),
      getClient: () => mockSocket
    }
    const info = getConnectionInfo(cm, 'c1')
    expect(info?.ip).toBe('1.2.3.4')
  })

  it('gets connection stats', () => {
    const cm = {
      getActiveConnections: () => 2,
      getConnectionsByIP: () => new Map([['1.2.3.4', 2]]),
      getConnectionLimits: () => ({
        maxConnections: 10,
        maxConnectionsPerIP: 5
      })
    }
    const stats = getConnectionStats(cm)
    expect(stats.total).toBe(2)
    expect(stats.byIP.get('1.2.3.4')).toBe(2)
    expect(stats.limits.maxConnections).toBe(10)
    expect(stats.canAcceptNew).toBe(true)
  })
})
