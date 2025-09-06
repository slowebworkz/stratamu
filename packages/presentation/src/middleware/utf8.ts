// UTF-8 filter stub
export function utf8Filter(
  client: any,
  text: string,
  next: (text: string) => string
): string {
  // TODO: Implement UTF-8 encoding/stripping
  return next(text)
}
