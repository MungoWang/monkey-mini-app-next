/** Codes the authoring implementation emits. Tool operations keep their own codes. */

export const authorCodes = ['unknown-tool', 'tool-args', 'call-batch', 'authoring-token', 'authoring-loopback', 'cancelled'] as const

/** A failure a projection matches. The message is for a person. */
export type AuthorCode = (typeof authorCodes)[number]

/** Failure before a tool runs, or a projection refusal. */
export class AuthorError extends Error {
  readonly code: AuthorCode

  /**
   * @param code - one of {@link authorCodes}
   * @param message - human text; not the match key
   */
  constructor(code: AuthorCode, message: string) {
    super(message)
    this.name = 'AuthorError'
    this.code = code
  }
}
