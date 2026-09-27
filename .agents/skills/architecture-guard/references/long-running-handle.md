# Long-running handle

Read this when work outlives the call that started it.

The start call returns a handle. Collecting output and cancelling are later calls on that handle. The start call does not block until the work finishes.

## Example

```ts
type Child = {
  readonly id: string
  readonly done: Promise<{ readonly status: 'completed' | 'killed' | 'failed', readonly output: string }>
  read(): string
  cancel(): Promise<void>
}

export function start(command: string, spawn: (command: string) => Child): Child {
  const child = spawn(command)
  return child
}
```

Effect:

- The caller of `start` receives `id` before `done` settles.
- A later `read` or `cancel` addresses that id. A second start does not reuse it.
- Disposal of the owner cancels the handle and awaits `done`.
- `start` throwing leaves nothing registered. The provider cleans up anything it already spawned.

## Not this

```ts
export async function start(command: string): Promise<string> {
  const handle = spawn(command)
  return handle.done
}
```

Effect of the mistake: the caller cannot cancel or read until the work is over. The return value is the final output, not a handle.
