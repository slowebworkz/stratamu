// Core entity types for game world storage (MUSH/MUD compatible)

export type EntityType =
  | 'player'
  | 'room'
  | 'item'
  | 'npc'
  | 'exit'
  | 'zone'
  | string

export interface BaseEntity {
  id: string // Unique identifier
  type: EntityType // Type of entity
  name: string // Display name
  description?: string // Textual description
  locationId?: string // Reference to parent location (room, container)
  ownerId?: string // Who owns this entity, if applicable
  createdAt: number // Unix timestamp
  updatedAt: number // Unix timestamp
  flags?: Record<string, boolean> // Game-specific boolean flags
  attributes?: Record<string, any> // Arbitrary key/value attributes
}

// Example: Specialized entity extensions
export interface PlayerEntity extends BaseEntity {
  type: 'player'
  attributes: {
    passwordHash?: string
    email?: string
    lastLogin?: number
    [key: string]: any
  }
}

export interface RoomEntity extends BaseEntity {
  type: 'room'
  exits?: string[] // IDs of exit entities
  contents?: string[] // IDs of entities in this room
}

export interface ExitEntity extends BaseEntity {
  type: 'exit'
  destinationId: string // ID of the room/entity this exit leads to
}

// Union type for all known entities
export type GameEntity = BaseEntity | PlayerEntity | RoomEntity | ExitEntity
