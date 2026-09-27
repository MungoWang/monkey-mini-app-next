/** Codes the theme pin emits. A bad file is ignored, not this error. */

export const themeCodes = ['theme-invalid'] as const

export type ThemeCode = (typeof themeCodes)[number]

/** A rejected pin save. The previous file is unchanged. */
export class ThemeError extends Error {
  readonly code: ThemeCode

  /**
   * @param code - one of {@link themeCodes}
   * @param message - human text; not the match key
   */
  constructor(code: ThemeCode, message: string) {
    super(message)
    this.name = 'ThemeError'
    this.code = code
  }
}
