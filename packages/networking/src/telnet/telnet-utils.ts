import { TelnetProtocolHandler } from './telnet-protocol-handler'
import type * as net from 'node:net'

export function sendIAC(
  socket: net.Socket,
  command: number,
  option?: number
): void {
  TelnetProtocolHandler.sendIAC(socket, command, option)
}

export function sendANSI(socket: net.Socket, ansiSequence: string): void {
  TelnetProtocolHandler.sendANSI(socket, ansiSequence)
}

export function setPrompt(socket: net.Socket, prompt: string): void {
  TelnetProtocolHandler.setPrompt(socket, prompt)
}

export function handleSubnegotiation(
  socket: net.Socket,
  clientId: string,
  type: string,
  data: any
): void {
  TelnetProtocolHandler.handleSubnegotiation(socket, clientId, type, data)
}

export function sendColoredMessage(
  socket: net.Socket,
  message: string,
  color?: string
): void {
  TelnetProtocolHandler.sendColoredMessage(socket, message, color)
}
