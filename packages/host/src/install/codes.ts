/** Codes the installer emits. Callers match `code`. */

export const installCodes = ['install-denied', 'install-failed'] as const

export type InstallCode = (typeof installCodes)[number]

/** A denied spec or a failed install. The message names the next step. */
export class InstallError extends Error {
  readonly code: InstallCode

  /**
   * @param code - one of {@link installCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: InstallCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'InstallError'
    this.code = code
  }
}
