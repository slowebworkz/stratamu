// src/utils/existsAsync.ts

import { access, constants } from 'node:fs/promises'

export async function existsAsync(path: unknown): Promise<boolean> {
    try {
        if (typeof path !== 'string') {
            throw new TypeError('Path must be a string.')
        }

        await access(path)

        return true
    } catch (err) {
        return false
    }
}
