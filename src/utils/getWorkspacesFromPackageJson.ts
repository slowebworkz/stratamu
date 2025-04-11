// src/utils/getWorkspacesFromPackageJson.ts

import { NotFoundError } from 'error-lib';
import { loadJsonFile } from 'load-json-file';
import { readFile } from 'node:fs/promises';
import { logError } from 'ts-node-utils';

import { ENCODING } from '@constants/encoding/utf8';

import { existsAsync } from '../utils/utils';
import { isPackageJson } from './isPackageJSON';

import type { MinTwoCharString } from 'types-library'
type References<T extends string = MinTwoCharString> = { path: T }[]

export async function getWorkspacesFromPackageJson<
    T extends string = MinTwoCharString,
>(packageJsonPath: T): Promise<string[] | null> {
    try {
        if (await existsAsync(packageJsonPath)) {
            const pkg = await loadJsonFile(packageJsonPath)

            if (isPackageJson(pkg) && 'workspaces' in pkg) {
                if (Array.isArray(pkg.workspaces)) {
                    return [...pkg.workspaces]
                } else if (pkg.workspaces?.packages) {
                    return [...pkg.workspaces.packages]
                }
            }
        } else {
            throw new NotFoundError(
                `❌ Package.json not found at ${packageJsonPath}`,
            )
        }
    } catch (err) {
        logError(err)
    }

    return null
}

export async function getReferencesFromTSConfigJson<
    T extends string = MinTwoCharString,
>(tsConfigPath: T): Promise<References<T>> {
    try {
        if (!(await existsAsync(tsConfigPath))) {
            throw new Error(`TSConfig.json not found at ${tsConfigPath}`)
        }

        const raw = await readFile(tsConfigPath, ENCODING)
        const pkg = JSON.parse(raw)

        if (typeof pkg === 'object' && Array.isArray(pkg?.references)) {
            return [...(pkg.references as References<T>)].filter(
                (ref) => ref?.path,
            )
        }
    } catch (err) {
        logError(err)
    }

    return [] as References<T> // No references defined
}
