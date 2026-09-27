/**
 * file: dependencies for an install prefix, named like `pnpm pack`.
 *
 * Inputs: publishable workspace packages, artifacts/npm/*.tgz
 * Writes: nothing
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { workspacePackages } from '../publish/packages.mjs'

/** `@mini-app/app-view` + `1.0.0` → `mini-app-app-view-1.0.0.tgz`. */
export function packedFileName(packageName, version) {
  return `${packageName.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`
}

/** Map every publishable workspace package to `file:<tarball>`. Missing tarballs throw. */
export function fileDependencies(rootDir, npmDir, version) {
  const deps = {}
  for (const item of workspacePackages(rootDir)) {
    const file = packedFileName(item.pkg.name, version)
    const full = join(npmDir, file)
    if (!existsSync(full)) throw new Error(`missing tarball ${full}`)
    deps[item.pkg.name] = `file:${full}`
  }
  return deps
}
