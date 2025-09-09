import * as net from 'node:net'
import { describe, expect, it } from 'vitest'
import { ConnectionManager } from '../../telnet/connection-manager'

const limits = { maxConnections: 2, maxConnectionsPerIP: 1 }

describe('ConnectionManager', () => {
  it('should add and remove clients', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
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
    const fakeSocket1 = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
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
    const fakeSocket1 = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
    manager.addClient('client1', fakeSocket1)
    expect(
      manager.canAcceptConnection(manager.getActiveConnections(), '127.0.0.1')
    ).toBe(false)
  })

  it('should return all clients', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket1 = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
    const fakeSocket2 = {
      remoteAddress: '127.0.0.2',
      destroySoon: () => {}
    } as net.Socket
    manager.addClient('client1', fakeSocket1)
    manager.addClient('client2', fakeSocket2)
    const allClients = manager.getAllClients()
    expect(allClients.size).toBe(2)
    expect(allClients.get('client1')).toBe(fakeSocket1)
    expect(allClients.get('client2')).toBe(fakeSocket2)
  })

  it('should return connection info', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket = {
      remoteAddress: '127.0.0.1',
      remotePort: 1234,
      destroySoon: () => {}
    } as net.Socket
    manager.addClient('client1', fakeSocket)
    const info = manager.getConnectionInfo('client1')
    expect(info).toMatchObject({ ip: '127.0.0.1', port: 1234 })
    expect(info?.connected).toBeInstanceOf(Date)
    expect(manager.getConnectionInfo('unknown')).toBeNull()
  })

  it('should return connections by IP', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket1 = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
    const fakeSocket2 = {
      remoteAddress: '127.0.0.2',
      destroySoon: () => {}
    } as net.Socket
    manager.addClient('client1', fakeSocket1)
    manager.addClient('client2', fakeSocket2)
    const byIP = manager.getConnectionsByIP()
    expect(byIP.get('127.0.0.1')).toBe(1)
    expect(byIP.get('127.0.0.2')).toBe(1)
  })

  it('should clear all clients and connections', () => {
    const manager = new ConnectionManager(limits)
    const fakeSocket1 = {
      remoteAddress: '127.0.0.1',
      destroySoon: () => {}
    } as net.Socket
    manager.addClient('client1', fakeSocket1)
    manager.clear()
    expect(manager.getAllClients().size).toBe(0)
    expect(manager.getConnectionsByIP().size).toBe(0)
    expect(manager.getConnectionInfo('client1')).toBeNull()
  })
})
