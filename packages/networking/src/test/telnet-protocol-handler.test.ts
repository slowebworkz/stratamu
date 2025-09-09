import { describe, expect, it } from 'vitest'
import { TelnetProtocolHandler } from '../telnet/telnet-protocol-handler'

describe('TelnetProtocolHandler', () => {
  it('should have sendInitialNegotiation as a function', () => {
    expect(typeof TelnetProtocolHandler.sendInitialNegotiation).toBe('function')
  })

  it('should have parseTelnetData as a function', () => {
    expect(typeof TelnetProtocolHandler.parseTelnetData).toBe('function')
  })
})
