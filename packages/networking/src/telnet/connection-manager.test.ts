import { describe, it, expect } from 'vitest'
import { ConnectionManager } from './connection-manager'

const limits = { maxConnections: 2, maxConnectionsPerIP: 1 }

describe('ConnectionManager', () => {
  it('should add and remove clients', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket = { remoteAddress: '127.0.0.1' } as any
    manager.addClient('client1', fakeSocket)
    expect(manager.getClient('client1')).toBe(fakeSocket)
    manager.removeClient('client1')
    expect(manager.getClient('client1')).toBeUndefined()
  })

  it('should enforce maxConnections', () => {
    const manager = new ConnectionManager({
      maxConnections: 1,
      maxConnectionsPerIP: 1
    })
    const fakeSocket1 = { remoteAddress: '127.0.0.1' } as any
    const fakeSocket2 = { remoteAddress: '127.0.0.2' } as any
    manager.addClient('client1', fakeSocket1)
    expect(
      manager.canAcceptConnection(manager.getActiveConnections(), '127.0.0.2')
    ).toBe(false)
  })

  it('should enforce maxConnectionsPerIP', () => {
    const manager = new ConnectionManager({
      maxConnections: 2,
      maxConnectionsPerIP: 1
    })
    const fakeSocket1 = { remoteAddress: '127.0.0.1' } as any
    const fakeSocket2 = { remoteAddress: '127.0.0.1' } as any
    manager.addClient('client1', fakeSocket1)
    expect(
      manager.canAcceptConnection(manager.getActiveConnections(), '127.0.0.1')
    ).toBe(false)
  })
})
