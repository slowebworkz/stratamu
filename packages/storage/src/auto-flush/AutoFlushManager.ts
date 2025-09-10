/**
 * AutoFlushManager handles periodic flushing of dirty entities using interval-promise.
 */
import intervalPromise from 'interval-promise'

export class AutoFlushManager {
  private shouldRun = false
  private runner?: Promise<void>

  /**
   * Start auto-flushing with the given callback and interval (ms).
   * @param flushCallback Function to call on each interval (should return a Promise).
   * @param intervalMs Interval in milliseconds.
   * @param runImmediately If true, run the flush immediately before starting the interval.
   */
  async start(
    flushCallback: () => void | Promise<void>,
    intervalMs: number,
    runImmediately = false
  ): Promise<void> {
    await this.stop()
    this.shouldRun = true

    if (runImmediately) {
      try {
        const result = flushCallback()
        if (result && typeof (result as Promise<void>).catch === 'function') {
          ;(result as Promise<void>).catch((err) =>
            console.error('AutoFlushManager: Initial auto-flush failed:', err)
          )
        }
      } catch (err) {
        console.error('AutoFlushManager: Initial auto-flush failed:', err)
      }
    }

    this.runner = intervalPromise(async (_iteration, stop) => {
      if (!this.shouldRun) {
        stop()
        return
      }
      try {
        await flushCallback()
      } catch (err) {
        console.error('AutoFlushManager: Auto-flush failed:', err)
      }
    }, intervalMs)
    await this.runner
  }

  /**
   * Stop auto-flushing.
   */
  async stop(flushCallback?: () => Promise<void>): Promise<void> {
    this.shouldRun = false
    if (this.runner) {
      await this.runner
      this.runner = undefined
    }
    if (flushCallback) {
      try {
        await flushCallback()
      } catch (err) {
        console.error('Final flush failed:', err)
      }
    }
  }

  /**
   * Check if auto-flush is running.
   */
  isRunning(): boolean {
    return this.shouldRun
  }
}
