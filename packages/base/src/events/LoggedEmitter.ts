import type { DestinationStream, Logger, LoggerOptions } from 'pino'
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
 * - Provides a logger instance and a log proxy for all levels.
 * - Accepts an external logger or creates one with options/destination.
 * - All log methods are available as this.log.info(), this.log.error(), etc.
 *
 * @template TEvents - The event map for this emitter.
 */
export class LoggedEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends MetricsEmitter<TEvents> {
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
   * Construct a LoggedEmitter with optional logger, options, or destination.
   * @param logger Optional external pino logger instance.
   * @param loggerOptions Optional pino logger options.
   * @param loggerDestination Optional pino destination stream.
   */
  constructor(
    logger?: Logger,
    loggerOptions?: LoggerOptions,
    loggerDestination?: DestinationStream
  ) {
    super()
    this.logger =
      logger ??
      (loggerOptions || loggerDestination
        ? pino(loggerOptions ?? {}, loggerDestination)
        : pino())

    // Initialize log methods using LOGGER_LEVELS
    this.log = {} as typeof this.log
    for (const level of LOGGER_LEVELS) {
      this.log[level] = (...args: Parameters<Logger[typeof level]>) => {
        this.logger[level](...args)
      }
    }
  }
}
