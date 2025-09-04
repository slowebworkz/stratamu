import { describe, it, expect } from 'vitest'
import * as constants from '../index'

describe('constants index', () => {
  it('should export MUD_CONSTANTS', () => {
    expect(constants.MUD_CONSTANTS).toBeDefined()
  })
  it('should export MOO_CONSTANTS', () => {
    expect(constants.MOO_CONSTANTS).toBeDefined()
  })
  it('should export MUCK_CONSTANTS', () => {
    expect(constants.MUCK_CONSTANTS).toBeDefined()
  })
  it('should export MUSH_CONSTANTS', () => {
    expect(constants.MUSH_CONSTANTS).toBeDefined()
  })
})
