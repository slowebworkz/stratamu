

import Emittery from 'emittery';

/**
 * BaseEventEmitter provides async lifecycle hooks and emits events for each stage.
 *
 * Lifecycle order:
 *   1. init
 *   2. start
 *   3. resume
 *   4. suspend
 *   5. stop
 *   6. reset
 *   7. destroy
 */
/**
 * BaseEventEmitter provides async lifecycle hooks and emits events for each stage.
 *
 * @template TEvents - Map of event names to payload types.
 */
/**
 * BaseEventEmitter provides async lifecycle hooks and emits events for each stage.
 *
 * @template TEvents - Map of event names to payload types. Each key is an event name, and the value is the type of data passed to listeners and lifecycle methods.
 *
 * Lifecycle order:
 *   1. init
 *   2. start
 *   3. resume
 *   4. suspend
 *   5. stop
 *   6. reset
 *   7. destroy
 *
 * Example usage:
 *   type MyEvents = { init: void; start: { foo: string }; destroy: Error | undefined };
 *   class MyClass extends BaseEventEmitter<MyEvents> {}
 */
/**
 * BaseEventEmitter provides async lifecycle hooks and emits events for each stage.
 *
 * @template TEvents - Map of event names to payload types. Each key is an event name, and the value is the type of data passed to listeners and lifecycle methods.
 *
 * Lifecycle order:
 *   1. init
 *   2. start
 *   3. resume
 *   4. suspend
 *   5. stop
 *   6. reset
 *   7. destroy
 *
 * Example usage:
 *   type MyEvents = { init: void; start: { foo: string }; destroy: Error | undefined };
 *   class MyClass extends BaseEventEmitter<MyEvents> {}
 */
export class BaseEventEmitter<TEvents extends Record<string, any> = Record<string, unknown>> extends Emittery<TEvents> {
  /**
   * Centralized emit helper for lifecycle methods.
   * @private
   */
  private async _emit<K extends keyof TEvents>(event: K, ...args: [TEvents[K]] extends [undefined] ? [] : [data: TEvents[K]]): Promise<this> {
    await this.emit(event, ...(args as [TEvents[K]]));
    return this;
  }

  /**
   * Initialize the instance and emit the 'init' event.
   * @param args - Data for the 'init' event, required only if TEvents['init'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async init(...args: [TEvents['init']] extends [undefined] ? [] : [data: TEvents['init']]): Promise<this> {
    return this._emit('init', ...args);
  }

  /**
   * Start the instance and emit the 'start' event.
   * @param args - Data for the 'start' event, required only if TEvents['start'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async start(...args: [TEvents['start']] extends [undefined] ? [] : [data: TEvents['start']]): Promise<this> {
    return this._emit('start', ...args);
  }

  /**
   * Resume the instance and emit the 'resume' event.
   * @param args - Data for the 'resume' event, required only if TEvents['resume'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async resume(...args: [TEvents['resume']] extends [undefined] ? [] : [data: TEvents['resume']]): Promise<this> {
    return this._emit('resume', ...args);
  }

  /**
   * Suspend the instance and emit the 'suspend' event.
   * @param args - Data for the 'suspend' event, required only if TEvents['suspend'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async suspend(...args: [TEvents['suspend']] extends [undefined] ? [] : [data: TEvents['suspend']]): Promise<this> {
    return this._emit('suspend', ...args);
  }

  /**
   * Stop the instance and emit the 'stop' event.
   * @param args - Data for the 'stop' event, required only if TEvents['stop'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async stop(...args: [TEvents['stop']] extends [undefined] ? [] : [data: TEvents['stop']]): Promise<this> {
    return this._emit('stop', ...args);
  }

  /**
   * Reset the instance and emit the 'reset' event.
   * @param args - Data for the 'reset' event, required only if TEvents['reset'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async reset(...args: [TEvents['reset']] extends [undefined] ? [] : [data: TEvents['reset']]): Promise<this> {
    return this._emit('reset', ...args);
  }

  /**
   * Destroy the instance and emit the 'destroy' event.
   * @param args - Data for the 'destroy' event, required only if TEvents['destroy'] is not undefined.
   * @returns Promise that resolves to this instance for chaining.
   */
  async destroy(...args: [TEvents['destroy']] extends [undefined] ? [] : [data: TEvents['destroy']]): Promise<this> {
    return this._emit('destroy', ...args);
  }
}
