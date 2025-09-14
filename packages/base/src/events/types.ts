/**
 * Args<T> is a utility type that produces:
 *   - [] for void or undefined events (no payload)
 *   - [T] for events with a payload
 *
 * Used to type event listener arguments and emission signatures.
 */
export type Args<T> = [T] extends [void] | [undefined] ? [] : [T]
