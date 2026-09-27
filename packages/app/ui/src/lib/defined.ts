/** Drop keys whose value is missing so optional props stay omitted, not `undefined`. */
export function skipUndef<T extends Record<string, unknown>>(props: T): Partial<T> {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) next[key] = value
  }
  return next as Partial<T>
}
