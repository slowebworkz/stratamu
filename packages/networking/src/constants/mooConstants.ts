// MOO constants based on LambdaMOO and other MOO servers
import type { MOOConstants } from '@/types/gameConstants';

export const MOO_CONSTANTS: MOOConstants = {
  gameType: 'MOO',

  // Networking limits (MOOs are programming-heavy)
  maxConnections: 200,           // Moderate concurrent users
  maxConnectionsPerIP: 3,        // Stricter to prevent abuse of programming features
  defaultPort: 8888,             // Common MOO port
  idleTimeoutMs: 3600000,        // 1 hour (programmers need time)
  connectionTimeoutMs: 45000,    // 45 seconds

  // Protocol support
  supportedProtocols: ['telnet'],
  preferredProtocol: 'telnet',   // MOOs traditionally Telnet-only

  // Buffer limits
  maxInputLength: 1024,          // Programming commands can be long
  maxOutputBuffer: 32768,        // Standard buffer
  maxCommandHistory: 30,         // Programming history is useful

  // Player limits
  maxNameLength: 24,             // Moderate name length
  maxPasswordLength: 40,         // Secure passwords for programmers
  maxTitleLength: 100,           // Standard titles
  maxPromptLength: 128,          // Custom prompts

  // Game world limits
  maxLevel: 0,                   // No traditional levels
  maxStatValue: 100,             // Arbitrary numeric properties
  maxRooms: 100000,              // Object-oriented rooms
  maxObjects: 500000,            // Everything is an object in MOO
  maxMobs: 10000,                // Fewer traditional NPCs

  // Communication limits
  maxSayLength: 512,             // Standard communication
  maxTellLength: 512,            // Private messages
  maxChannelLength: 512,         // Channel communications
  maxEmoteLength: 1024,          // Reasonable emote length

  // MOO-specific settings
  programmingAllowed: true,      // Core feature of MOOs
  verbProgramming: true,         // Verb definitions on objects
  maxVerbsPerObject: 100,        // Reasonable verb limit
  maxPropertiesPerObject: 200    // Object property limit
} as const;
