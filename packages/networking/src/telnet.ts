import { ConnectionManager } from './telnet/connection-manager'
import { ClientStateManager } from './shared/client-state-manager'
import { GroupManager } from './shared/group-manager'
import { IdleTimeoutManager } from './shared/idle-timeout-manager'
import { TelnetProtocolHandler } from './telnet/telnet-protocol-handler'
import { addClientToGroup, broadcastToGroup, removeClientFromGroup } from './telnet/group-utils'
import { emitEvent, registerHandler } from './telnet/event-utils'
import { getConnectionInfo, getConnectionStats } from './telnet/connection-stats'
import { handleMessageWithMiddleware } from './telnet/message-middleware'
import { handleSubnegotiation, sendANSI, sendColoredMessage, sendIAC, setPrompt } from './telnet/telnet-utils'
import { kickExcessConnections } from './telnet/kick-utils'
import { setIdleTimeout } from './telnet/timeout-utils'
import type { TelnetEventMap } from './telnet/telnet-event-map'
import type { ConnectionLimits } from './types/index'
import { NetworkAdapter, TelnetConfig } from './types/index'
import { randomUUID } from 'node:crypto'
import * as net from 'node:net'

export { TelnetConfig }

/**
 * TelnetAdapter: Classic fallback networking adapter for MUD/MUSH games.
 * Implements the unified NetworkAdapter interface.
 * Telnet-specific methods are included for advanced features.
 * DikuMUD/TinyMUD/LPMud/AberMUD-style implementation for connection and basic text I/O.
 */
export class TelnetAdapter implements NetworkAdapter {
  private clientStates = new ClientStateManager()
  private idleTimeouts = new IdleTimeoutManager()
  private connectionManager: ConnectionManager
  private groupManager = new GroupManager()
  private handlers: Partial<{
    [K in keyof TelnetEventMap]: Array<TelnetEventMap[K]>
  }> = {}
  private server?: net.Server
  private middlewares: Array<
    (clientId: string, message: any, next: () => void) => void
  > = []
  private config: Required<TelnetConfig> = {
    port: 4000,
    idleTimeoutMs: 600000, // 10 minutes
    maxConnections: 100,
    maxConnectionsPerIP: 5
  }

  constructor() {
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    })
  }

  /**
   * Start the Telnet server, listen for connections, and handle basic Telnet negotiation.
   * Follows classic MUD patterns: listen on configurable port, accept multiple clients, handle text I/O.
   */
  public async start(config?: TelnetConfig) {
    // Merge user config with defaults
    this.config = { ...this.config, ...config }

    // Update connection manager with new limits
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    })

    this.server = net.createServer((socket) => {
      // Generate stable client ID with UUID for session tracking
      const { remoteAddress, remotePort } = socket
      const clientId = `${remoteAddress ?? 'unknown'}:${remotePort ?? '0'}:${randomUUID()}`

      // Rate limiting using ConnectionManager
      if (
        !this.connectionManager.canAcceptConnection(
          this.connectionManager.getActiveConnections(),
          remoteAddress
        )
      ) {
        if (
          this.connectionManager.getActiveConnections() >=
          this.config.maxConnections
        ) {
          socket.end('Server is full. Please try again later.\r\n')
        } else {
          socket.end(
            'Too many connections from your IP. Please try again later.\r\n'
          )
        }
        return
      }

      this.connectionManager.addClient(clientId, socket)
      this._emit('connect', clientId)
      this.setIdleTimeout(clientId, this.config.idleTimeoutMs)

      // Telnet negotiation using protocol handler
      TelnetProtocolHandler.sendInitialNegotiation(socket)

      // Handle incoming data
      socket.on('data', (data) => {
        // Refresh idle timeout on activity (IdleTimeoutManager.set() auto-clears existing timeout)
        this.idleTimeouts.set(clientId, this.config.idleTimeoutMs, () => {
          const socket = this.connectionManager.getClient(clientId)
          if (socket) {
            try {
              socket.end('Idle timeout.\r\n')
            } catch {
              socket.destroy()
            }
            this._cleanupClient(clientId)
            this._emit('disconnect', clientId)
          }
        })

        const message = TelnetProtocolHandler.parseTelnetData(data)
        if (message.trim().length > 0) {
          this._handleMessage(clientId, message.trim())
        }
      })

      // Handle client disconnect
      socket.on('close', () => {
        // socket already closed
        this._cleanupClient(clientId)
        this._emit('disconnect', clientId)
      })

      // Handle errors
      socket.on('error', (err) => {
        const { message, code } = err as any
        console.error(`Socket error (${code}): ${message} [${clientId}]`)
        try {
          socket.destroy()
        } catch { }
        this._cleanupClient(clientId)
        this._emit('disconnect', clientId)
      })
    })

    // Listen on configured port with proper error handling
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject)
      this.server!.listen(this.config.port, resolve)
    })
    console.log(`Telnet server listening on port ${this.config.port}`)
  }

  public async stop(graceful = true) {
    if (this.server) {
      this.connectionManager.getAllClients().forEach((socket, clientId) => {
        if (graceful) {
          try {
            socket.end('Server shutting down.\r\n')
          } catch {
            socket.destroy()
          }
        } else {
          try {
            socket.destroy()
          } catch { }
        }
        this._cleanupClient(clientId)
        this._emit('disconnect', clientId)
      })
      await new Promise<void>((resolve, reject) => {
        this.server!.close((err?: Error) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      this.server = undefined
      this.connectionManager.clear()
      this.clientStates.clear()
      this.idleTimeouts.clearAll()
    }
  }

  public send(clientId: string, message: string | object) {
    const socket = this.connectionManager.getClient(clientId)
    if (socket) {
      const output =
        typeof message === 'string' ? message : JSON.stringify(message)
      socket.write(output + '\r\n')
    }
  }

  // Replace group management methods
  public addClientToGroup(clientId: string, groupId: string): void {
    addClientToGroup(this.groupManager, clientId, groupId)
  }

  public removeClientFromGroup(clientId: string, groupId: string): void {
    removeClientFromGroup(this.groupManager, clientId, groupId)
  }

  public broadcast(message: string | object, groupId?: string) {
    broadcastToGroup(
      this.groupManager,
      this.connectionManager.getAllClients(),
      message,
      (socket: net.Socket, msg: string | object) => {
        const output = typeof msg === 'string' ? msg : JSON.stringify(msg)
        socket.write(output + '\r\n')
      },
      groupId
    )
  }

  // Replace event handling methods
  public on<K extends keyof TelnetEventMap>(
    event: K,
    handler: TelnetEventMap[K]
  ) {
    registerHandler(this.handlers, event, handler)
  }

  private _emit<K extends keyof TelnetEventMap>(
    event: K,
    ...args: Parameters<TelnetEventMap[K]>
  ) {
    emitEvent(this.handlers, event, ...args)
  }

  // Replace Telnet protocol utilities
  public sendIAC(clientId: string, command: number, option?: number): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendIAC(socket, command, option)
  }

  public sendANSI(clientId: string, ansiSequence: string): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendANSI(socket, ansiSequence)
  }

  public setPrompt(clientId: string, prompt: string): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    setPrompt(socket, prompt)
  }

  public handleSubnegotiation(clientId: string, type: string, data: any): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    handleSubnegotiation(socket, clientId, type, data)
  }

  public sendColoredMessage(
    clientId: string,
    message: string,
    color?: string
  ): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendColoredMessage(socket, message, color)
  }

  // Replace idle timeout management
  public setIdleTimeout(clientId: string, ms: number): void {
    setIdleTimeout(
      this.idleTimeouts,
      this.connectionManager,
      clientId,
      ms,
      (clientId, socket) => {
        socket.end('Idle timeout.\r\n')
        this._cleanupClient(clientId)
        this._emit('disconnect', clientId)
      }
    )
  }

  // Replace connection info/stats
  public getConnectionInfo(
    clientId: string
  ): { ip?: string; port?: number; connected: Date } | null {
    return getConnectionInfo(this.connectionManager, clientId)
  }

  public getConnectionStats(): {
    total: number
    byIP: Map<string, number>
    limits: ConnectionLimits
    canAcceptNew: boolean
  } {
    return getConnectionStats({
      getActiveConnections: this.connectionManager.getActiveConnections.bind(
        this.connectionManager
      ),
      getConnectionsByIP: this.connectionManager.getConnectionsByIP.bind(
        this.connectionManager
      ),
      getConnectionLimits: this.getConnectionLimits.bind(this)
    })
  }

  public getClientState(clientId: string): Record<string, any> {
    return this.clientStates.get(clientId)
  }

  public setClientState(clientId: string, state: Record<string, any>): void {
    this.clientStates.set(clientId, state)
  }

  public use(
    middleware: (clientId: string, message: any, next: () => void) => void
  ) {
    this.middlewares.push(middleware)
  }

  private async _handleMessage(clientId: string, message: any) {
    await handleMessageWithMiddleware(
      this.middlewares,
      this._emit.bind(this),
      clientId,
      message
    )
  }

  public negotiate?(clientId: string, option: string, value: any): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    TelnetProtocolHandler.negotiate(socket, option, value)
  }

  // Traditional MUD-style connection management methods
  public getConnectionLimits(): ConnectionLimits {
    return {
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    }
  }

  public setConnectionLimits(limits: Partial<ConnectionLimits>): void {
    if (limits.maxConnections !== undefined) {
      this.config.maxConnections = limits.maxConnections
    }
    if (limits.maxConnectionsPerIP !== undefined) {
      this.config.maxConnectionsPerIP = limits.maxConnectionsPerIP
    }
    this.connectionManager.updateLimits({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    })
  }

  public kickExcessConnections(): number {
    const result = kickExcessConnections(
      this.connectionManager.getAllClients(),
      this.getConnectionStats(),
      (clientId, socket) => {
        this._cleanupClient(clientId)
        this._emit('disconnect', clientId)
      }
    )
    return result.kicked
  }

  // Helper method to cleanup client resources
  private _cleanupClient(clientId: string): void {
    this.connectionManager.removeClient(clientId)
    this.clientStates.delete(clientId)
    this.idleTimeouts.clear(clientId)

    // Remove from all groups
    this.groupManager.removeClientFromAllGroups(clientId)
  }
}
