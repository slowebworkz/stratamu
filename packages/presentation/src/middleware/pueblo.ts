import type { BaseClient } from '@stratamu/types'
// Pueblo filter utility
// Pueblo uses <PUEBLOCLIENT> and other tags for multimedia, sound, images, etc.
// For now, we strip Pueblo tags for unsupported clients and provide a hook for handling tags.

// Regex to match Pueblo tags (e.g., <PUEBLOCLIENT>, <IMG>, <SOUND>, etc.)
export const PUEBLO_TAG_REGEX = /<\/?[A-Z]+[^>]*>/g

export function stripPueblo(text: string): string {
  return text.replace(PUEBLO_TAG_REGEX, '')
}

export async function puebloFilter(
  client: BaseClient,
  text: string,
  next: (text: string) => Promise<string>
): Promise<string> {
  if (client.capabilities?.pueblo === false) {
    return await next(stripPueblo(text))
  }
  // Optionally, handle Pueblo tags here for supported clients
  // Example: parse and process multimedia tags
  return await next(text)
}
