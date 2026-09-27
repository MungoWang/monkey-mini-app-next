/** Codes the bash call emits. Timeout and output cap are not codes. */

export const bashCodes = ['bash-unavailable'] as const

/** A bash failure. Callers match `code`. */
export type BashCode = (typeof bashCodes)[number]

/** Failure from `ctx.bash`. The message is for a person. */
export class BashError extends Error {
  readonly code: BashCode

  /**
   * @param code - one of {@link bashCodes}
   * @param message - human text; not the match key
   */
  constructor(code: BashCode, message: string) {
    super(message)
    this.name = 'BashError'
    this.code = code
  }
}
