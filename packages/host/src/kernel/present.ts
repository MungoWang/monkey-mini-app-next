/** Omit a key when the value is undefined, for exact optional properties. */
export function present<Key extends string, Value>(key: Key, value: Value | undefined): Partial<Record<Key, Value>> {
  return value === undefined ? {} : { [key]: value } as Record<Key, Value>
}
