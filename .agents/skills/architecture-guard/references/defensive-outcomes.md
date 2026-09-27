# Outcomes and callbacks

Read this when a result has more than one fact, when several listeners share a dispatch, or when code spawns a process or deletes a path.

## Orthogonal facts

```ts
export interface RunResult {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
  readonly timedOut: boolean
}
```

Effect: a process can time out and still report exit code 0. The caller reads `timedOut` and `exitCode` as separate fields. Nesting the timeout inside `if (exitCode === 0) return success` hides the timeout.

## One public shape

```ts
export async function run(executor: Executor, command: string, signal: AbortSignal): Promise<RunResult> {
  try {
    return await executor.run(command, signal)
  } catch (error) {
    if (isAbort(error)) {
      return { exitCode: null, signal: null, timedOut: false, aborted: true, stdout: '', stderr: '' }
    }
    throw error
  }
}
```

Effect: every provider may throw or return. Callers of `run` see one `RunResult` for an abort and a thrown error for a consumer bug. They do not guess which provider shape they caught.

## Status is not one result

```ts
export async function waitDone(handle: { done: Promise<string> }): Promise<string> {
  return handle.done
}
```

Effect: the caller waits on the handle's own `done`. It does not treat a shared `status === 'idle'` as the result of this call. Several calls can share one idle interval. If `done` can never settle, the caller has an explicit branch for that, instead of hanging.

## One listener does not sink the dispatch

```ts
export function emit(listeners: Array<(event: string) => void>, event: string, log: (error: unknown) => void): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch (error) {
      log(error)
    }
  }
}
```

Effect: a throwing listener is logged. The listeners after it still run. `emit` itself does not reject.

## Spawned commands do not inherit secrets

```ts
export function scrub(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = {}
  for (const [key, value] of Object.entries(env)) {
    if (/KEY|SECRET|TOKEN|PASSWORD/i.test(key)) continue
    next[key] = value
  }
  return next
}
```

Effect: a child process environment has no key, secret, token, or password entry from the parent. Spill files use a private directory, a random name, and an exclusive owner-only create. A predictable world-readable path is not a spill path.

## Delete the link, not its target

```ts
import { lstatSync, unlinkSync } from 'node:fs'

export function removeLink(path: string): void {
  if (!lstatSync(path).isSymbolicLink()) throw new Error(`${path} is not a link`)
  unlinkSync(path)
}
```

Effect: `unlinkSync` removes the link. It does not follow the link into the target. Recursive removal is reserved for a path already known to be a real directory.
