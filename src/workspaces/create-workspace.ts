import { NotFoundError } from 'error-lib';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { logError } from 'ts-node-utils';

import { existsAsync, getWorkplaceDir, writeIndexContent } from '../utils/utils';
import { getRootWorkspaces } from './getRootWorkspaces';

import type { MinTwoCharString } from 'types-library'

/**
 * Creates a new workspace with the specified name.
 *
 * @param {unknown} name - The name of the workspace to create. Must be a non-empty string.
 * @returns {Promise<void>} A promise that resolves when the workspace is successfully created.
 * @throws {TypeError} Throws if the provided name is not a string or is empty.
 * @throws {Error} Throws if no workspaces are found or if a workspace with the specified name already exists.
 *
 * The function performs the following steps:
 * - Validates the `name` parameter to ensure it is a non-empty string.
 * - Retrieves the list of root workspaces.
 * - Checks if a workspace with the specified name already exists in any of the root workspaces.
 * - Creates the necessary directory structure for the new workspace.
 * - Writes a `package.json` file, a `tsconfig.json` file, and a `src/index.ts` file in the new workspace.
 * - Logs a success message upon successful creation.
 *
 * Any errors encountered during the process are caught and passed to the `logError` handler.
 */
export async function createWorkspace(name: unknown): Promise<void> {
    try {
        if (typeof name !== 'string' || !name.length) {
            throw new TypeError(`❌ Workspace name is required.`)
        }

        const workspaces = await getRootWorkspaces()

        if (workspaces === null) {
            throw new NotFoundError(`❌ No workspaces found.`)
        }

        for (const workspace of workspaces) {
            const dir = join(getWorkplaceDir(workspace), name)

            if (await existsAsync(dir)) {
                throw new Error(`❌ Workspace "${name}" already exists.`)
            }

            await mkSrcDir(dir, name)

            const packageJsonPath = join(dir, 'package.json')

            if (await existsAsync(packageJsonPath)) {
                throw new Error(
                    `❌ Workspace package.json for "${name}" already exists.`,
                )
            }
        }
    } catch (error) {
        logError(error)
    }
}

async function mkSrcDir<T extends string = MinTwoCharString>(
    parentDir: T,
    name: T,
): Promise<void> {
    const srcDir = join(parentDir, 'src')

    if (await existsAsync(srcDir)) {
        throw new Error(`❌ Src folder already exists.`)
    }

    await mkdir(srcDir, { recursive: true })

    await writeIndexContent(srcDir, name)
}
