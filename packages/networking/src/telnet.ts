import { NetworkAdapter } from "./networkAdapter";
import * as net from "node:net";
import { ClientStateManager } from "./clientStateManager";
import { IdleTimeoutManager } from "./idleTimeoutManager";

/**
 * TelnetAdapter: Classic fallback networking adapter for MUD/MUSH games.
 * Implements the unified NetworkAdapter interface.
 * Telnet-specific methods are included for advanced features.
 * DikuMUD/TinyMUD/LPMud/AberMUD-style implementation for connection and basic text I/O.
 */
export class TelnetAdapter implements NetworkAdapter {
  private clients: Map<string, net.Socket> = new Map();
  private clientStates = new ClientStateManager();
  private idleTimeouts = new IdleTimeoutManager();
  private handlers: { [event: string]: Array<(clientId: string, data?: any) => void> } = {};
  private server?: net.Server;
  private groups: Map<string, Set<string>> = new Map();
  private middlewares: Array<(clientId: string, message: any, next: () => void) => void> = [];

  /**
   * Start the Telnet server, listen for connections, and handle basic Telnet negotiation.
   * Follows classic MUD patterns: listen on port 4000, accept multiple clients, handle text I/O.
   */
  public async start() {
    this.server = net.createServer((socket) => {
      // Destructure remoteAddress and remotePort from socket
      const { remoteAddress, remotePort } = socket;
      const clientId = `${remoteAddress}:${remotePort}`;
      this.clients.set(clientId, socket);
      this._emit("connect", clientId);
      this.setIdleTimeout(clientId, 600000); // 10 min default

      // Telnet negotiation: ECHO OFF, SUPPRESS GO-AHEAD
      // IAC DO SUPPRESS GO-AHEAD (255, 253, 3), IAC WILL ECHO (255, 251, 1)
      socket.write(Buffer.from([255, 253, 3])); // DO SUPPRESS GO-AHEAD
      socket.write(Buffer.from([255, 251, 1])); // WILL ECHO

      // Handle incoming data
      socket.on("data", (data) => {
        this.idleTimeouts.set(clientId, 600000, () => {
          const sock = this.clients.get(clientId);
          if (sock) {
            sock.end("Idle timeout.\r\n");
            this.clients.delete(clientId);
            this.clientStates.delete(clientId);
            this._emit("disconnect", clientId);
          }
        });
        // Destructure length from data (Buffer)
        const { length } = data;
        const message = this._parseTelnetData(data);
        this._handleMessage(clientId, message);
      });

      // Handle client disconnect
      socket.on("close", () => {
        this.clients.delete(clientId);
        this.clientStates.delete(clientId);
        this.idleTimeouts.clear(clientId);
        console.info(`Client ${clientId} disconnected. Removing from all groups.`);
        this.groups.forEach((group, groupId) => {
          group.delete(clientId);
          if (group.size === 0) {
            this.groups.delete(groupId);
            console.info(`Group ${groupId} is now empty and has been deleted.`);
          } else {
            console.info(`Client ${clientId} removed from group ${groupId}. Remaining members: ${Array.from(group).join(", ")}`);
          }
        });
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

    // Listen on port 4000 (classic MUD default)
    await new Promise<void>((resolve) => this.server!.listen(4000, resolve));
    // Optionally, log server start
    // console.log("Telnet server listening on port 4000");
  }

  public async stop() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
      this.clients.forEach((socket, clientId) => {
        socket.destroy();
        this._emit("disconnect", clientId);
      });
      this.clients.clear();
      this.clientStates.clear();
      this.idleTimeouts.clearAll();
    }
  }

  public send(clientId: string, message: string | object) {
    const socket = this.clients.get(clientId);
    if (socket) {
      const output = typeof message === "string" ? message : JSON.stringify(message);
      socket.write(output + "\r\n");
    }
  }

  // Add a client to a group
  public addClientToGroup(clientId: string, groupId: string): void {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new Set());
    }
    this.groups.get(groupId)!.add(clientId);
  }

  // Remove a client from a group
  public removeClientFromGroup(clientId: string, groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.delete(clientId);
      if (group.size === 0) {
        this.groups.delete(groupId);
      }
    }
  }

  // Broadcast to a group
  public broadcast(message: string | object, groupId?: string) {
    const output = typeof message === "string" ? message : JSON.stringify(message);
    if (groupId) {
      const group = this.groups.get(groupId);
      if (group) {
        for (const clientId of group) {
          const socket = this.clients.get(clientId);
          if (socket) {
            socket.write(output + "\r\n");
          }
        }
      }
    } else {
      this.clients.forEach((socket) => {
        socket.write(output + "\r\n");
      });
    }
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
    const next = () => {
      const mw = this.middlewares[index++];
      if (mw) mw(clientId, message, next);
      else this._emit("message", clientId, message);
    };
    next();
  }

  public negotiate?(clientId: string, option: string, value: any): void {
    // TODO: Implement Telnet option negotiation (IAC)
  }

  // Telnet-specific public API
  public sendIAC(clientId: string, command: number, option?: number, value?: number): void {
    // TODO: Implement sending Telnet IAC command
  }

  public sendANSI(clientId: string, ansiSequence: string): void {
    // TODO: Implement sending ANSI codes
  }

  public setPrompt(clientId: string, prompt: string): void {
    // TODO: Implement prompt display
  }

  public handleSubnegotiation(clientId: string, type: string, data: any): void {
    // TODO: Implement GMCP/MSSP/MSDP/MXP handling
  }

  public getSocket(clientId: string): net.Socket | undefined {
    return this.clients.get(clientId);
  }

  public setIdleTimeout(clientId: string, ms: number): void {
    this.idleTimeouts.set(clientId, ms, () => {
      const socket = this.clients.get(clientId);
      if (socket) {
        socket.end("Idle timeout.\r\n");
        this.clients.delete(clientId);
        this.clientStates.delete(clientId);
        this._emit("disconnect", clientId);
      }
    });
  }

  // Example private helper
  private _parseTelnetData(data: Buffer): string {
    let text = '';
    for (let i = 0; i < data.length; i++) {
      if (data[i] === 255) { // IAC
        i++; // skip command
        const cmd = data[i];
        if (cmd >= 251 && cmd <= 254) i++; // skip option
        continue; // ignore for now
      }
      text += String.fromCharCode(data[i]);
    }
    return text;
  }

  private _emit(event: string, clientId: string, data?: any) {
    const handlers = this.handlers[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(clientId, data);
      }
    }
  }
}
