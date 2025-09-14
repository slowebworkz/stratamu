import { FilteredPriorityEmitter } from './FilteredPriorityEmitter'
// Static import for Node.js perf_hooks
import type { OmnipresentEventData, UnsubscribeFunction } from 'emittery'
import { performance as nodePerformance } from 'node:perf_hooks'

// Use performance.now() for high-precision timing; prefer globalThis, then node:perf_hooks, then Date.now
const perfNow: () => number =
  typeof globalThis !== 'undefined' &&
  globalThis.performance &&
  typeof globalThis.performance.now === 'function'
    ? () => globalThis.performance.now()
    : typeof nodePerformance !== 'undefined' &&
        typeof nodePerformance.now === 'function'
      ? () => nodePerformance.now()
      : () => Date.now()

/**
 * DatalessEventNames<T> is a utility type for event names whose value is undefined.
 * Used to overload emit signatures for events with no payload.
 */
type DatalessEventNames<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never
}[keyof T]

/**
 * EventMetrics describes per-event emission statistics.
 * - event: Event name
 * - count: Number of times emitted
 * - totalTimeMs: Aggregate time spent in listeners
 * - lastTimeMs: Time spent in last emission
 * - slowestListener: Name of slowest listener (if any)
 * - slowestTimeMs: Time of slowest listener (if any)
 */
export interface EventMetrics {
  event: string
  count: number
  totalTimeMs: number
  lastTimeMs: number
  slowestListener?: string
  slowestTimeMs?: number
}

/**
 * MetricsEmitter extends FilteredPriorityEmitter to add per-event metrics:
 *
 * - Tracks emission count, total/last time, and slowest listener per event.
 * - Wraps listeners to time their execution.
 * - Provides getEventMetrics() for reporting.
 * - Only increments counts for successful emits (errors are still timed).
 * - Overloads emit() to match Emittery/FilteredPriorityEmitter signatures.
 * - resetMetrics() clears all or per-event metrics.
 *
 * @template Events - The event map for this emitter.
 */
export class MetricsEmitter<
  Events extends Record<string, any[]>
> extends FilteredPriorityEmitter<Events> {
  /**
   * Override on() to wrap listeners for timing and error tracking.
   *
   * @param eventName The event name or array of names.
   * @param listener The listener function.
   * @param options Optional: { signal } for abortable listeners.
   * @returns Unsubscribe function.
   */
  on<Name extends keyof Events | keyof OmnipresentEventData>(
    eventName: Name | readonly Name[],
    listener: (
      eventData: (Events & OmnipresentEventData)[Name]
    ) => void | Promise<void>,
    options?: { signal?: AbortSignal }
  ): UnsubscribeFunction {
    const wrapped = async (
      eventData: (Events & OmnipresentEventData)[Name]
    ) => {
      const start = perfNow()
      let error: unknown = undefined
      try {
        await listener(eventData)
      } catch (err) {
        if (error === undefined) error = err
      }
      const elapsed = perfNow() - start
      if (Array.isArray(eventName)) {
        for (const e of eventName) {
          this._recordListenerTime(e as string, listener, elapsed)
        }
      } else {
        this._recordListenerTime(eventName as string, listener, elapsed)
      }
      if (error !== undefined) throw error
    }
    return super.on(eventName, wrapped, options)
  }

  /**
   * Record the slowest listener for an event.
   * @param event Event name.
   * @param listener Listener function.
   * @param elapsed Time in ms.
   */
  private _recordListenerTime(
    event: string,
    listener: (...args: any[]) => any,
    elapsed: number
  ) {
    const prev = this._eventSlowest.get(event)
    if (!prev || elapsed > prev.time) {
      this._eventSlowest.set(event, {
        time: elapsed,
        listener: listener.name || '<anonymous>'
      })
    }
  }
  /**
   * Map of event name to emission count.
   */
  private _eventCounts: Map<string, number> = new Map()
  /**
   * Map of event name to total time spent in listeners.
   */
  private _eventTotalTime: Map<string, number> = new Map()
  /**
   * Map of event name to last emission time.
   */
  private _eventLastTime: Map<string, number> = new Map()
  /**
   * Map of event name to slowest listener/time.
   */
  private _eventSlowest: Map<string, { time: number; listener: string }> =
    new Map()

  /**
   * Get metrics for all events.
   * @returns Array of EventMetrics objects.
   */
  getEventMetrics(): EventMetrics[] {
    const metrics: EventMetrics[] = []
    for (const [event, count] of this._eventCounts.entries()) {
      const totalTime = this._eventTotalTime.get(event) ?? 0
      const lastTime = this._eventLastTime.get(event) ?? 0
      const slowest = this._eventSlowest.get(event)
      metrics.push({
        event,
        count,
        totalTimeMs: totalTime,
        lastTimeMs: lastTime,
        slowestListener: slowest?.listener,
        slowestTimeMs: slowest?.time
      })
    }
    return metrics
  }

  // Overload signatures to match FilteredPriorityEmitter/Emittery
  /**
   * Emit an event with no payload (dataless event).
   * @param eventName The event name.
   */
  async emit<Name extends DatalessEventNames<Events>>(
    eventName: Name
  ): Promise<void>
  /**
   * Emit an event with a payload.
   * @param eventName The event name.
   * @param eventData The event payload.
   */
  async emit<Name extends keyof Events>(
    eventName: Name,
    eventData: Events[Name]
  ): Promise<void>
  /**
   * Emit an event (overload for optional payload).
   * @param eventName The event name.
   * @param eventData The event payload (optional).
   */
  async emit<Name extends keyof Events>(
    eventName: Name,
    eventData?: Events[Name]
  ): Promise<void> {
    const start = perfNow()
    let error: unknown = undefined
    try {
      if (arguments.length === 1) {
        await super.emit(eventName as any)
      } else {
        await super.emit(eventName as any, eventData as any)
      }
    } catch (err) {
      error = err
    }
    const elapsed = perfNow() - start
    if (!error) {
      this._eventCounts.set(
        eventName as string,
        (this._eventCounts.get(eventName as string) || 0) + 1
      )
    }
    this._eventTotalTime.set(
      eventName as string,
      (this._eventTotalTime.get(eventName as string) || 0) + elapsed
    )
    this._eventLastTime.set(eventName as string, elapsed)
    if (error) throw error
  }

  /**
   * Reset all metrics, or metrics for a specific event.
   * @param event Optional event name to reset.
   */
  resetMetrics(event?: string) {
    if (event) {
      this._eventCounts.delete(event)
      this._eventTotalTime.delete(event)
      this._eventLastTime.delete(event)
      this._eventSlowest.delete(event)
    } else {
      this._eventCounts.clear()
      this._eventTotalTime.clear()
      this._eventLastTime.clear()
      this._eventSlowest.clear()
    }
  }
}
