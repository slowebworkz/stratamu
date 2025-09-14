import type { LifecycleEvents, LifecycleState } from '@stratamu/types'
import type { Promisable } from 'type-fest'
import { BaseClass } from './BaseClass'
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
 * LifecycleStateMachine provides a robust, extensible state machine for managing
 * the lifecycle of a game world, server, or other long-lived system.
 *
 * Features:
 * - Strongly-typed states and events (see LifecycleState, LifecycleEvents)
 * - Validates all state transitions (throws on invalid transitions)
 * - Supports onEnter/onExit hooks for each state (with correct payload typing)
 * - Emits events on each transition (with optional payload)
 * - Optional transition logging for debugging
 *
 * Usage:
 *   const machine = new LifecycleStateMachine();
 *   machine.onEnter('running', (from, to, payload) => { ... });
 *   await machine.start();
 *
 * Note: This is intended for the main world/server object, not for every class.
 */
export class LifecycleStateMachine extends BaseClass<LifecycleEvents> {
  /**
   * Helper to invoke a state hook (onEnter/onExit), handling arity and payload.
   * @param hook The hook function (or undefined).
   * @param from The previous state.
   * @param to The new state.
   * @param payload Optional event payload.
   */
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

  /**
   * The current lifecycle state.
   */
  private state: LifecycleState = 'created'

  /**
   * Map of valid state transitions.
   * Each state lists the states it can transition to.
   */
  private readonly validTransitions: Record<LifecycleState, LifecycleState[]> =
    {
      created: ['initialized'],
      initialized: ['running', 'destroyed'],
      running: ['suspended', 'stopped', 'initialized'],
      suspended: ['running', 'stopped', 'initialized'],
      stopped: ['destroyed', 'initialized'],
      destroyed: []
    }

  /**
   * Registered onEnter hooks for each state.
   * Use onEnter(state, hook) to register.
   */
  private onEnterHooks: Partial<{
    [S in keyof StateToEventMap]: StateHook<StateToEventMap[S]>
  }> = {}

  /**
   * Registered onExit hooks for each state.
   * Use onExit(state, hook) to register.
   */
  private onExitHooks: Partial<{
    [S in keyof StateToEventMap]: StateHook<StateToEventMap[S]>
  }> = {}

  /**
   * Whether to log all state transitions to the console.
   */
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

  /**
   * Get the current state.
   */
  getState(): LifecycleState {
    return this.state
  }

  /**
   * Returns true if the state is 'running'.
   */
  isRunning(): boolean {
    return this.state === 'running'
  }

  /**
   * Returns true if the state is 'destroyed'.
   */
  isDestroyed(): boolean {
    return this.state === 'destroyed'
  }

  // --- Lifecycle Methods ---

  /**
   * Transition to 'initialized' state (fires 'init' event).
   * @param payload Optional payload for the 'init' event.
   */
  async init(payload?: LifecycleEvents['init']) {
    await this.transition('initialized', 'init', payload)
  }

  /**
   * Transition to 'running' state (fires 'start' event).
   * @param payload Optional payload for the 'start' event.
   */
  async start(payload?: LifecycleEvents['start']) {
    await this.transition('running', 'start', payload)
  }

  /**
   * Transition to 'running' state (fires 'resume' event).
   * @param payload Optional payload for the 'resume' event.
   */
  async resume(payload?: LifecycleEvents['resume']) {
    await this.transition('running', 'resume', payload)
  }

  /**
   * Transition to 'suspended' state (fires 'suspend' event).
   * @param payload Optional payload for the 'suspend' event.
   */
  async suspend(payload?: LifecycleEvents['suspend']) {
    await this.transition('suspended', 'suspend', payload)
  }

  /**
   * Transition to 'stopped' state (fires 'stop' event).
   * @param payload Optional payload for the 'stop' event.
   */
  async stop(payload?: LifecycleEvents['stop']) {
    await this.transition('stopped', 'stop', payload)
  }

  /**
   * Transition to 'initialized' state (fires 'reset' event).
   * @param payload Optional payload for the 'reset' event.
   */
  async reset(payload?: LifecycleEvents['reset']) {
    await this.transition('initialized', 'reset', payload)
  }

  /**
   * Transition to 'destroyed' state (fires 'destroy' event).
   * @param payload Optional payload for the 'destroy' event.
   */
  async destroy(payload?: LifecycleEvents['destroy']) {
    await this.transition('destroyed', 'destroy', payload)
  }

  // --- Hook Registration ---

  /**
   * Register a hook to run when entering a state. Overloaded for correct payload type.
   * @param state The state to register the hook for.
   * @param hook The hook function (from, to, payload?).
   */
  onEnter<S extends keyof StateToEventMap>(
    state: S,
    hook: StateHook<StateToEventMap[S]>
  ) {
    ;(this.onEnterHooks as any)[state] = hook
  }

  /**
   * Register a hook to run when exiting a state. Overloaded for correct payload type.
   * @param state The state to register the hook for.
   * @param hook The hook function (from, to, payload?).
   */
  onExit<S extends keyof StateToEventMap>(
    state: S,
    hook: StateHook<StateToEventMap[S]>
  ) {
    ;(this.onExitHooks as any)[state] = hook
  }

  /**
   * Called when an invalid state transition is attempted.
   * Override to customize error handling.
   * @param from The current state.
   * @param to The attempted new state.
   */
  protected onInvalidTransition(from: LifecycleState, to: LifecycleState) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }

  /**
   * Perform a state transition, invoking hooks and emitting events.
   * @param to The new state.
   * @param event The event name to emit.
   * @param payload Optional event payload.
   */
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
