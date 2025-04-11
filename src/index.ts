// src/index.ts

import { logError } from 'ts-node-utils';

import { createWorkspace } from './workspaces/create-workspace';

import type { MinTwoCharString } from 'types-library';

export async function create_workspace<T extends string = MinTwoCharString>(
    args: T[],
) {
    try {
        const [, , workspaceName = 'test'] = args

        await createWorkspace(workspaceName)
        console.log(`Workspace "${workspaceName}" created successfully.`)
    } catch (err) {
        logError(err)
    }
}

create_workspace([...process.argv])
