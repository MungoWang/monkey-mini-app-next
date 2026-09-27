# Extension point

Read this when adding behavior to a capability that already has a definition.

New behavior registers on the extension point the definition documents. It does not edit the consumer, and it does not edit the loop that calls the consumer, unless that loop's own map says the change belongs there. When the loop changes, the map in that package's README changes in the same commit.

## Example

```ts
const executors = new Map<string, Executor>()

export function registerExecutor(name: string, executor: Executor): () => void {
  if (executors.has(name)) throw new Error(`already registered: ${name}`)
  executors.set(name, executor)
  return () => executors.delete(name)
}

export function executor(name: string): Executor {
  const found = executors.get(name)
  if (found === undefined) throw new Error(`no executor: ${name}`)
  return found
}
```

A new backend calls `registerExecutor('sandbox', sandboxExecutor)` from composition. The tool that runs commands still calls `executor(name).run`.

Effect:

- Adding a backend does not change the tool package.
- A missing name throws `no executor: sandbox`. The caller does not receive a silent no-op.
- The README row for this capability names `registerExecutor` as the extension point. A kernel change that bypasses it updates that row.

## Not this

```ts
export async function runTool(command: string): Promise<RunResult> {
  if (process.env.SANDBOX === '1') return sandboxRun(command)
  return localRun(command)
}
```

Effect of the mistake: the consumer now knows every backend. The next backend is another branch in the consumer.
