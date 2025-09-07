import { describe, expect, it } from 'vitest'
import { MUSH_CONSTANTS } from '../../constants/mush-constants'

describe('MUSH_CONSTANTS', () => {
  it('should have gameType as MUSH', () => {
    expect(MUSH_CONSTANTS.gameType).toBe('MUSH')
  })

  it('should have maxConnections as a number', () => {
    expect(typeof MUSH_CONSTANTS.maxConnections).toBe('number')
  })
})
