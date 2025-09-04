import type { IdleTimeoutManager } from '@/shared/idle-timeout-manager'
import type { ConnectionManager } from '@/telnet/connection-manager'
import { TelnetProtocolHandler } from '@/telnet/telnet-protocol-handler'
import type { TelnetConfig } from '@/types'
import { randomUUID } from 'node:crypto'
import * as net from 'node:net'

export interface TelnetServerOptions {
  config: Required<TelnetConfig>
  connectionManager: ConnectionManager
  idleTimeouts: IdleTimeoutManager
  handlers: any
  emit: (event: string, ...args: any[]) => void
  setIdleTimeout: (clientId: string, ms: number) => void
  cleanupClient: (clientId: string) => void
}

export function createTelnetServer(
  options: TelnetServerOptions,
  protocolHandler: TelnetProtocolHandler,
  handleMessage: (clientId: string, message: any) => void
): net.Server {
  const {
    config,
    connectionManager,
    idleTimeouts,
    emit,
    setIdleTimeout,
    cleanupClient
  } = options
  return net.createServer((socket) => {
    const { remoteAddress, remotePort } = socket
    const clientId = `${remoteAddress ?? 'unknown'}:${remotePort ?? '0'}:${randomUUID()}`

    // Rate limiting using ConnectionManager
    if (
      !connectionManager.canAcceptConnection(
        connectionManager.getActiveConnections(),
        remoteAddress
      )
    ) {
      if (connectionManager.getActiveConnections() >= config.maxConnections) {
        socket.end('Server is full. Please try again later.\r\n')
      } else {
        socket.end(
          'Too many connections from your IP. Please try again later.\r\n'
        )
      }
      return
    }

    connectionManager.addClient(clientId, socket)
    emit('connect', clientId)
    setIdleTimeout(clientId, config.idleTimeoutMs)

    // Telnet negotiation using protocol handler
    TelnetProtocolHandler.sendInitialNegotiation(socket)

    // Handle incoming data
    socket.on('data', (data) => {
      idleTimeouts.set(clientId, config.idleTimeoutMs, () => {
        const socket = connectionManager.getClient(clientId)
        if (socket) {
          try {
            socket.end('Idle timeout.\r\n')
          } catch {
            socket.destroy()
          }
          cleanupClient(clientId)
          emit('disconnect', clientId)
        }
      })

      const message = TelnetProtocolHandler.parseTelnetData(data)
      if (message.trim().length > 0) {
        handleMessage(clientId, message.trim())
      }
    })

    // Handle client disconnect
    socket.on('close', () => {
      cleanupClient(clientId)
      emit('disconnect', clientId)
    })

    // Handle errors
    socket.on('error', (err) => {
      const { message, code } = err as any
      console.error(`Socket error (${code}): ${message} [${clientId}]`)
      try {
        socket.destroy()
      } catch {
        // intentionally ignore errors during socket destroy
      }
      cleanupClient(clientId)
      emit('disconnect', clientId)
    })
  })
}
