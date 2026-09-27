/** Codes the history implementation emits. */

export const historyCodes = ['history-empty-message', 'history-unknown-commit', 'commit-failed'] as const

/** A failure a caller matches. The message is for a person. */
export type HistoryCode = (typeof historyCodes)[number]

/** Failure while reading or moving app history. */
export class HistoryError extends Error {
  readonly code: HistoryCode

  /**
   * @param code - one of {@link historyCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: HistoryCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HistoryError'
    this.code = code
  }
}
