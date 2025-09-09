import { describe, expect, it } from 'vitest'
import {
  handleSubnegotiation,
  sendANSI,
  sendColoredMessage,
  sendIAC,
  setPrompt
} from '../../telnet/index'

describe('telnet-utils', () => {
  it('exports protocol utility functions', () => {
    expect(typeof sendIAC).toBe('function')
    expect(typeof sendANSI).toBe('function')
    expect(typeof setPrompt).toBe('function')
    expect(typeof handleSubnegotiation).toBe('function')
    expect(typeof sendColoredMessage).toBe('function')
  })
})
