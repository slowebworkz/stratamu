// src/utils/getWorkplaceDir.ts
import { join } from 'node:path'

import { extractBaseFolder } from './extractBaseFolder'

import type { MinTwoCharString } from 'types-library'

export function getWorkplaceDir<T extends string = MinTwoCharString>(
    workspace: T,
): string {
    return join(process.cwd(), extractBaseFolder<T>(workspace))
}
