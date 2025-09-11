
import type { LifecycleEvents, LifecycleState } from '@stratamu/types'
import type { Promisable } from 'type-fest'
import type { Args } from './types'
import { BaseClass } from './base'


type StateHook<TEvent extends keyof LifecycleEvents = keyof LifecycleEvents> = (
  from: LifecycleState,
  to: LifecycleState,
  payload?: LifecycleEvents[TEvent]
) => Promisable<void>


/**
 * LifecycleStateMachine: Provides a state machine and lifecycle events for the game/server.
 * Use this for the main world/server object, not for every class.
 *
 * Now supports onEnter/onExit hooks, event payloads, and optional transition logging.
 */
export class LifecycleStateMachine extends BaseClass<LifecycleEvents> {
  private state: LifecycleState = 'created'

  private readonly validTransitions: Record<LifecycleState, LifecycleState[]> = {
    created: ['initialized'],
    initialized: ['running', 'destroyed'],
    running: ['suspended', 'stopped', 'initialized'],
    suspended: ['running', 'stopped', 'initialized'],
    stopped: ['destroyed', 'initialized'],
    destroyed: []
  }

  // Optional hooks for side effects
  private onEnterHooks: Partial<Record<LifecycleState, StateHook>> = {}
  private onExitHooks: Partial<Record<LifecycleState, StateHook>> = {}

  // Enable/disable logging
  public logging = false

  protected onInvalidTransition(from: LifecycleState, to: LifecycleState) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }

  /**
   * Register a hook to run when entering a state.
   */
  onEnter(state: LifecycleState, hook: StateHook) {
    this.onEnterHooks[state] = hook
  }

  /**
   * Register a hook to run when exiting a state.
   */
  onExit(state: LifecycleState, hook: StateHook) {
    this.onExitHooks[state] = hook
  }

  private async transition<K extends keyof LifecycleEvents>(
    to: LifecycleState,
    event: K,
    payload?: LifecycleEvents[K]
  ): Promise<void> {
    const from = this.state
    const allowed = this.validTransitions[from]
    if (!allowed.includes(to)) {
      return this.onInvalidTransition(from, to)
    }
    if (this.logging) {
      // eslint-disable-next-line no-console
      console.log(`[Lifecycle] ${from} → ${to}${payload ? ` (payload: ${JSON.stringify(payload)})` : ''}`)
    }
    if (this.onExitHooks[from]) {
      await this.onExitHooks[from]?.(from, to, payload)
    }
    this.state = to
    if (this.onEnterHooks[to]) {
      await this.onEnterHooks[to]?.(from, to, payload)
    }
    await this.emitSafe(
      event,
      ...(
        payload === undefined
          ? ([] as Args<LifecycleEvents[K]>)
          : ([payload] as Args<LifecycleEvents[K]>)
      )
    )
  }

  async init(payload?: LifecycleEvents['init']) {
    await this.transition('initialized', 'init', payload)
  }

  async start(payload?: LifecycleEvents['start']) {
    await this.transition('running', 'start', payload)
  }

  async resume(payload?: LifecycleEvents['resume']) {
    await this.transition('running', 'resume', payload)
  }

  async suspend(payload?: LifecycleEvents['suspend']) {
    await this.transition('suspended', 'suspend', payload)
  }

  async stop(payload?: LifecycleEvents['stop']) {
    await this.transition('stopped', 'stop', payload)
  }

  async reset(payload?: LifecycleEvents['reset']) {
    await this.transition('initialized', 'reset', payload)
  }

  async destroy(payload?: LifecycleEvents['destroy']) {
    await this.transition('destroyed', 'destroy', payload)
  }

  getState(): LifecycleState {
    return this.state
  }
}
