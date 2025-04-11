// src/utils/writeIndexContent.ts

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ENCODING } from '@constants/encoding/utf8';

import { existsAsync } from '../utils/utils';

import type { MinTwoCharString } from 'types-library'

export async function writeIndexContent<T extends string = MinTwoCharString>(
    src: T,
    name: T,
): Promise<void> {
    const srcFile = join(src, 'index.ts')

    if (await existsAsync(srcFile)) {
        throw new Error(`❌ File "${srcFile}" already exists.`)
    }

    const indexContent = `export const hello = () => console.log("Hello from ${name}!");\n`

    await writeFile(srcFile, indexContent, ENCODING)
}
