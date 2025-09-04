import { describe, it, expect } from 'vitest'
import { MUCK_CONSTANTS } from '../muck-constants'

describe('MUCK_CONSTANTS', () => {
  it('should have gameType as MUCK', () => {
    expect(MUCK_CONSTANTS.gameType).toBe('MUCK')
  })

  it('should have maxConnections as a number', () => {
    expect(typeof MUCK_CONSTANTS.maxConnections).toBe('number')
  })
})
