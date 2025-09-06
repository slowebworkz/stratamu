// Pueblo filter stub
export function puebloFilter(
  client: any,
  text: string,
  next: (text: string) => string
): string {
  // TODO: Implement Pueblo encoding/stripping
  return next(text)
}
