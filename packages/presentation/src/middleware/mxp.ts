// MXP filter stub
export function mxpFilter(
  client: any,
  text: string,
  next: (text: string) => string
): string {
  // TODO: Implement MXP encoding/stripping
  return next(text)
}
