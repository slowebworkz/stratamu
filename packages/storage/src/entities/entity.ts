/**
 * Map of entity IDs to tracked game entities.
 */
export type EntityMap = Map<string, GameEntity>
/**
 * Attributes specific to NPC (non-player character) entities.
 * Extend as needed for stats, AI, etc.
 */
export interface NpcEntityAttributes {
  /** NPC's level or difficulty rating. */
  level?: number
  /** Optional: Faction or alignment. */
  faction?: string
  /** Optional: List of skills or abilities. */
  abilities?: string[]
  /** Optional: Custom attributes for NPCs. */
  [key: string]: unknown
}

/**
 * Specialized entity for non-player characters (NPCs).
 * Includes NPC-specific attributes.
 */
export interface NpcEntity extends BaseEntity {
  /** Always 'npc'. */
  type: 'npc'
  /** NPC-specific attributes (partial, extensible). */
  attributes: Simplify<Partial<NpcEntityAttributes> & { [x: string]: unknown }>
}

/**
 * Attributes specific to item entities.
 * Extend as needed for stats, effects, etc.
 */
export interface ItemEntityAttributes {
  /** Item's weight or encumbrance value. */
  weight?: number
  /** Optional: Value in in-game currency. */
  value?: number
  /** Optional: List of effects or modifiers. */
  effects?: string[]
  /** Optional: Custom attributes for items. */
  [key: string]: unknown
}

/**
 * Specialized entity for items (objects, equipment, etc.).
 * Includes item-specific attributes.
 */
export interface ItemEntity extends BaseEntity {
  /** Always 'item'. */
  type: 'item'
  /** Item-specific attributes (partial, extensible). */
  attributes: Simplify<Partial<ItemEntityAttributes> & { [x: string]: unknown }>
}
/**
 * Core entity types for game world storage (MUSH/MUD compatible).
 * Use this as the foundation for all in-game objects, rooms, players, etc.
 */
import { Simplify } from 'type-fest'

/**
 * List of canonical entity types for the game world.
 * Extendable for custom types.
 */
export const Entities = [
  'player',
  'room',
  'item',
  'npc',
  'exit',
  'zone'
] as const

/**
 * Type union of all canonical entity types.
 */
export type EntityType = (typeof Entities)[number]

/**
 * The base interface for all entities in the game world.
 * Provides common fields for identification, ownership, and extensibility.
 */
export interface BaseEntity {
  /** Unique identifier for this entity (should be globally unique). */
  id: string
  /** The type/category of this entity (e.g., 'player', 'room', etc.). */
  type: EntityType
  /** Human-readable display name for the entity. */
  name: string
  /** Optional: Textual description for in-game display. */
  description?: string
  /** Optional: ID of the parent location (room, container, etc.). */
  locationId?: string
  /** Optional: ID of the owner/controller of this entity. */
  ownerId?: string
  /** Creation timestamp (Unix epoch, ms). */
  createdAt: number
  /** Last update timestamp (Unix epoch, ms). */
  updatedAt: number
  /** Optional: Game-specific boolean flags (e.g., locked, hidden). */
  flags?: Record<string, boolean>
  /** Optional: Arbitrary key/value attributes for extensibility. */
  attributes?: Record<string, unknown>
}

/**
 * Attributes specific to player entities.
 * Extend or override as needed for authentication, profile, etc.
 */
export interface PlayerEntityAttributes {
  /** Hashed password for authentication. */
  passwordHash: string
  /** Player's email address. */
  email: string
  /** Last login timestamp (ISO string or Unix epoch). */
  lastLogin: string
}

/**
 * Specialized entity for players.
 * Includes player-specific attributes.
 */
export interface PlayerEntity extends BaseEntity {
  /** Always 'player'. */
  type: 'player'
  /** Player-specific attributes (partial, extensible). */
  attributes: Simplify<
    Partial<PlayerEntityAttributes> & { [x: string]: unknown }
  >
}

/**
 * Specialized entity for rooms/locations.
 * Contains exits and contents for navigation and containment.
 */
export interface RoomEntity extends BaseEntity {
  /** Always 'room'. */
  type: 'room'
  /**
   * IDs of exit entities leading out of this room (e.g., doors, portals).
   */
  exits?: string[]
  /**
   * IDs of entities currently in this room (items, NPCs, players, etc.).
   */
  contents?: string[]
}

/**
 * Specialized entity for exits (doors, portals, etc.).
 * Connects rooms and may be owned/locked.
 */
export interface ExitEntity extends BaseEntity {
  /** Always 'exit'. */
  type: 'exit'
  /**
   * ID of the room/entity this exit leads to.
   */
  destinationId: string
  /**
   * Optional: Who owns/controls this exit (for locked/private exits).
   */
  ownerId?: string
}

/**
 * Union type for all known entity variants in the game world.
 * Extend this as you add more specialized entities.
 */
export type GameEntity =
  | BaseEntity
  | PlayerEntity
  | RoomEntity
  | ExitEntity
  | NpcEntity
  | ItemEntity
