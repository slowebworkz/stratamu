// MSDP filter stub
export function msdpFilter(
  client: any,
  text: string,
  next: (text: string) => string
): string {
  // TODO: Implement MSDP encoding/stripping
  return next(text)
}
