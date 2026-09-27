import { hostLayout } from '../host/layout.ts'
import { installLayout } from '../install/layout.ts'
import { storageLayout } from '../storage/layout.ts'
import { themeLayout } from '../theme/layout.ts'

/** Git metadata directory. History owns the repo; other modules only skip the name. */
export const gitDir = '.git'

/**
 * Generated directories a snapshot and a file listing both skip.
 * Host writes `.autogen`. It does not create `dist` or `.cache`. `coverage` is not in this list.
 */
export const buildCacheDirs = ['dist', '.cache', '.autogen'] as const

/** Names a snapshot and a file listing both skip. One table. */
export const snapshotSkip = new Set<string>([
  gitDir,
  storageLayout.dir,
  installLayout.modules,
  themeLayout.appPin,
  hostLayout.logs,
  ...buildCacheDirs,
])
