/**
 * Codes this definition emits. Other surfaces declare their own codes.
 * Callers match `code`, not the message.
 * @module @mini-app/contract
 */

export const definitionCodes = [
  'app-id-invalid',
  'manifest-invalid',
  'import-forbidden',
  'import-escape',
  'define-app-invalid',
] as const

/** A failure emitted by this definition. */
export type DefinitionCode = (typeof definitionCodes)[number]

/** Failure a caller branches on. The message is for a person. */
export class ContractError extends Error {
  readonly code: DefinitionCode

  /**
   * @param code - one of {@link definitionCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause` for the original failure
   */
  constructor(code: DefinitionCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ContractError'
    this.code = code
  }
}
