import type { BaseClient } from '@stratamu/types'
// MXP filter utility
// MXP uses <TAG> markup, similar to HTML/XML, for clickable links, color, etc.
// For now, we strip MXP tags for unsupported clients and provide a hook for handling tags.

// Regex to match MXP tags (e.g., <SEND>, <COLOR>, etc.)
export const MXP_TAG_REGEX = /<[^>]+>/g

export function stripMxp(text: string): string {
  return text.replace(MXP_TAG_REGEX, '')
}

export async function mxpFilter(
  client: BaseClient,
  text: string,
  next: (text: string) => Promise<string>
): Promise<string> {
  if (client.capabilities?.mxp === false) {
    return await next(stripMxp(text))
  }
  // Optionally, handle MXP tags here for supported clients
  // Example: parse and sanitize tags, or convert to HTML for web clients
  return await next(text)
}
