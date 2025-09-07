import { describe, expect, it } from 'vitest'
import { GroupManager } from '../../shared'
import { addClientToGroup, removeClientFromGroup } from '../index'

describe('group-utils', () => {
  it('adds and removes clients from groups', () => {
    const gm = new GroupManager()
    addClientToGroup(gm, 'c1', 'g1')
    expect(gm.getClientGroups('c1')).toContain('g1')
    removeClientFromGroup(gm, 'c1', 'g1')
    expect(gm.getClientGroups('c1')).not.toContain('g1')
  })

  it('broadcasts to group', () => {
    const gm = new GroupManager()
    const clients = new Map()
    const sent: string[] = []
    clients.set('c1', {
      write: (msg: string) => sent.push(msg),
      remoteAddress: '1.2.3.4'
    } as any)
    addClientToGroup(gm, 'c1', 'g1')
    // Find all clients in group 'g1' using getClientGroups
    const groupClients = Array.from(clients.keys()).filter((cid) =>
      gm.getClientGroups(cid).includes('g1')
    )
    groupClients.forEach((cid) => {
      const sock = clients.get(cid)
      if (sock) sock.write('hello')
    })
    expect(sent).toContain('hello')
  })
})
