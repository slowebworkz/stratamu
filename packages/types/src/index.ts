// Entry point for all shared types
export * from './config/index.js'
export * from './game/index.js'
export * from './networking/index.js'
export * from './types.js'

// Dummy runtime export to satisfy Vite/Node ESM import checks
export const __stratamu_types_runtime = true
