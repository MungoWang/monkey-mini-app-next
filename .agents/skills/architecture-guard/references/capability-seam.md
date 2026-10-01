# Capability seam

Read this when a capability can be swapped, or when a package is growing a second implementation.

A seam is the whole capability: a definition, one or more providers, and one or more consumers. One role is not a seam. Split the roles into packages only when they change for different reasons. One provider and one consumer stay one package until a second appears.

The definition owns the vocabulary every current consumer programs against. It is not shaped by the first provider's quirks. A consumer imports the definition. It does not import a provider package.

## Example

```ts
export interface RunResult {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
  readonly timedOut: boolean
  readonly aborted: boolean
  readonly stdout: string
  readonly stderr: string
}

export interface Executor {
  run(command: string, signal: AbortSignal): Promise<RunResult>
}
```

A local provider implements `Executor` with a subprocess. A sandboxed provider implements the same `Executor`. The consumer calls `executor.run`. Swapping the provider does not change the consumer's import.

Effect:

- Replacing the local provider with the sandboxed one leaves the consumer package unchanged.
- A field only the local provider can fill does not land on `RunResult`. If both providers cannot express it, it is not in the definition.
- A public method whose only caller is one consumer is a private closure passed at construction, not a method on the definition.

## Two implementations

A definition that claims to be provider-neutral ships two providers that do not share internals. One may speak HTTP. The other may call a library with a different event vocabulary. Both implement `Executor`.

Effect: a field only the HTTP provider fills is rejected from `RunResult` while the second provider exists. The leak is caught when the definition is written, not when a third provider arrives.

## Not this

```ts
import type { LocalProcess } from '@mohou/executor-local'

export async function runTool(command: string): Promise<LocalProcess> {
  return startLocal(command)
}
```

Effect of the mistake: the consumer compiles against the local process type. A second provider cannot satisfy the call without editing the consumer.
