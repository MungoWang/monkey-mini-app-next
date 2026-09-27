# Resolve at the boundary

Read this when a function accepts config text, wire JSON, or file bytes.

One `resolve*` function admits the raw value. It throws, names the field, and returns a frozen value. `run`, `handleRequest`, and `execute` read that value. They do not apply `??`.

A value already typed inside the process is not checked again. `JSON.parse` stays `unknown` until `resolve*` accepts it.

## Example

```ts
export interface RetryPolicy {
  readonly initialDelayMs: number
  readonly maxDelayMs: number
  readonly maxAttempts: number
}

const DEFAULTS = Object.freeze({
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  maxAttempts: 10,
})

export function resolveRetryPolicy(raw: unknown, path: string): RetryPolicy {
  if (raw === undefined) return DEFAULTS
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${path} must be an object`)
  }
  const record = raw as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!Object.hasOwn(DEFAULTS, key)) throw new Error(`${path}.${key} is not a retry option`)
  }
  const initialDelayMs = typeof record.initialDelayMs === 'number' ? record.initialDelayMs : DEFAULTS.initialDelayMs
  const maxDelayMs = typeof record.maxDelayMs === 'number' ? record.maxDelayMs : DEFAULTS.maxDelayMs
  const maxAttempts = typeof record.maxAttempts === 'number' ? record.maxAttempts : DEFAULTS.maxAttempts
  if (!Number.isFinite(initialDelayMs) || initialDelayMs <= 0 || initialDelayMs > maxDelayMs) {
    throw new Error(`${path}.initialDelayMs must be a positive finite number no greater than maxDelayMs`)
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error(`${path}.maxAttempts must be a positive integer`)
  }
  return Object.freeze({ initialDelayMs, maxDelayMs, maxAttempts })
}

export function run(policy: RetryPolicy): number {
  return policy.maxAttempts
}
```

Effect:

- Omitted config loads the frozen defaults. The caller of `run` cannot tell which fields were omitted.
- `{ extra: true }` throws `retry.extra is not a retry option` before start. The process does not boot with a partial policy.
- `initialDelayMs: 0` throws. `run` is not called.
- `run` does not read the raw object and does not apply `??`.

## Wire value stays unknown

```ts
export function resolveBody(raw: string, path: string): RetryPolicy {
  const parsed: unknown = JSON.parse(raw)
  return resolveRetryPolicy(parsed, path)
}
```

Effect: a typed caller of `run` never sees the parsed JSON. A value that already passed `resolveRetryPolicy` is not checked again inside `run`.

## Path base

```ts
export function resolveExecutable(configured: string | undefined, base: string | undefined, path: string): string {
  if (configured !== undefined && configured.length > 0) return configured
  if (base === undefined) throw new Error(`${path} base is undefined`)
  return `${base}/bin/tool`
}
```

Effect: a missing base throws `${path} base is undefined`. The path is not joined onto `process.cwd()`.

## Optional file

```ts
export function readOptional(file: string): string | undefined {
  try {
    return readFileSync(file, 'utf8')
  } catch (error) {
    if (isEnoent(error)) {
      console.warn(`optional file missing: ${file}`)
      return undefined
    }
    throw error
  }
}
```

Effect: a missing optional file logs that path and continues. A permission error throws. The caller does not observe an empty string for both cases.

## Not this

```ts
export function run(raw: { port?: number }): number {
  return raw.port ?? 8080
}
```

Effect of the mistake: an illegal port and a missing port look the same. The default is invisible to the loader, so a bad file still starts.
