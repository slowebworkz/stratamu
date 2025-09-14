import type { LifecycleEvents, LifecycleState } from '@stratamu/types'
import type { Promisable } from 'type-fest'
import { BaseClass } from './base'
import type { Args } from './types'

type StateHook<TEvent extends keyof LifecycleEvents = keyof LifecycleEvents> = (
  from: LifecycleState,
  to: LifecycleState,
  payload?: LifecycleEvents[TEvent]
) => Promisable<void>

// Map each state to its valid event(s)
type StateToEventMap = {
  created: never
  initialized: 'init' | 'reset'
  running: 'start' | 'resume'
  suspended: 'suspend'
  stopped: 'stop'
  destroyed: 'destroy'
}

/**
 * LifecycleStateMachine: Provides a state machine and lifecycle events for the game/server.
 * Use this for the main world/server object, not for every class.
 *
 * Now supports onEnter/onExit hooks, event payloads, and optional transition logging.
 */
export class LifecycleStateMachine extends BaseClass<LifecycleEvents> {
  // --- Hook Invocation Helper ---
  private async callHook<T extends StateHook<any>>(
    hook: T | undefined,
    from: LifecycleState,
    to: LifecycleState,
    payload: any
  ) {
    if (!hook) return
    // If the hook expects only from, to (length === 2), skip payload
    const params =
      hook.length === 2
        ? ([from, to] as [LifecycleState, LifecycleState])
        : ([from, to, payload] as [LifecycleState, LifecycleState, any])
    await hook.apply(null, params)
  }

  // --- State ---
  private state: LifecycleState = 'created'
  private readonly validTransitions: Record<LifecycleState, LifecycleState[]> =
    {
      created: ['initialized'],
      initialized: ['running', 'destroyed'],
      running: ['suspended', 'stopped', 'initialized'],
      suspended: ['running', 'stopped', 'initialized'],
      stopped: ['destroyed', 'initialized'],
      destroyed: []
    }

  // --- Hooks ---
  private onEnterHooks: Partial<{
    [S in keyof StateToEventMap]: StateHook<StateToEventMap[S]>
  }> = {}
  private onExitHooks: Partial<{
    [S in keyof StateToEventMap]: StateHook<StateToEventMap[S]>
  }> = {}

  // --- Config ---
  private _logging = false

  /**
   * Enable or disable lifecycle transition logging (property).
   */
  get logging(): boolean {
    return this._logging
  }
  set logging(enabled: boolean) {
    this._logging = enabled
  }

  // --- State Query ---
  getState(): LifecycleState {
    return this.state
  }
  isRunning(): boolean {
    return this.state === 'running'
  }
  isDestroyed(): boolean {
    return this.state === 'destroyed'
  }

  // --- Lifecycle Methods ---
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

  // --- Hook Registration ---
  /**
   * Register a hook to run when entering a state. Overloaded for correct payload type.
   */
  onEnter<S extends keyof StateToEventMap>(
    state: S,
    hook: StateHook<StateToEventMap[S]>
  ) {
    ;(this.onEnterHooks as any)[state] = hook
  }

  /**
   * Register a hook to run when exiting a state. Overloaded for correct payload type.
   */
  onExit<S extends keyof StateToEventMap>(
    state: S,
    hook: StateHook<StateToEventMap[S]>
  ) {
    ;(this.onExitHooks as any)[state] = hook
    ;(this.onExitHooks as any)[state] = hook
  }

  // --- Private Helpers ---
  protected onInvalidTransition(from: LifecycleState, to: LifecycleState) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
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
      console.log(
        `[Lifecycle] ${from} → ${to}${payload ? ` (payload: ${JSON.stringify(payload)})` : ''}`
      )
    }
    if (this.onExitHooks[from]) {
      try {
        await this.callHook(this.onExitHooks[from], from, to, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Lifecycle] onExit hook failed for state ${from}:`, err)
      }
    }
    this.state = to
    if (this.onEnterHooks[to]) {
      try {
        await this.callHook(this.onEnterHooks[to], from, to, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Lifecycle] onEnter hook failed for state ${to}:`, err)
      }
    }
    await this.emitSafe(
      event,
      ...(payload === undefined
        ? ([] as Args<LifecycleEvents[K]>)
        : ([payload] as Args<LifecycleEvents[K]>))
    )
  }
}
