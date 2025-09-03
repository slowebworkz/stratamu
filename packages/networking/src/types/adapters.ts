// adapters.ts - Core networking adapter interfaces

/**
 * Minimal, protocol-agnostic interface for networking adapters.
 */
export interface NetworkAdapter {
  // Connection management
  start(): Promise<void>
  stop(): Promise<void>

  // Messaging
  send(clientId: string, message: string | object): void
  broadcast(message: string | object, groupId?: string): void
  on(
    event: 'connect' | 'disconnect' | 'error' | 'message',
    handler: (clientId: string, data?: any) => void
  ): void

  // Session/state
  getClientState(clientId: string): Record<string, any>
  setClientState(clientId: string, state: Record<string, any>): void

  // Middleware (optional)
  use?(
    middleware: (clientId: string, message: any, next: () => void) => void
  ): void

  // Option negotiation (for Telnet, no-op for others)
  negotiate?(clientId: string, option: string, value: any): void
}

/**
 * Protocol/client-specific feature interfaces
 */
export interface AnsiSupport {
  sendANSI(clientId: string, ansiSequence: string): void
}

export interface PuebloSupport {
  sendPuebloMarkup(clientId: string, markup: string): void
}

export interface MXPSupport {
  sendMXPTag(clientId: string, tag: string): void
}

export interface GMCPSupport {
  sendGMCP(clientId: string, json: object): void
}

export interface MSSPSupport {
  sendMSSP(clientId: string, info: object): void
}

export interface MSDPSupport {
  sendMSDP(clientId: string, data: object): void
}

export interface PromptSupport {
  setPrompt(clientId: string, prompt: string): void
}

export interface BellSupport {
  sendBell(clientId: string): void
}
