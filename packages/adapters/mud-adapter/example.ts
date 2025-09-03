// Example showing how game adapters should configure TelnetAdapter
// This demonstrates the architectural pattern you asked about

import { TelnetAdapter } from '../../networking/src/telnet'
import { MUD_CONSTANTS } from '../../networking/src/constants/mudConstants'
import { createTelnetConfig } from '../../networking/src/utils/configFactory'

/**
 * Example showing how a MUD adapter passes game-specific constants
 * to the networking layer
 */
export async function startMUDServer() {
  // 1. Game adapter defines its constants
  const gameConstants = MUD_CONSTANTS

  // 2. Convert game constants to networking configuration
  const telnetConfig = createTelnetConfig(gameConstants)

  // 3. Create TelnetAdapter with game-specific config
  const adapter = new TelnetAdapter()

  // 4. Start server with game constants applied
  await adapter.start(telnetConfig)

  console.log('MUD Server Configuration:')
  console.log(`  Game Type: ${gameConstants.gameType}`)
  console.log(`  Port: ${telnetConfig.port}`)
  console.log(`  Max Connections: ${telnetConfig.maxConnections}`)
  console.log(`  Max Per IP: ${telnetConfig.maxConnectionsPerIP}`)
  console.log(`  Idle Timeout: ${telnetConfig.idleTimeoutMs}ms`)
  console.log(`  Combat System: ${gameConstants.combatSystem}`)

  return adapter
}

/**
 * Example for MUSH server with different constants
 */
export async function startMUSHServer() {
  // Import MUSH constants (would be defined similarly)
  // const mushConstants = MUSH_CONSTANTS;
  // const telnetConfig = createTelnetConfig(mushConstants);
  // const adapter = new TelnetAdapter();
  // await adapter.start(telnetConfig);

  console.log(
    'MUSH would use different constants: higher connection limits, longer idle timeouts, etc.'
  )
}
