import { dirname } from 'node:path'

type Callback<T = boolean> = (directory: string) => T | Promise<T>

export async function processDirectories<T>(
    callback: Callback<T>,
): Promise<T | null> {
    return await new Promise(async (resolve, reject) => {
        let currentDir = process.cwd()

        while (currentDir.length > 1 && currentDir !== '/') {
            const result = await callback(currentDir)
            if (result) {
                resolve(result)
                break
            }

            currentDir = dirname(currentDir) // Move up a directory
        }

        reject(null) // no matches found
    })
}
