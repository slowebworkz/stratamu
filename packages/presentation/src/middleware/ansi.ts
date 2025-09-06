import type { BaseClient } from '@stratamu/types'
// ANSI filter utility (stateless)

// Robust regex for matching all ANSI escape sequences (including color, cursor, etc.)
export const ANSI_ESCAPE_REGEX =
  // eslint-disable-next-line no-control-regex
  /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[PX^_].*?\x1b\\|\x1b\][0-9];.*?\x07|\x1b\[\?1049[hl]/g

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_REGEX, '')
}

export function ansiFilter(
  client: BaseClient,
  text: string,
  next: (text: string) => string
): string {
  if (client.capabilities?.ansi === false) {
    return next(stripAnsi(text))
  }
  return next(text)
}
