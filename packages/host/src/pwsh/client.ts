import type { CommandHandle, CommandPolicy } from '../shell/command.ts'
import { createCommand } from '../shell/command.ts'
import { PwshError } from './codes.ts'

/** UTF-8 preamble. It stays on the first line so later error lines stay accurate. */
const ENCODING_PREAMBLE = '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $OutputEncoding = [System.Text.UTF8Encoding]::new($false); '

/**
 * Executables to try, in order. Windows falls back to Windows PowerShell.
 * macOS and Linux only try `pwsh`. Bash is never a fallback.
 * @param platform - `process.platform`
 */
export function pwshCandidates(platform = process.platform): readonly string[] {
  return platform === 'win32' ? ['pwsh', 'powershell.exe'] : ['pwsh']
}

/**
 * Build `ctx.pwsh`. Each command is a fresh non-interactive PowerShell.
 * It is not a translation of `ctx.bash`.
 * @param policy - resolved host bounds
 * @param callSignal - aborting it stops the child
 * @param shell - executable name; tests inject a missing one
 */
export function createPwsh(policy: CommandPolicy, callSignal?: AbortSignal, shell?: string): CommandHandle {
  const candidates = shell === undefined ? [...pwshCandidates()] : [shell]
  let index = 0
  const handle = createCommand(
    policy,
    callSignal,
    command => [candidates[index] ?? 'pwsh', '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', `${ENCODING_PREAMBLE}${command}`],
    () => new PwshError('pwsh-unavailable', 'pwsh is not available'),
  )
  return {
    async run(command) {
      try {
        return await handle.run(command)
      } catch (error) {
        if (error instanceof PwshError && index < candidates.length - 1) {
          index += 1
          return handle.run(command)
        }
        throw error
      }
    },
    dispose: () => handle.dispose(),
  }
}
