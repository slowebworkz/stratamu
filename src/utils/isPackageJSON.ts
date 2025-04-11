// src/utils/isPackageJSON.ts
import type { PackageJSON } from 'types-library'

export function isPackageJson(pkg: any): pkg is PackageJSON {
    return (
        typeof pkg === 'object' &&
        typeof pkg.name === 'string' &&
        typeof pkg.version === 'string' &&
        (pkg.main === undefined || typeof pkg.main === 'string') &&
        (pkg.scripts === undefined || typeof pkg.scripts === 'object')
    )
}
