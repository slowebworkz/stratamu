// Traditional MUSH constants based on PennMUSH, TinyMUSH, and MUX codebases
import type { MUSHConstants } from "@/types/game-constants";

export const MUSH_CONSTANTS: MUSHConstants = {
  gameType: "MUSH",

  // Networking limits (MUSH servers typically handle more connections)
  maxConnections: 500, // MUSHes often support more concurrent users
  maxConnectionsPerIP: 10, // More lenient for RP environments
  defaultPort: 4201, // Common MUSH port (4201, 4202, etc.)
  idleTimeoutMs: 1800000, // 30 minutes (MUSHes are more social)
  connectionTimeoutMs: 60000, // 60 seconds for connection setup

  // Protocol support
  supportedProtocols: ["telnet", "websocket"],
  preferredProtocol: "telnet",

  // Buffer limits (MUSHes handle longer text)
  maxInputLength: 8192, // Much larger for roleplay poses
  maxOutputBuffer: 65536, // 64KB output buffer for large descriptions
  maxCommandHistory: 50, // More command history for complex RP

  // Player limits (MUSH naming conventions)
  maxNameLength: 30, // Longer names for roleplay characters
  maxPasswordLength: 50, // More secure passwords
  maxTitleLength: 200, // Longer titles for RP descriptions
  maxPromptLength: 256, // Custom prompts are common

  // Game world limits (MUSHes have fewer restrictions)
  maxLevel: 0, // No traditional levels in most MUSHes
  maxStatValue: 10, // Simple attribute systems
  maxRooms: 999999, // Large worlds for storytelling
  maxObjects: 999999, // Many props and items for RP
  maxMobs: 50000, // Fewer NPCs, more player interaction

  // Communication limits (optimized for roleplay)
  maxSayLength: 2048, // Long roleplay poses
  maxTellLength: 1024, // Private RP conversations
  maxChannelLength: 1024, // OOC and IC channels
  maxEmoteLength: 4096, // Very long emotes for detailed RP

  // MUSH-specific settings
  posesEnabled: true, // :pose and ;pose commands
  objectCreation: true, // Players can create objects
  codingAllowed: true, // Softcode programming
  maxObjectsPerPlayer: 1000, // Generous object quota for builders
} as const;
