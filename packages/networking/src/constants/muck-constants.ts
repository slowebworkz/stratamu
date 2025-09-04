// MUCK constants based on Fuzzball MUCK and other MUCK servers
import type { MUCKConstants } from '../types/game-constants'

export const MUCK_CONSTANTS: MUCKConstants = {
  gameType: 'MUCK',

  // Networking limits (MUCKs focus on building and social)
  maxConnections: 150, // Smaller communities
  maxConnectionsPerIP: 4, // Moderate limits
  defaultPort: 8888, // Common MUCK port
  idleTimeoutMs: 2700000, // 45 minutes (builders need time)
  connectionTimeoutMs: 40000, // 40 seconds

  // Protocol support
  supportedProtocols: ['telnet'],
  preferredProtocol: 'telnet', // Traditional Telnet

  // Buffer limits
  maxInputLength: 2048, // Building commands can be long
  maxOutputBuffer: 24576, // 24KB buffer
  maxCommandHistory: 25, // Building command history

  // Player limits
  maxNameLength: 16, // Shorter names (traditional)
  maxPasswordLength: 32, // Standard passwords
  maxTitleLength: 120, // Building-oriented titles
  maxPromptLength: 80, // Simple prompts

  // Game world limits (building-focused)
  maxLevel: 50, // Some MUCKs have levels
  maxStatValue: 20, // Simple stats
  maxRooms: 50000, // Reasonable world size
  maxObjects: 200000, // Many building objects
  maxMobs: 5000, // Few NPCs, more player interaction

  // Communication limits
  maxSayLength: 1024, // Social communication
  maxTellLength: 512, // Private messages
  maxChannelLength: 512, // OOC channels
  maxEmoteLength: 2048, // Building-related emotes

  // MUCK-specific settings
  buildingEnabled: true, // Core feature
  mufProgramming: true, // MUF (Multi-User Forth) programming
  maxRoomsPerPlayer: 500, // Generous building quota
  maxActionsPerPlayer: 200 // Custom MUF actions per player
} as const
