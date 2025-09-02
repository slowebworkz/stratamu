import * as net from "node:net";
import { ConnectionLimits } from "@/types";

export { ConnectionLimits };

export class ConnectionManager {
  private clients: Map<string, net.Socket> = new Map();
  private connectionCounts = new Map<string, number>();
  private connectionTimes = new Map<string, Date>();

  constructor(private limits: ConnectionLimits) { }

  canAcceptConnection(totalConnections: number, remoteAddress?: string): boolean {
    // Check total connections
    if (totalConnections >= this.limits.maxConnections) {
      return false;
    }

    // Check connections per IP
    if (remoteAddress) {
      const ipConnections = this.connectionCounts.get(remoteAddress) || 0;
      if (ipConnections >= this.limits.maxConnectionsPerIP) {
        return false;
      }
    }

    return true;
  }

  addClient(clientId: string, socket: net.Socket): void {
    this.clients.set(clientId, socket);
    this.connectionTimes.set(clientId, new Date());

    // Track IP connections
    if (socket.remoteAddress) {
      const current = this.connectionCounts.get(socket.remoteAddress) || 0;
      this.connectionCounts.set(socket.remoteAddress, current + 1);
    }
  }

  removeClient(clientId: string): void {
    const socket = this.clients.get(clientId);

    // Update connection count for rate limiting
    if (socket?.remoteAddress) {
      const currentCount = this.connectionCounts.get(socket.remoteAddress) || 0;
      if (currentCount <= 1) {
        this.connectionCounts.delete(socket.remoteAddress);
      } else {
        this.connectionCounts.set(socket.remoteAddress, currentCount - 1);
      }
    }

    this.clients.delete(clientId);
    this.connectionTimes.delete(clientId);
  }

  getClient(clientId: string): net.Socket | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): Map<string, net.Socket> {
    return this.clients;
  }

  getConnectionInfo(clientId: string): { ip?: string, port?: number, connected: Date } | null {
    const socket = this.clients.get(clientId);
    const connectedTime = this.connectionTimes.get(clientId);

    if (!socket) return null;

    return {
      ip: socket.remoteAddress,
      port: socket.remotePort,
      connected: connectedTime || new Date()
    };
  }

  getActiveConnections(): number {
    return this.clients.size;
  }

  getConnectionsByIP(): Map<string, number> {
    return new Map(this.connectionCounts);
  }

  clear(): void {
    this.clients.clear();
    this.connectionCounts.clear();
    this.connectionTimes.clear();
  }
}
