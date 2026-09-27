/** Codes the metrics call emits. */

export const metricsCodes = ['metrics-unreadable'] as const

/** A metrics failure. Callers match `code`. */
export type MetricsCode = (typeof metricsCodes)[number]

/** Failure from `ctx.system.metrics`. The message is for a person. */
export class MetricsError extends Error {
  readonly code: MetricsCode

  /**
   * @param code - one of {@link metricsCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: MetricsCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'MetricsError'
    this.code = code
  }
}
