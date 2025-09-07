import { describe, expect, it } from 'vitest'
import { MOO_CONSTANTS } from '../constants/moo-constants'

describe('MOO_CONSTANTS', () => {
  it('should have gameType as MOO', () => {
    expect(MOO_CONSTANTS.gameType).toBe('MOO')
  })

  it('should have maxConnections as a number', () => {
    expect(typeof MOO_CONSTANTS.maxConnections).toBe('number')
  })
})
