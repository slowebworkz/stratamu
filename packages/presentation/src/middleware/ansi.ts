// ANSI filter utility (stateless)

// Robust regex for matching ANSI escape codes
// eslint-disable-next-line no-control-regex
export const ANSI_ESCAPE_REGEX = /\x1b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_REGEX, '')
}

export function ansiFilter(
  client: any,
  text: string,
  next: (text: string) => string
): string {
  if (client.capabilities?.ansi === false) {
    return next(stripAnsi(text))
  }
  return next(text)
}
