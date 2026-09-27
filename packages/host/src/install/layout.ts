import path from 'node:path'

/** npm files this host writes. Spell them here, not at each read. */
export const installLayout = {
  manifest: 'package.json',
  lockfile: 'package-lock.json',
  modules: 'node_modules',
} as const

export function packageManifest(appDir: string): string {
  return path.join(appDir, installLayout.manifest)
}

export function packageLock(appDir: string): string {
  return path.join(appDir, installLayout.lockfile)
}
