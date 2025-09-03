// gameConstants.ts - Game-specific networking and system constants

/**
 * Base interface for game-specific constants that affect networking behavior
 */
export interface GameNetworkingConstants {
  // Connection limits
  readonly maxConnections: number;
  readonly maxConnectionsPerIP: number;
  readonly defaultPort: number;

  // Timeouts
  readonly idleTimeoutMs: number;
  readonly connectionTimeoutMs?: number;

  // Protocol preferences
  readonly supportedProtocols: string[];
  readonly preferredProtocol: "telnet" | "websocket" | "both";

  // Buffer limits
  readonly maxInputLength: number;
  readonly maxOutputBuffer: number;
  readonly maxCommandHistory: number;
}

/**
 * Extended constants that include game mechanics limits
 */
export interface GameSystemConstants extends GameNetworkingConstants {
  // Player limits
  readonly maxNameLength: number;
  readonly maxPasswordLength: number;
  readonly maxTitleLength: number;
  readonly maxPromptLength: number;

  // Game world limits
  readonly maxLevel: number;
  readonly maxStatValue: number;
  readonly maxRooms: number;
  readonly maxObjects: number;
  readonly maxMobs: number;

  // Communication limits
  readonly maxSayLength: number;
  readonly maxTellLength: number;
  readonly maxChannelLength: number;
  readonly maxEmoteLength: number;
}

/**
 * MUD-specific constants (combat-oriented games)
 */
export interface MUDConstants extends GameSystemConstants {
  readonly gameType: "MUD";
  readonly combatSystem: "turn-based" | "real-time" | "hybrid";
  readonly allowPK: boolean;
  readonly multiclassing: boolean;
}

/**
 * MUSH-specific constants (roleplay-oriented games)
 */
export interface MUSHConstants extends GameSystemConstants {
  readonly gameType: "MUSH";
  readonly posesEnabled: boolean;
  readonly objectCreation: boolean;
  readonly codingAllowed: boolean;
  readonly maxObjectsPerPlayer: number;
}

/**
 * MOO-specific constants (object-oriented games)
 */
export interface MOOConstants extends GameSystemConstants {
  readonly gameType: "MOO";
  readonly programmingAllowed: boolean;
  readonly verbProgramming: boolean;
  readonly maxVerbsPerObject: number;
  readonly maxPropertiesPerObject: number;
}

/**
 * MUCK-specific constants (building/social games)
 */
export interface MUCKConstants extends GameSystemConstants {
  readonly gameType: "MUCK";
  readonly buildingEnabled: boolean;
  readonly mufProgramming: boolean;
  readonly maxRoomsPerPlayer: number;
  readonly maxActionsPerPlayer: number;
}
