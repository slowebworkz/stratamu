// Shared event contract for game-wide event emitters

export interface GameEvents {
  init: void
  start: void
  suspend: void
  stop: void
  destroy: void

  'player:connect': { id: string; name: string }
  'player:disconnect': { id: string }
  'room:enter': { playerId: string; roomId: string }
  'room:leave': { playerId: string; roomId: string }
  'combat:start': { attacker: string; target: string }
  'combat:end': { winner: string; loser: string }
}
