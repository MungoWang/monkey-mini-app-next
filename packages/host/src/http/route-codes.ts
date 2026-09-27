/** Codes the loopback surface emits that are not a tool code. Callers match `code`. */

export const routeCodes = ['not-found', 'unknown-vendor'] as const

export type RouteCode = (typeof routeCodes)[number]

export class RouteError extends Error {
  readonly code: RouteCode

  /**
   * @param code - one of {@link routeCodes}
   * @param message - human text; not the match key
   */
  constructor(code: RouteCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'RouteError'
    this.code = code
  }
}
