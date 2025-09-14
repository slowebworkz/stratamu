import Emittery from 'emittery'
import pino, { DestinationStream, Logger, LoggerOptions } from 'pino'

// Common logger levels for pino and proxies
export const LOGGER_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal'
] as const

type LogLevel = keyof Pick<Logger, (typeof LOGGER_LEVELS)[number]>

export class LoggedEmitter<
  TEvents extends Record<string, any> = Record<string, unknown>
> extends Emittery<TEvents> {
  protected logger: Logger

  public readonly log: {
    [Level in LogLevel]: (...args: Parameters<Logger[Level]>) => void
  }

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
