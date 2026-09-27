import type { AppAgentOptions } from '@mini-app/contract'

import { HostError } from './codes.ts'

/** Directories Host already knows. A missing base is not filled from `process.cwd()`. */
export interface WorkingDirectoryInput {
  readonly cwdType?: AppAgentOptions['cwdType']
  readonly cwd?: string
  readonly appDir: string
  readonly processDirectory: string
  readonly createTemp: () => string
}

function isAbsolute(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
}

/**
 * Resolve the directory an agent run uses.
 * A path with no mode means `custom`. A path plus another mode fails.
 * @param input - call options plus host-owned directories
 */
export function resolveWorkingDirectory(input: WorkingDirectoryInput): string {
  const mode = input.cwdType ?? (input.cwd === undefined ? 'process' : 'custom')
  if (input.cwd !== undefined && mode !== 'custom') {
    throw new HostError('cwd-invalid', 'cwd requires cwdType custom')
  }
  if (mode === 'app') return input.appDir
  if (mode === 'process') return input.processDirectory
  if (mode === 'temp') return input.createTemp()
  if (input.cwd === undefined || !isAbsolute(input.cwd)) {
    throw new HostError('cwd-invalid', 'custom cwd must be an absolute path')
  }
  return input.cwd
}
