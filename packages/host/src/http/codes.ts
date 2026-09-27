/** Codes the HTTP call emits. */

export const httpCodes = [
  'http-timeout',
  'http-scheme',
  'http-too-large',
  'http-network',
  'http-policy',
  'cancelled',
] as const

/** An HTTP failure. Callers match `code`. */
export type HttpCode = (typeof httpCodes)[number]

/** Failure from `ctx.http`. The message is for a person. */
export class HttpError extends Error {
  readonly code: HttpCode

  /**
   * @param code - one of {@link httpCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: HttpCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HttpError'
    this.code = code
  }
}
