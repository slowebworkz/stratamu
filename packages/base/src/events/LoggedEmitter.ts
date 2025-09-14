import type { Logger } from 'pino'
import pino from 'pino'
import { MetricsEmitter } from './MetricsEmitter'

/**
 * Common logger levels for pino and proxies.
 */
export const LOGGER_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal'
] as const

/**
 * LogLevel is a union of all supported logger levels.
 */
type LogLevel = keyof Pick<Logger, (typeof LOGGER_LEVELS)[number]>

/**
 * LoggedEmitter extends MetricsEmitter to add structured logging via pino.
 *
 * - Provides a per-instance logger and a log proxy for all levels.
 * - Always creates a new logger for each instance; does not accept logger or options in the constructor.
 * - All log methods are available as this.log.info(), this.log.error(), etc.
 *
 * @template EventMap - The event map for this emitter.
 */
export class LoggedEmitter<
  EventMap extends Record<string, any[]> = Record<string, unknown[]>
> extends MetricsEmitter<EventMap> {
  /**
   * The pino logger instance used for all logging.
   */
  protected logger: Logger

  /**
   * Proxy object for all log levels (trace, debug, info, warn, error, fatal).
   */
  public readonly log: {
    [Level in LogLevel]: (...args: Parameters<Logger[Level]>) => void
  }

  /**
   * Construct a LoggedEmitter. Always creates a new logger for each instance.
   */
  constructor() {
    super()
    this.logger = pino({
      timestamp: pino.stdTimeFunctions.isoTime
    })
    // Initialize log methods using LOGGER_LEVELS
    this.log = {} as typeof this.log
    for (const level of LOGGER_LEVELS) {
      this.log[level] = (...args: Parameters<Logger[typeof level]>) => {
        this.logger[level](...args)
      }
    }
  }
}
