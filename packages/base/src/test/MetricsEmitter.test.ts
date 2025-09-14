// @ts-expect-error: intentional type mismatch for event payload test
import { describe, expect, it } from 'vitest'
import { MetricsEmitter } from '../events/MetricsEmitter'
import type { BaseEventMap } from '../types/base-event-map'

type TestEvents = BaseEventMap & {
  foo: [string]
  bar: [number]
}

describe('MetricsEmitter', () => {
  it('should track event emission count and timing', async () => {
    const emitter = new MetricsEmitter<TestEvents>()
    emitter.on('foo', () => {})
    await emitter.emit('foo', ['hello'])
    await emitter.emit('foo', ['world'])
    const metrics = emitter.getEventMetrics().find((m) => m.event === 'foo')
    expect(metrics?.count).toBe(2)
    expect(metrics?.totalTimeMs).toBeGreaterThanOrEqual(0)
    expect(metrics?.lastTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should record slowest listener', async () => {
    const emitter = new MetricsEmitter<TestEvents>()
    emitter.on('bar', async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    emitter.on('bar', () => {})
    await emitter.emit('bar', [42])
    const metrics = emitter.getEventMetrics().find((m) => m.event === 'bar')
    expect(metrics?.slowestListener).toBe('<anonymous>') // anonymous function
    expect(metrics?.slowestTimeMs).toBeGreaterThan(0)
  })

  it('should reset metrics for specific event', async () => {
    const emitter = new MetricsEmitter<TestEvents>()
    emitter.on('foo', () => {})
    await emitter.emit('foo', ['reset'])
    emitter.resetMetrics('foo')
    const metrics = emitter.getEventMetrics().find((m) => m.event === 'foo')
    expect(metrics).toBeUndefined()
  })

  it('should reset all metrics', async () => {
    const emitter = new MetricsEmitter<TestEvents>()
    emitter.on('foo', () => {})
    emitter.on('bar', () => {})
    await emitter.emit('foo', ['a'])
    await emitter.emit('bar', [1])
    emitter.resetMetrics()
    expect(emitter.getEventMetrics()).toEqual([])
  })
})
