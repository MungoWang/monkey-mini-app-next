# Failure

Read this when catching, wrapping, or matching an error.

`catch` binds the error by name. That name appears in the log, the throw, or `cause`. A wrapped failure passes the original error as `cause`. Callers match a closed code, not a message substring.

A decision is enforced in the operation that makes it. A wrapper that a second caller can skip is not enforcement.

Publish state after the operation commits. A notification comes from that committed value.

## Example

```ts
export class ConfigError extends Error {
  readonly code = 'config-invalid' as const

  constructor(path: string, options: { cause: unknown }) {
    super(`${path} is invalid`, options)
  }
}

export function load(raw: unknown, path: string): number {
  try {
    return resolvePort(raw, path)
  } catch (error) {
    throw new ConfigError(path, { cause: error })
  }
}

export function explain(error: unknown): string {
  if (error instanceof ConfigError) return error.code
  throw new Error('unclassified failure', { cause: error })
}
```

Effect:

- `error.cause` is the original failure. The caller reads `code`, not `error.message.includes('port')`.
- A thrown listener does not hide the cause. The log line includes the bound name.
- A successful write emits one notification from the written value. A failed write emits nothing.

A byte, item, or time bound applies to the complete emitted value, including wrappers. The test includes a tiny limit, an exact limit, and one oversized chunk.

A spec owns the port, path, and child it acquires. Teardown releases them. A spec that passes only when run alone is a defect in the spec.

## Enforce in the operation

```ts
export function write(bytes: Uint8Array, limit: number): Uint8Array {
  if (bytes.byteLength > limit) throw new Error(`body exceeds ${limit}`)
  return bytes
}
```

Effect: a caller that skips a facade still hits the limit. The check is in `write`, not only in the facade that usually calls it.

## Publish after commit

```ts
export function save(store: Map<string, string>, key: string, value: string, notify: (value: string) => void): void {
  store.set(key, value)
  notify(store.get(key) ?? value)
}
```

Effect: `notify` runs after `set`. A throw from `set` emits nothing. The argument to `notify` is the stored value.

## Bounds

```ts
export function emit(payload: string, wrapper: string, limit: number): string {
  const complete = wrapper + payload
  if (Buffer.byteLength(complete) > limit) throw new Error(`emit exceeds ${limit}`)
  return complete
}
```

Effect: the limit counts the wrapper. A test at `limit === complete.length` passes. One extra byte throws. A single oversized chunk throws before a second chunk is read.

## Spec owns what it acquires

```ts
export async function withChild(open: () => Promise<Child>, body: (child: Child) => Promise<void>): Promise<void> {
  const child = await open()
  try {
    await body(child)
  } finally {
    await child.dispose()
  }
}
```

Effect: the child is gone when `withChild` returns, including when `body` throws. A second spec can open the same port. A spec that passes only when run alone is a defect in the spec.

## Not this

```ts
try {
  await child.kill()
} catch {
  return
}
```

Effect of the mistake: the caller observes success. The kill failure is gone, so a later step starts on a live child.
