// src/getRootWorkspaces.ts

import { join } from 'node:path'

import {
    getReferencesFromTSConfigJson,
    getWorkspacesFromPackageJson,
} from '../utils/getWorkspacesFromPackageJson'
import { processDirectories } from '../utils/processDirectories'

import type { MinTwoCharString } from 'types-library'

export async function getRootWorkspaces() {
    return await processDirectories(async (currentDir) => {
        const packageJsonPath = join(currentDir, 'package.json')

        const results = await getWorkspacesFromPackageJson(packageJsonPath)

        if (results && results.length > 0) {
            return results
        }

        return null // No workspaces found
    })
}

export async function getRootTSConfig<T extends string = MinTwoCharString>(
    name: T,
) {
    return await processDirectories(async (currentDir) => {
        const tsConfigPath = join(currentDir, 'tsconfig.json')

        const results = await getReferencesFromTSConfigJson(tsConfigPath)

        if (results.length > 0) {
            const exists = results.some((ref) => ref?.path === name)

            if (!exists) {
                results.push({ path: name }) // Add the new reference
            }

            return results
        }

        return null // No tsconfig.json found
    })
}
