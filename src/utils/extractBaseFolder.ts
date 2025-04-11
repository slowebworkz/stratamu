// src/utils/extractBaseFolder.ts

import type { MinTwoCharString } from 'types-library'

export function extractBaseFolder<T extends string = MinTwoCharString>(
    pattern: T,
): string {
    return pattern.replace(/\/?\*.*$/, '') // Removes trailing '/*', '/**', etc.
}
