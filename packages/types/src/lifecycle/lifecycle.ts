// Shared lifecycle state and event contract for all emitters

export type LifecycleState =
  | 'created'
  | 'initialized'
  | 'running'
  | 'suspended'
  | 'stopped'
  | 'destroyed'
