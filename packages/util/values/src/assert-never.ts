/**
 * Mark an unreachable closed-union branch.
 * @param value - impossible value; an unhandled typed variant fails at the call site.
 * @param context - optional switch-site label included in the failure message.
 * @returns never; a runtime value that escaped its type always throws.
 */
export function assertNever(value: never, context?: string): never {
  const rendered = JSON.stringify(value)
  const label = context === undefined ? '' : ` in ${context}`
  throw new Error(`unreachable variant${label}: ${rendered}`)
}
