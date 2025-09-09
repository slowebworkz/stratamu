import type { BaseClient, OutputPipeline } from '@stratamu/types'
// MSDP filter utility
// MSDP uses IAC SB MSDP ... IAC SE (telnet subnegotiation)
// For now, we strip MSDP sequences for unsupported clients and provide a hook for handling data.

// Telnet codes (not used, removed to fix lint)

// Regex to match MSDP subnegotiation blocks
export const MSDP_BLOCK_REGEX = /\xFF\xFA\x22([\s\S]*?)\xFF\xF0/g

// Optionally parse MSDP data (key-value pairs)
export function parseMsdpBlock(block: string): Record<string, any> {
  // MSDP is a binary protocol, but most servers send ASCII key-value pairs
  // This is a simple parser for demonstration
  const result: Record<string, any> = {}
  const pairs = block.split(String.fromCharCode(1)) // 1 = VAR, 2 = VAL
  for (let i = 0; i < pairs.length - 1; i += 2) {
    const key = pairs[i]
    const value = pairs[i + 1]
    result[key] = value
  }
  return result
}

export function stripMsdp(text: string): string {
  return text.replace(MSDP_BLOCK_REGEX, '')
}

export async function msdpFilter(
  client: BaseClient,
  text: string,
  next: OutputPipeline
): Promise<string> {
  if (client.capabilities?.msdp === false) {
    return await next(stripMsdp(text))
  }
  // Optionally, handle MSDP data here for supported clients
  // Example: extract and process MSDP blocks
  // const msdpBlocks = [...text.matchAll(MSDP_BLOCK_REGEX)];
  // msdpBlocks.forEach(match => { const data = parseMsdpBlock(match[1]); /* handle data */ });
  return await next(text)
}
