import * as net from 'node:net'
import { describe, expect, it, vi } from 'vitest'
import { getClientsToKickByIP, kickExcessConnections } from '../kick-utils'

function makeSocket(ip: string): any {
  return { remoteAddress: ip }
}

describe('getClientsToKickByIP', () => {
  it('returns the newest excess clients for an IP', () => {
    const clients = new Map([
      ['c1', makeSocket('1.2.3.4')], // oldest
      ['c2', makeSocket('1.2.3.4')],
      ['c3', makeSocket('1.2.3.4')], // newest
      ['c4', makeSocket('5.6.7.8')]
    ])
    // If maxConnectionsPerIP is 1, excess is 2, should kick c2 and c3
    const toKick = getClientsToKickByIP(clients, '1.2.3.4', 2)
    console.log(
      'DEBUG toKick:',
      toKick.map(([id]) => id)
    )
    expect(toKick.map(([id]) => id)).toEqual(['c2', 'c3'])
  })

  it('returns empty array if no excess', () => {
    const clients = new Map([
      ['c1', makeSocket('1.2.3.4')],
      ['c2', makeSocket('5.6.7.8')]
    ])
    expect(getClientsToKickByIP(clients, '1.2.3.4', 0)).toEqual([])
  })

  it('returns only matching IPs', () => {
    const clients = new Map([
      ['c1', makeSocket('1.2.3.4')],
      ['c2', makeSocket('5.6.7.8')],
      ['c3', makeSocket('1.2.3.4')]
    ])
    const toKick = getClientsToKickByIP(clients, '1.2.3.4', 1)
    expect(toKick.map(([id]) => id)).toEqual(['c3'])
  })
})

describe('kickExcessConnections', () => {
  it('kicks the newest excess clients and emits disconnect', () => {
    const clients = new Map([
      [
        'c1',
        { remoteAddress: '1.2.3.4', end: vi.fn() } as unknown as net.Socket
      ], // oldest
      [
        'c2',
        { remoteAddress: '1.2.3.4', end: vi.fn() } as unknown as net.Socket
      ],
      [
        'c3',
        { remoteAddress: '1.2.3.4', end: vi.fn() } as unknown as net.Socket
      ], // newest
      [
        'c4',
        { remoteAddress: '5.6.7.8', end: vi.fn() } as unknown as net.Socket
      ]
    ])
    const stats = {
      total: 4,
      byIP: new Map([
        ['1.2.3.4', 3],
        ['5.6.7.8', 1]
      ]),
      limits: { maxConnections: 10, maxConnectionsPerIP: 1 },
      canAcceptNew: true
    }
    const disconnect = vi.fn()
    const result = kickExcessConnections(clients, stats, disconnect)
    expect(result.kicked).toBe(2)
    expect(result.clientIds).toEqual(['c2', 'c3'])
    expect(disconnect).toHaveBeenCalledTimes(2)
    expect(disconnect.mock.calls.map(([id]) => id)).toEqual(['c2', 'c3'])
    expect(clients.has('c2')).toBe(false)
    expect(clients.has('c3')).toBe(false)
    expect(clients.has('c1')).toBe(true)
  })

  it('does nothing if no excess', () => {
    const clients = new Map([
      [
        'c1',
        { remoteAddress: '1.2.3.4', end: vi.fn() } as unknown as net.Socket
      ],
      [
        'c2',
        { remoteAddress: '5.6.7.8', end: vi.fn() } as unknown as net.Socket
      ]
    ])
    const stats = {
      total: 2,
      byIP: new Map([
        ['1.2.3.4', 1],
        ['5.6.7.8', 1]
      ]),
      limits: { maxConnections: 10, maxConnectionsPerIP: 1 },
      canAcceptNew: true
    }
    const disconnect = vi.fn()
    const kicked = kickExcessConnections(clients, stats, disconnect)
    expect(kicked.kicked).toBe(0)
    expect(disconnect).not.toHaveBeenCalled()
    expect(clients.size).toBe(2)
  })
})
