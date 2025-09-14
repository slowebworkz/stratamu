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

// Utility type: event names whose value is undefined
type DatalessEventNames<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never
}[keyof T]

export interface EventMetrics {
  event: string
  count: number
  totalTimeMs: number
  lastTimeMs: number
  slowestListener?: string
  slowestTimeMs?: number
}

export class MetricsEmitter<
  Events extends Record<string, any[]>
> extends FilteredPriorityEmitter<Events> {
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
  private _eventCounts: Map<string, number> = new Map()
  private _eventTotalTime: Map<string, number> = new Map()
  private _eventLastTime: Map<string, number> = new Map()
  private _eventSlowest: Map<string, { time: number; listener: string }> =
    new Map()

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
  async emit<Name extends DatalessEventNames<Events>>(
    eventName: Name
  ): Promise<void>
  async emit<Name extends keyof Events>(
    eventName: Name,
    eventData: Events[Name]
  ): Promise<void>
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
