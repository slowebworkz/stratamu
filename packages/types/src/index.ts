// Entry point for all shared types
export type {
  ConnectionLimits,
  TelnetConfig
} from './adapters/telnet-config.js'
export * from './config/index.js'
export * from './game/index.js'
export * from './lifecycle-events.js'
export * from './lifecycle/index.js'
export * from './networking/index.js'
export * from './telnet.js'
export * from './types.js'

// Dummy runtime export to satisfy Vite/Node ESM import checks
export const __stratamu_types_runtime = true
