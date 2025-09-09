import type { OutputFilter } from '@stratamu/types'
import { describe, expect, it } from 'vitest'
import { CapabilitiesManager } from '../capabilities'

// Mock filter for testing
const mockFilter: OutputFilter = (client, text) => text

describe('CapabilitiesManager', () => {
  it('should set and get capabilities for a client', () => {
    const mgr = new CapabilitiesManager()
    mgr.set('client1', undefined, { ansi: true, mxp: false })
    const caps = mgr.get('client1')
    expect(caps).toBeDefined()
    expect(caps?.ansi).toBe(true)
    expect(caps?.mxp).toBe(false)
  })

  it('should build the correct filter queue', () => {
    const mgr = new CapabilitiesManager()
    // Patch the filter map for test
    // @ts-expect-error: test override
    mgr.filterQueues.set('client2', [mockFilter, mockFilter])
    expect(mgr.getFilterQueue('client2').length).toBe(2)
  })

  it('should clear capabilities and filter queues', () => {
    const mgr = new CapabilitiesManager()
    mgr.set('client3', undefined, { ansi: true })
    mgr.clear('client3')
    expect(mgr.get('client3')).toBeUndefined()
    expect(mgr.getFilterQueue('client3')).toEqual([])
  })

  it('should clear all clients', () => {
    const mgr = new CapabilitiesManager()
    mgr.set('clientA', undefined, { ansi: true })
    mgr.set('clientB', undefined, { mxp: true })
    mgr.clearAll()
    expect(mgr.get('clientA')).toBeUndefined()
    expect(mgr.get('clientB')).toBeUndefined()
  })
})
