// UTF-8 filter utility for MUDs, MUSHes, etc.
// - For legacy clients (no UTF-8), preserve as much as possible: map diacritics to ASCII, replace other non-ASCII with '?'.
// - For modern clients, pass through unchanged.

/**
 * Replace non-ASCII/control characters with '?' for legacy clients.
 * - Only accepts strings.
 * - Leaves ASCII printable characters intact (0x20–0x7E).
 * - Control characters (0x00–0x1F, 0x7F) are replaced with '?'.
 */
export function replaceControlChars(text: string): string {
  const chars: string[] = []
  for (const char of text) {
    const code = char.charCodeAt(0)
    // Printable ASCII: 0x200x7E
    chars.push(code >= 0x20 && code <= 0x7e ? char : '?')
  }
  return chars.join('')
}

/**
 * Remove diacritics (e.g., á -> a) and replace remaining non-ASCII with '?'.
 * Useful for legacy MUD/MUSH clients that only support ASCII.
 */
export function stripDiacriticsAndNonAscii(text: string): string {
  // Normalize to NFD (decompose), remove diacritics, then filter to ASCII using replaceControlChars
  const noDiacritics = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return replaceControlChars(noDiacritics)
}

interface Client {
  capabilities?: { utf8?: boolean }
}

/**
 * UTF-8 filter for output pipeline.
 * - If client does not support UTF-8, strip diacritics and replace non-ASCII.
 * - Otherwise, pass through unchanged.
 */
export function utf8Filter(
  client: Client,
  text: string,
  next: (text: string) => string
): string {
  const supportsUtf8 = client.capabilities?.utf8 ?? true
  if (!supportsUtf8) return next(stripDiacriticsAndNonAscii(text))
  return next(text)
}
