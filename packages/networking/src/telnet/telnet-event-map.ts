// Telnet event map for type-safe event handling
export type TelnetEventMap = {
  connect: (clientId: string) => void
  disconnect: (clientId: string) => void
  error: (clientId: string, data?: any) => void
  message: (clientId: string, data?: any) => void
}
