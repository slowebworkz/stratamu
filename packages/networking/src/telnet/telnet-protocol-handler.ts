import * as net from "node:net";

export class TelnetProtocolHandler {
  /**
   * Parse incoming Telnet data, handling IAC commands and extracting text
   */
  static parseTelnetData(data: Buffer): string {
    let text = "";
    for (let i = 0; i < data.length; i++) {
      if (data[i] === 255) {
        // IAC (Interpret As Command)
        i++; // skip to command byte
        const cmd = data[i];

        // Commands that have option bytes (WILL, WONT, DO, DONT)
        if (cmd >= 251 && cmd <= 254) {
          i++; // skip option byte
        }
        continue; // ignore IAC sequences for now
      }

      // Convert byte to character, handling common line endings
      const char = data[i];
      if (char === 13) {
        // CR (carriage return)
        // Skip LF if it follows CR
        if (i + 1 < data.length && data[i + 1] === 10) {
          i++; // skip LF
        }
        text += "\n";
      } else if (char === 10) {
        // LF (line feed) without CR
        text += "\n";
      } else if (char >= 32 || char === 9) {
        // printable chars + tab
        text += String.fromCharCode(char);
      }
      // ignore other control characters
    }
    return text;
  }

  /**
   * Send Telnet IAC command
   */
  static sendIAC(socket: net.Socket, command: number, option?: number): void {
    const buffer =
      option !== undefined
        ? Buffer.from([255, command, option]) // IAC + command + option
        : Buffer.from([255, command]); // IAC + command

    socket.write(buffer);
  }

  /**
   * Send ANSI escape sequence
   */
  static sendANSI(socket: net.Socket, ansiSequence: string): void {
    socket.write(`\x1b[${ansiSequence}`);
  }

  /**
   * Send prompt without newline
   */
  static setPrompt(socket: net.Socket, prompt: string): void {
    socket.write(prompt);
  }

  /**
   * Send colored message with ANSI codes
   */
  static sendColoredMessage(
    socket: net.Socket,
    message: string,
    color?: string,
  ): void {
    if (color) {
      const colorCodes: Record<string, string> = {
        red: "31m",
        green: "32m",
        yellow: "33m",
        blue: "34m",
        magenta: "35m",
        cyan: "36m",
        white: "37m",
        bold: "1m",
        reset: "0m",
      };

      const colorCode = colorCodes[color.toLowerCase()] || "0m";
      socket.write(`\x1b[${colorCode}${message}\x1b[0m\r\n`);
    } else {
      socket.write(message + "\r\n");
    }
  }

  /**
   * Handle Telnet option negotiation
   */
  static negotiate(socket: net.Socket, option: string, value: any): void {
    // Handle common options
    switch (option.toLowerCase()) {
      case "echo":
        this.sendIAC(socket, value ? 251 : 252, 1); // WILL/WONT ECHO
        break;
      case "sga":
        this.sendIAC(socket, value ? 251 : 252, 3); // WILL/WONT SUPPRESS-GO-AHEAD
        break;
      default:
        // For unknown options, send WONT
        this.sendIAC(socket, 252, parseInt(option) || 0);
    }
  }

  /**
   * Handle Telnet subnegotiation for GMCP/MSSP/MSDP/MXP
   */
  static handleSubnegotiation(
    socket: net.Socket,
    clientId: string,
    type: string,
    data: any,
  ): void {
    switch (type.toLowerCase()) {
      case "gmcp":
        // Generic MUD Communication Protocol
        if (typeof data === "object") {
          const json = JSON.stringify(data);
          const buffer = Buffer.from([
            255,
            250,
            201,
            ...Buffer.from(json),
            255,
            240,
          ]);
          socket.write(buffer);
        }
        break;
      case "mssp":
        // MUD Server Status Protocol
        console.log(`MSSP data for ${clientId}:`, data);
        break;
      case "msdp":
        // MUD Server Data Protocol
        console.log(`MSDP data for ${clientId}:`, data);
        break;
      case "mxp":
        // MUD eXtension Protocol
        console.log(`MXP data for ${clientId}:`, data);
        break;
      default:
        console.warn(`Unknown subnegotiation type: ${type}`);
    }
  }

  /**
   * Send initial Telnet negotiation
   */
  static sendInitialNegotiation(socket: net.Socket): void {
    // Telnet negotiation: ECHO OFF, SUPPRESS GO-AHEAD
    // IAC DO SUPPRESS GO-AHEAD (255, 253, 3), IAC WILL ECHO (255, 251, 1)
    socket.write(Buffer.from([255, 253, 3])); // DO SUPPRESS GO-AHEAD
    socket.write(Buffer.from([255, 251, 1])); // WILL ECHO
  }
}
