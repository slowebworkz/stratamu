import { describe, expect, it, vi } from 'vitest'
import { handleMessageWithMiddleware } from '../../telnet/message-middleware'

describe('handleMessageWithMiddleware', () => {
  it('calls all sync middlewares and emits message', async () => {
    const calls: string[] = []
    const middlewares = [
      (clientId, message, next) => {
        calls.push(`mw1:${clientId}:${message}`)
        next()
      },
      (clientId, message, next) => {
        calls.push(`mw2:${clientId}:${message}`)
        next()
      }
    ]
    const emit = vi.fn()
    await handleMessageWithMiddleware(middlewares, emit, 'c1', 'hello')
    expect(calls).toEqual(['mw1:c1:hello', 'mw2:c1:hello'])
    expect(emit).toHaveBeenCalledWith('message', 'c1', 'hello')
  })

  it('handles async middlewares', async () => {
    const calls: string[] = []
    const middlewares = [
      async (clientId, message, next) => {
        await new Promise((r) => setTimeout(r, 10))
        calls.push(`async1:${clientId}:${message}`)
        await next()
      },
      (clientId, message, next) => {
        calls.push(`sync2:${clientId}:${message}`)
        next()
      }
    ]
    const emit = vi.fn()
    await handleMessageWithMiddleware(middlewares, emit, 'c2', 'world')
    expect(calls).toEqual(['async1:c2:world', 'sync2:c2:world'])
    expect(emit).toHaveBeenCalledWith('message', 'c2', 'world')
  })

  it('stops on error and emits error', async () => {
    const calls: string[] = []
    const middlewares = [
      (clientId, message, next) => {
        calls.push('before-error')
        next(new Error('fail'))
      },
      (clientId, message, next) => {
        calls.push('should-not-run')
        next()
      }
    ]
    const emit = vi.fn()
    await handleMessageWithMiddleware(middlewares, emit, 'c3', 'err')
    expect(calls).toEqual(['before-error'])
    expect(emit).toHaveBeenCalledWith(
      'error',
      'c3',
      expect.objectContaining({ message: 'fail' })
    )
  })

  it('handles thrown errors in middleware', async () => {
    const calls: string[] = []
    const middlewares = [
      (clientId, message, next) => {
        calls.push('throwing')
        throw new Error('boom')
      },
      (clientId, message, next) => {
        calls.push('should-not-run')
        next()
      }
    ]
    const emit = vi.fn()
    await handleMessageWithMiddleware(middlewares, emit, 'c4', 'throw')
    expect(calls).toEqual(['throwing'])
    expect(emit).toHaveBeenCalledWith(
      'error',
      'c4',
      expect.objectContaining({ message: 'boom' })
    )
  })

  it('emits message if no middlewares', async () => {
    const emit = vi.fn()
    await handleMessageWithMiddleware([], emit, 'c5', 'empty')
    expect(emit).toHaveBeenCalledWith('message', 'c5', 'empty')
  })
})
