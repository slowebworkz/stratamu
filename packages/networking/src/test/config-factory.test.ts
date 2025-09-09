import { describe, expect, it } from 'vitest'
import { MUD_CONSTANTS } from '../constants/mud-constants'
import {
  createTelnetConfig,
  getGameConstantsValidationErrors,
  validateGameConstants
} from '../utils/config-factory'

describe('createTelnetConfig', () => {
  it('should convert game constants to telnet config', () => {
    const config = createTelnetConfig(MUD_CONSTANTS)
    expect(config.port).toBe(MUD_CONSTANTS.defaultPort)
    expect(config.maxConnections).toBe(MUD_CONSTANTS.maxConnections)
    expect(config.maxConnectionsPerIP).toBe(MUD_CONSTANTS.maxConnectionsPerIP)
    expect(config.idleTimeoutMs).toBe(MUD_CONSTANTS.idleTimeoutMs)
  })
})

describe('getGameConstantsValidationErrors', () => {
  it('returns empty array for valid constants', () => {
    expect(getGameConstantsValidationErrors(MUD_CONSTANTS)).toEqual([])
  })

  it('returns errors for invalid values', () => {
    const invalid = {
      ...MUD_CONSTANTS,
      maxConnections: 0,
      defaultPort: 80,
      idleTimeoutMs: 10,
      maxInputLength: 10,
      maxConnectionsPerIP: 0
    }
    const errors = getGameConstantsValidationErrors(invalid)
    expect(errors).toEqual([
      expect.stringContaining('maxConnections'),
      expect.stringContaining('maxConnectionsPerIP'),
      expect.stringContaining('defaultPort'),
      expect.stringContaining('idleTimeoutMs'),
      expect.stringContaining('maxInputLength')
    ])
  })
})

describe('validateGameConstants', () => {
  it('does not throw for valid constants', () => {
    expect(() => validateGameConstants(MUD_CONSTANTS)).not.toThrow()
  })

  it('throws for invalid constants', () => {
    const invalid = { ...MUD_CONSTANTS, maxConnections: 0 }
    expect(() => validateGameConstants(invalid)).toThrow(/maxConnections/)
  })
})
