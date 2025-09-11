export function normalizeArgs<T>(args: unknown[]): [] | [T] {
  return (args.length === 0 ? [] : [args[0]]) as [] | [T]
}

import type { Args } from '../types'

export async function bubbleToParent<
  TParent extends {
    emitWithBubble: (eventName: any, ...args: any[]) => Promise<void>
  },
  Name extends string = string,
  Payload = unknown
>(parent: TParent, eventName: Name, normalized: Args<Payload>): Promise<void> {
  // Always spread the tuple, works for both [] and [payload]
  await parent.emitWithBubble(eventName, ...normalized)
}
