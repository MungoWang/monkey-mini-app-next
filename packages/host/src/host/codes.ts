/** Codes the host config emits. Callers match `code`. */

export const configCodes = ['config-invalid', 'config-missing'] as const

export type ConfigCode = (typeof configCodes)[number]

/** A present config failed. The file is unchanged. */
export class ConfigError extends Error {
  readonly code: ConfigCode

  /**
   * @param code - one of {@link configCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: ConfigCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ConfigError'
    this.code = code
  }
}
