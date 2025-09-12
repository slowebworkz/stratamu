import type { Opaque, ReadonlyDeep } from 'type-fest'

export type PlayerId = Opaque<string, 'PlayerId'>
export type RoomId = Opaque<string, 'RoomId'>

export interface GameEvents {
  init: void
  start: void
  suspend: void
  stop: void
  destroy: void

  'player:connect': ReadonlyDeep<{ id: PlayerId; name: string }>
  'player:disconnect': ReadonlyDeep<{ id: PlayerId }>
  'room:enter': ReadonlyDeep<{ playerId: PlayerId; roomId: RoomId }>
  'room:leave': ReadonlyDeep<{ playerId: PlayerId; roomId: RoomId }>
  'combat:start': ReadonlyDeep<{ attacker: PlayerId; target: PlayerId }>
  'combat:end': ReadonlyDeep<{ winner: PlayerId; loser: PlayerId }>
}
