import { ClientStateManager, GroupManager, IdleTimeoutManager } from '@/shared'
import * as net from 'node:net'

import {
  addClientToGroup,
  broadcastToGroup,
  ConnectionManager,
  createTelnetServer,
  emitEvent,
  getConnectionInfo,
  getConnectionStats,
  handleMessageWithMiddleware,
  handleSubnegotiation,
  kickExcessConnections,
  registerHandler,
  removeClientFromGroup,
  sendANSI,
  sendColoredMessage,
  sendIAC,
  setIdleTimeout,
  setPrompt,
  TelnetEventMap,
  TelnetProtocolHandler
} from '@/telnet'

import type {
  ConnectionLimits,
  NetworkAdapter,
  TelnetClientId,
  TelnetClientState,
  TelnetConfig,
  TelnetConfigRequired,
  TelnetGroupId,
  TelnetHandlers,
  TelnetMessage,
  TelnetMiddleware
} from '@/types'
import type { PartialDeep } from 'type-fest'

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
  private handlers: TelnetHandlers = {}
  private server?: net.Server
  private middlewares: TelnetMiddleware[] = []
  private config: TelnetConfigRequired = {
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
  public async start(config?: PartialDeep<TelnetConfigRequired>) {
    // Merge user config with defaults
    this.config = { ...this.config, ...config }

    // Update connection manager with new limits
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    })

    this.server = createTelnetServer(
      {
        config: this.config,
        connectionManager: this.connectionManager,
        idleTimeouts: this.idleTimeouts,
        handlers: this.handlers,
        emit: this._emit.bind(this),
        setIdleTimeout: this.setIdleTimeout.bind(this),
        cleanupClient: this._cleanupClient.bind(this)
      },
      TelnetProtocolHandler,
      this._handleMessage.bind(this)
    )

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
          } catch {}
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

  public send(clientId: TelnetClientId, message: TelnetMessage) {
    const socket = this.connectionManager.getClient(clientId)
    if (socket) {
      const output =
        typeof message === 'string' ? message : JSON.stringify(message)
      socket.write(output + '\r\n')
    }
  }

  // Replace group management methods
  public addClientToGroup(
    clientId: TelnetClientId,
    groupId: TelnetGroupId
  ): void {
    addClientToGroup(this.groupManager, clientId, groupId)
  }

  public removeClientFromGroup(
    clientId: TelnetClientId,
    groupId: TelnetGroupId
  ): void {
    removeClientFromGroup(this.groupManager, clientId, groupId)
  }

  public broadcast(message: TelnetMessage, groupId?: TelnetGroupId) {
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
  public sendIAC(
    clientId: TelnetClientId,
    command: number,
    option?: number
  ): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendIAC(socket, command, option)
  }

  public sendANSI(clientId: TelnetClientId, ansiSequence: string): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendANSI(socket, ansiSequence)
  }

  public setPrompt(clientId: TelnetClientId, prompt: string): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    setPrompt(socket, prompt)
  }

  public handleSubnegotiation(
    clientId: TelnetClientId,
    type: string,
    data: TelnetMessage
  ): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    handleSubnegotiation(socket, clientId, type, data)
  }

  public sendColoredMessage(
    clientId: TelnetClientId,
    message: string,
    color?: string
  ): void {
    const socket = this.connectionManager.getClient(clientId)
    if (!socket) return
    sendColoredMessage(socket, message, color)
  }

  // Replace idle timeout management
  public setIdleTimeout(clientId: TelnetClientId, ms: number): void {
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
    clientId: TelnetClientId
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

  public getClientState(clientId: TelnetClientId): TelnetClientState {
    return this.clientStates.get(clientId)
  }

  public setClientState(
    clientId: TelnetClientId,
    state: TelnetClientState
  ): void {
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
