import type { LifecycleEvents, LifecycleState } from '@stratamu/types'
import { BaseEventsEmitter } from './base-events-emitter.js'

/**
 * LifecycleStateMachine: Provides a state machine and lifecycle events for the game/server.
 * Use this for the main world/server object, not for every class.
 */
export class LifecycleStateMachine extends BaseEventsEmitter<LifecycleEvents> {
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
  protected onInvalidTransition(from: LifecycleState, to: LifecycleState) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }
  private async transition<K extends keyof LifecycleEvents>(
    to: LifecycleState,
    event: K
  ): Promise<void> {
    const allowed = this.validTransitions[this.state]
    if (!allowed.includes(to)) {
      return this.onInvalidTransition(this.state, to)
    }
    this.state = to
    await this.emit(event as any)
  }
  async init() {
    await this.transition('initialized', 'init')
  }
  async start() {
    await this.transition('running', 'start')
  }
  async resume() {
    await this.transition('running', 'resume')
  }
  async suspend() {
    await this.transition('suspended', 'suspend')
  }
  async stop() {
    await this.transition('stopped', 'stop')
  }
  async reset() {
    await this.transition('initialized', 'reset')
  }
  async destroy() {
    await this.transition('destroyed', 'destroy')
  }
  getState(): LifecycleState {
    return this.state
  }
}
