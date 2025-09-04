// Traditional MUD constants based on CircleMUD, DikuMUD, and ROM codebases
import type { MUDConstants } from '../types/game-constants'

export const MUD_CONSTANTS: MUDConstants = {
  gameType: 'MUD',

  // Networking limits (based on CircleMUD defaults)
  maxConnections: 300, // CircleMUD standard
  maxConnectionsPerIP: 5, // Anti-abuse while allowing alts
  defaultPort: 4000, // Traditional MUD port
  idleTimeoutMs: 900000, // 15 minutes (CircleMUD default)
  connectionTimeoutMs: 30000, // 30 seconds for connection setup

  // Protocol support
  supportedProtocols: ['telnet', 'websocket'],
  preferredProtocol: 'telnet',

  // Buffer limits
  maxInputLength: 512, // MAX_INPUT_LENGTH in CircleMUD
  maxOutputBuffer: 32768, // 32KB output buffer
  maxCommandHistory: 20, // Command recall history

  // Player limits (DikuMUD/CircleMUD standards)
  maxNameLength: 20, // MAX_NAME_LENGTH
  maxPasswordLength: 30, // MAX_PWD_LENGTH
  maxTitleLength: 80, // MAX_TITLE_LENGTH
  maxPromptLength: 96, // MAX_PROMPT_LENGTH

  // Game world limits (16-bit safe values)
  maxLevel: 110, // LVL_IMPL in CircleMUD
  maxStatValue: 25, // Traditional D&D-style stats
  maxRooms: 99999, // 5-digit room numbers
  maxObjects: 99999, // 5-digit object IDs
  maxMobs: 99999, // 5-digit mobile IDs

  // Communication limits
  maxSayLength: 256, // MAX_STRING_LENGTH for say
  maxTellLength: 256, // MAX_STRING_LENGTH for tell
  maxChannelLength: 256, // Channel communications
  maxEmoteLength: 512, // Emotes can be longer

  // MUD-specific settings
  combatSystem: 'turn-based', // Traditional round-based combat
  allowPK: true, // Player vs Player combat
  multiclassing: false // Single class (CircleMUD style)
} as const
