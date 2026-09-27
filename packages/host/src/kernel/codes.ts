/** Codes this host slice emits. */

export const hostCodes = ['cwd-invalid', 'unknown-method', 'model-policy'] as const

/** A failure emitted while preparing a brain call. */
export type HostCode = (typeof hostCodes)[number]

/** Failure a caller branches on. The message is for a person. */
export class HostError extends Error {
  readonly code: HostCode

  /**
   * @param code - one of {@link hostCodes}
   * @param message - human text; not the match key
   */
  constructor(code: HostCode, message: string) {
    super(message)
    this.name = 'HostError'
    this.code = code
  }
}
