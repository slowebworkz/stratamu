import type { Simplify, ValueOf } from 'type-fest'
import { BaseClass } from './BaseClass'

// --- Robust, readable types ---
export type StateName = string
export type EventName = string
export type EventPayloadMap<EVENT extends EventName = EventName> = Record<
  EVENT,
  unknown
>

export type StateTransitionMap<STATE extends StateName> = Record<STATE, STATE[]>

export type TransitionContext<
  STATE extends StateName = StateName,
  EVENT extends EventName = EventName,
  PAYLOADS extends EventPayloadMap<EVENT> = EventPayloadMap<EVENT>
> = Simplify<{
  from: STATE
  to: STATE
  event: EVENT
  payload?: ValueOf<PAYLOADS>
}>

export type StateMachineEventMap<
  STATE extends StateName,
  EVENT extends EventName,
  PAYLOADS extends EventPayloadMap<EVENT>
> = {
  transition: TransitionContext<STATE, EVENT, PAYLOADS>
} & {
  [K in EVENT]: PAYLOADS[K]
}

// --- Generic StateMachine class ---
export class StateMachine<
  STATE extends StateName,
  EVENT extends EventName,
  PAYLOADS extends EventPayloadMap<EVENT> = EventPayloadMap<EVENT>
> extends BaseClass<StateMachineEventMap<STATE, EVENT, PAYLOADS>> {
  protected state: STATE
  protected readonly transitions: StateTransitionMap<STATE>

  constructor(initial: STATE, transitions: StateTransitionMap<STATE>) {
    super()
    this.state = initial
    this.transitions = transitions
  }

  getState(): STATE {
    return this.state
  }

  canTransition(to: STATE): boolean {
    return this.transitions[this.state]?.includes(to) ?? false
  }

  async transition<EVT extends EVENT>(
    to: STATE,
    event: EVT,
    payload?: PAYLOADS[EVT]
  ): Promise<void> {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid transition: ${this.state} → ${to}`)
    }
    const ctx: TransitionContext<STATE, EVENT, PAYLOADS> = {
      from: this.state,
      to,
      event,
      payload
    }
    await super.emit('transition', ctx as any)
    this.state = to
    await super.emit(event as any, payload as any)
  }
}
