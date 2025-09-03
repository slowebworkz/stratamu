# Game Adapter Architecture: Hardcoded Constants Pattern

## Overview

You asked a great question: **"Should game-specific constants like max
connections, port numbers, etc. be hardcoded in game adapters and passed to
TelnetAdapter when instantiating?"**

**Answer: Yes, absolutely!** This is the correct architectural approach.

## Why This Pattern Works

### ✅ Separation of Concerns

- **Networking Layer**: Generic, reusable across game types
- **Game Adapters**: Define game-specific rules and limits
- **Clear Boundary**: Game logic stays in game adapters, networking stays
  protocol-focused

### ✅ Maintainability

- Game constants in one place per game type
- Easy to modify limits without touching networking code
- Clear documentation of what each game type supports

### ✅ Extensibility

- New game types just define their own constants
- Networking layer doesn't need changes for new games
- Can override defaults per instance if needed

## Implementation Pattern

### 1. Game Constants Definition

```typescript
// In each game adapter package
export const MUD_CONSTANTS = {
  gameType: 'MUD',
  maxConnections: 300, // CircleMUD standard
  maxConnectionsPerIP: 5, // Anti-abuse
  defaultPort: 4000, // Traditional MUD port
  idleTimeoutMs: 900000 // 15 minutes
  // ... other MUD-specific limits
} as const

export const MUSH_CONSTANTS = {
  gameType: 'MUSH',
  maxConnections: 500, // MUSHes support more users
  maxConnectionsPerIP: 10, // More lenient for RP
  defaultPort: 4201, // Common MUSH port
  idleTimeoutMs: 1800000 // 30 minutes (more social)
  // ... other MUSH-specific limits
} as const
```

### 2. Configuration Factory

```typescript
// Convert game constants to networking config
function createTelnetConfig(
  gameConstants: GameNetworkingConstants
): TelnetConfig {
  return {
    port: gameConstants.defaultPort,
    idleTimeoutMs: gameConstants.idleTimeoutMs,
    maxConnections: gameConstants.maxConnections,
    maxConnectionsPerIP: gameConstants.maxConnectionsPerIP
  }
}
```

### 3. Game Adapter Usage

```typescript
// In MUD game adapter
export class MUDGameAdapter {
  async start() {
    // 1. Use game-specific constants
    const gameConstants = MUD_CONSTANTS

    // 2. Convert to networking config
    const telnetConfig = createTelnetConfig(gameConstants)

    // 3. Pass to networking layer
    const adapter = new TelnetAdapter()
    await adapter.start(telnetConfig)

    console.log(
      `MUD Server: ${telnetConfig.port}, max: ${telnetConfig.maxConnections}`
    )
  }
}
```

## Traditional MUD Constants We Researched

Based on CircleMUD, DikuMUD, ROM, and other classic codebases:

### MUD (Combat-oriented)

- **Port**: 4000 (de facto standard)
- **Max Connections**: 100-300 players
- **Max Per IP**: 3-5 connections
- **Idle Timeout**: 10-15 minutes
- **Focus**: Fast-paced combat, lower limits

### MUSH (Roleplay-oriented)

- **Port**: 4201, 4202, etc.
- **Max Connections**: 300-500 players
- **Max Per IP**: 5-10 connections
- **Idle Timeout**: 30-60 minutes
- **Focus**: Social RP, higher limits

### MOO (Programming-oriented)

- **Port**: 8888 (common)
- **Max Connections**: 100-200 players
- **Max Per IP**: 2-3 connections
- **Idle Timeout**: 60+ minutes
- **Focus**: Programming, security-conscious

### MUCK (Building/Social)

- **Port**: 8888, varies
- **Max Connections**: 50-150 players
- **Max Per IP**: 3-4 connections
- **Idle Timeout**: 30-45 minutes
- **Focus**: Building, moderate limits

## Benefits of This Architecture

1. **Historical Accuracy**: Each game type uses limits proven by decades of
   traditional servers
2. **Flexibility**: Can override defaults per instance while keeping sane
   game-type defaults
3. **Documentation**: Constants serve as living documentation of game type
   characteristics
4. **Validation**: Can validate constants are within reasonable ranges before
   use
5. **Evolution**: Game types can evolve their constants based on modern
   hardware/network capabilities

## Files Created

- `types/gameConstants.ts` - Type definitions for game constants
- `constants/mudConstants.ts` - MUD-specific constants
- `constants/mushConstants.ts` - MUSH-specific constants
- `constants/mooConstants.ts` - MOO-specific constants
- `constants/muckConstants.ts` - MUCK-specific constants
- `utils/configFactory.ts` - Conversion utilities
- `adapters/mud-adapter/example.ts` - Usage example

## Summary

Your instinct was exactly right! Game adapters should define their constants and
pass them to the networking layer. This creates a clean separation where:

- **TelnetAdapter**: Generic, configurable networking
- **Game Adapters**: Game-specific rules and constants
- **Clear Interface**: Configuration objects bridge the gap

This pattern is used by many successful modular systems and keeps the codebase
maintainable as you add more game types.
