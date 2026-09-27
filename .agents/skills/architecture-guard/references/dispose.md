# Dispose

Read this when code starts a child process, a client, or a timer.

Lifecycle is create, start, request, dispose. Create registers no child. Start opens children. Request uses the live child or throws. Dispose stops new work, clears timers, awaits in-flight work, awaits child exit, then runs stored disposers.

One asynchronous operation has one owner. A leaf helper takes the value it uses. It does not take the process root to avoid a parameter.

## Example

```ts
type Child = {
  close(): Promise<boolean>
  dispose(): Promise<void>
}

export async function shutdown(child: Child): Promise<void> {
  const closed = await child.close()
  if (!closed) throw new Error('child close was not confirmed')
  await child.dispose()
}

export function scheduleRetry(attempt: () => void, delayMs: number): () => void {
  const timer = setTimeout(attempt, delayMs)
  timer.unref()
  return () => clearTimeout(timer)
}
```

A generation token decides which child is current. A stale `onclose` returns. It does not register tools, emit state, or start the next child.

```ts
function generationDown(generation: Client, current: Client | undefined): void {
  if (current !== generation) return
  scheduleRetry(connect, delayMs)
}
```

Effect:

- `shutdown` returns only after the child has exited, or throws when close is not confirmed. The next child is not spawned in that gap.
- A late close from the previous generation does not schedule a retry.
- The retry timer does not hold the process open. Dispose still clears it.
- A request against a disconnected child throws. It does not return `[]`.
- A second registration of the same service name throws. The live implementation stays.
- A registration returns a disposer. After dispose, a lookup of that name misses.

## Request when the child is down

```ts
export async function call(child: Child | undefined, method: string): string {
  if (child === undefined) throw new Error(`child is down: ${method}`)
  return child.request(method)
}
```

Effect: the caller receives `child is down: list`. It does not receive `[]` from a disconnected child.

## One registration

```ts
type Entry = { name: string, dispose(): void }

export function register(map: Map<string, Entry>, entry: Entry): () => void {
  if (map.has(entry.name)) throw new Error(`already registered: ${entry.name}`)
  map.set(entry.name, entry)
  return () => {
    entry.dispose()
    map.delete(entry.name)
  }
}
```

Effect: a second `register` of the same name throws. The first entry stays. Calling the returned function removes that name. A lookup after dispose misses.

## One owner

```ts
export async function run(child: Child, signal: AbortSignal): Promise<string> {
  return child.request('list', signal)
}
```

Effect: `run` takes the child and the signal. It does not take the process root to reach them. Create does not open the child. Start does.

## Not this

```ts
export function stop(child: Child): void {
  void child.dispose()
}
```

Effect of the mistake: `stop` returns while the child is still running. The next start can overlap it.
