import { describe, expect, it } from 'vitest'
import { MUD_CONSTANTS } from '../../constants/mud-constants'

describe('MUD_CONSTANTS', () => {
  it('should have gameType as MUD', () => {
    expect(MUD_CONSTANTS.gameType).toBe('MUD')
  })

  it('should have maxConnections as a number', () => {
    expect(typeof MUD_CONSTANTS.maxConnections).toBe('number')
  })
})
