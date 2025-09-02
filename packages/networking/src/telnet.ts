import { NetworkAdapter, TelnetConfig } from "@/types";
import * as net from "node:net";
import { randomUUID } from "node:crypto";
import { ClientStateManager, IdleTimeoutManager, GroupManager } from "@/shared";
import { ConnectionManager, TelnetProtocolHandler } from "@/telnet";
import type { ConnectionLimits } from "@/types";

export { TelnetConfig };

/**
 * TelnetAdapter: Classic fallback networking adapter for MUD/MUSH games.
 * Implements the unified NetworkAdapter interface.
 * Telnet-specific methods are included for advanced features.
 * DikuMUD/TinyMUD/LPMud/AberMUD-style implementation for connection and basic text I/O.
 */
export class TelnetAdapter implements NetworkAdapter {
  private clientStates = new ClientStateManager();
  private idleTimeouts = new IdleTimeoutManager();
  private connectionManager: ConnectionManager;
  private groupManager = new GroupManager();
  private handlers: { [event: string]: Array<(clientId: string, data?: any) => void> } = {};
  private server?: net.Server;
  private middlewares: Array<(clientId: string, message: any, next: () => void) => void> = [];
  private config: Required<TelnetConfig> = {
    port: 4000,
    idleTimeoutMs: 600000, // 10 minutes
    maxConnections: 100,
    maxConnectionsPerIP: 5
  };

  constructor() {
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    });
  }

  /**
   * Start the Telnet server, listen for connections, and handle basic Telnet negotiation.
   * Follows classic MUD patterns: listen on configurable port, accept multiple clients, handle text I/O.
   */
  public async start(config?: TelnetConfig) {
    // Merge user config with defaults
    this.config = { ...this.config, ...config };

    // Update connection manager with new limits
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    });

    this.server = net.createServer((socket) => {
      // Generate stable client ID with UUID for session tracking
      const { remoteAddress, remotePort } = socket;
      const clientId = `${remoteAddress ?? "unknown"}:${remotePort ?? "0"}:${randomUUID()}`;

      // Rate limiting using ConnectionManager
      if (!this.connectionManager.canAcceptConnection(this.connectionManager.getActiveConnections(), remoteAddress)) {
        if (this.connectionManager.getActiveConnections() >= this.config.maxConnections) {
          socket.end("Server is full. Please try again later.\r\n");
        } else {
          socket.end("Too many connections from your IP. Please try again later.\r\n");
        }
        return;
      }

      this.connectionManager.addClient(clientId, socket);
      this._emit("connect", clientId);
      this.setIdleTimeout(clientId, this.config.idleTimeoutMs);

      // Telnet negotiation using protocol handler
      TelnetProtocolHandler.sendInitialNegotiation(socket);

      // Handle incoming data
      socket.on("data", (data) => {
        // Refresh idle timeout on activity (IdleTimeoutManager.set() auto-clears existing timeout)
        this.idleTimeouts.set(clientId, this.config.idleTimeoutMs, () => {
          const socket = this.connectionManager.getClient(clientId);
          if (socket) {
            socket.end("Idle timeout.\r\n");
            this._cleanupClient(clientId);
            this._emit("disconnect", clientId);
          }
        });

        const message = TelnetProtocolHandler.parseTelnetData(data);
        if (message.trim().length > 0) {
          this._handleMessage(clientId, message.trim());
        }
      });

      // Handle client disconnect
      socket.on("close", () => {
        this._cleanupClient(clientId);
        console.info(`Client ${clientId} disconnected. Removing from all groups.`);
        this._emit("disconnect", clientId);
      });

      // Handle errors
      socket.on("error", (err) => {
        const { message, code } = err as any;
        if (code === "ECONNRESET") {
          // Log or handle connection reset
          console.warn(`Connection reset by peer: ${clientId}`);
        } else if (code === "EPIPE") {
          // Log or handle broken pipe
          console.warn(`Broken pipe: ${clientId}`);
        } else {
          // Other errors
          console.error(`Socket error (${code}): ${message} [${clientId}]`);
        }
        this._emit("error", clientId, { message, code });
      });
    });

    // Listen on configured port with proper error handling
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(this.config.port, resolve);
    });
    console.log(`Telnet server listening on port ${this.config.port}`);
  }

  public async stop(graceful = true) {
    if (this.server) {
      this.connectionManager.getAllClients().forEach((socket, clientId) => {
        if (graceful) {
          socket.end("Server shutting down.\r\n");
        } else {
          socket.destroy();
        }
        this._emit("disconnect", clientId);
      });
      this.server.close();
      this.server = undefined;
      this.connectionManager.clear();
      this.clientStates.clear();
      this.idleTimeouts.clearAll();
    }
  }

  public send(clientId: string, message: string | object) {
    const socket = this.connectionManager.getClient(clientId);
    if (socket) {
      const output = typeof message === "string" ? message : JSON.stringify(message);
      socket.write(output + "\r\n");
    }
  }

  // Add a client to a group
  public addClientToGroup(clientId: string, groupId: string): void {
    this.groupManager.addClientToGroup(clientId, groupId);
  }

  // Remove a client from a group
  public removeClientFromGroup(clientId: string, groupId: string): void {
    this.groupManager.removeClientFromGroup(clientId, groupId);
  }

  // Broadcast to a group
  public broadcast(message: string | object, groupId?: string) {
    this.groupManager.broadcast(
      this.connectionManager.getAllClients(),
      message,
      (socket: net.Socket, msg: string | object) => {
        const output = typeof msg === "string" ? msg : JSON.stringify(msg);
        socket.write(output + "\r\n");
      },
      groupId
    );
  }

  public on(event: 'connect' | 'disconnect' | 'error' | 'message', handler: (clientId: string, data?: any) => void) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  public getClientState(clientId: string): Record<string, any> {
    return this.clientStates.get(clientId);
  }

  public setClientState(clientId: string, state: Record<string, any>): void {
    this.clientStates.set(clientId, state);
  }

  public use(middleware: (clientId: string, message: any, next: () => void) => void) {
    this.middlewares.push(middleware);
  }

  private _handleMessage(clientId: string, message: any) {
    let index = 0;
    const next = (err?: Error) => {
      if (err) {
        this._emit("error", clientId, { message: err.message });
        return;
      }
      const mw = this.middlewares[index++];
      if (mw) {
        try {
          mw(clientId, message, next);
        } catch (err) {
          next(err as Error);
        }
      } else {
        this._emit("message", clientId, message);
      }
    };
    next();
  }

  public negotiate?(clientId: string, option: string, value: any): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.negotiate(socket, option, value);
  }

  // Telnet-specific public API
  public sendIAC(clientId: string, command: number, option?: number): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.sendIAC(socket, command, option);
  }

  public sendANSI(clientId: string, ansiSequence: string): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.sendANSI(socket, ansiSequence);
  }

  public setPrompt(clientId: string, prompt: string): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.setPrompt(socket, prompt);
  }

  public handleSubnegotiation(clientId: string, type: string, data: any): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.handleSubnegotiation(socket, clientId, type, data);
  }

  public getSocket(clientId: string): net.Socket | undefined {
    return this.connectionManager.getClient(clientId);
  }

  // Enhanced methods for MUD functionality
  public sendColoredMessage(clientId: string, message: string, color?: string): void {
    const socket = this.connectionManager.getClient(clientId);
    if (!socket) return;
    TelnetProtocolHandler.sendColoredMessage(socket, message, color);
  }

  public getConnectionInfo(clientId: string): { ip?: string, port?: number, connected: Date } | null {
    return this.connectionManager.getConnectionInfo(clientId);
  }

  public getActiveConnections(): number {
    return this.connectionManager.getActiveConnections();
  }

  public getConnectionsByIP(): Map<string, number> {
    return this.connectionManager.getConnectionsByIP();
  }

  public getAllClients(): Map<string, net.Socket> {
    return this.connectionManager.getAllClients();
  }

  public setIdleTimeout(clientId: string, ms: number): void {
    this.idleTimeouts.set(clientId, ms, () => {
      const socket = this.connectionManager.getClient(clientId);
      if (socket) {
        socket.end("Idle timeout.\r\n");
        this._cleanupClient(clientId);
        this._emit("disconnect", clientId);
      }
    });
  }

  // Helper method to cleanup client resources
  private _cleanupClient(clientId: string): void {
    this.connectionManager.removeClient(clientId);
    this.clientStates.delete(clientId);
    this.idleTimeouts.clear(clientId);

    // Remove from all groups
    this.groupManager.removeClientFromAllGroups(clientId);
  }

  private _emit(event: string, clientId: string, data?: any) {
    const handlers = this.handlers[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(clientId, data);
      }
    }
  }

  // Traditional MUD-style connection management methods
  public getConnectionLimits(): ConnectionLimits {
    return {
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    };
  }

  public setConnectionLimits(limits: Partial<ConnectionLimits>): void {
    if (limits.maxConnections !== undefined) {
      this.config.maxConnections = limits.maxConnections;
    }
    if (limits.maxConnectionsPerIP !== undefined) {
      this.config.maxConnectionsPerIP = limits.maxConnectionsPerIP;
    }

    // Update the connection manager with new limits
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      maxConnectionsPerIP: this.config.maxConnectionsPerIP
    });
  }

  public getConnectionStats(): {
    total: number;
    byIP: Map<string, number>;
    limits: ConnectionLimits;
    canAcceptNew: boolean;
  } {
    const limits = this.getConnectionLimits();
    const total = this.connectionManager.getActiveConnections();
    const byIP = this.connectionManager.getConnectionsByIP();

    return {
      total,
      byIP,
      limits,
      canAcceptNew: total < limits.maxConnections
    };
  }

  public kickExcessConnections(): number {
    const stats = this.getConnectionStats();
    let kicked = 0;

    // Kick connections that exceed per-IP limits (traditional MUD behavior)
    stats.byIP.forEach((count, ip) => {
      if (count > stats.limits.maxConnectionsPerIP) {
        const excess = count - stats.limits.maxConnectionsPerIP;
        const clientsFromIP = Array.from(this.connectionManager.getAllClients().entries())
          .filter(([_, socket]) => socket.remoteAddress === ip)
          .slice(0, excess); // Keep older connections, kick newer ones

        clientsFromIP.forEach(([clientId, socket]) => {
          socket.end("Too many connections from your IP address.\r\n");
          this._cleanupClient(clientId);
          this._emit("disconnect", clientId);
          kicked++;
        });
      }
    });

    return kicked;
  }
}
