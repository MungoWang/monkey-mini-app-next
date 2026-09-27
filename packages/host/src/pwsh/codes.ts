/** Codes the PowerShell call emits. Timeout and output cap are not codes. */

export const pwshCodes = ['pwsh-unavailable'] as const

/** A PowerShell failure. Callers match `code`. */
export type PwshCode = (typeof pwshCodes)[number]

/** Failure from `ctx.pwsh`. The message is for a person. */
export class PwshError extends Error {
  readonly code: PwshCode

  /**
   * @param code - one of {@link pwshCodes}
   * @param message - human text; not the match key
   */
  constructor(code: PwshCode, message: string) {
    super(message)
    this.name = 'PwshError'
    this.code = code
  }
}
