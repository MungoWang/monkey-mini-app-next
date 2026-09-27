# Derived view

Read this when a second representation of the same facts appears: a cache, a prompt, a UI echo, a replay, or a query.

One committed record is the source. Every other view is derived from it after the write commits. A live incremental stream is not that record.

## Example

```ts
type Event = { readonly seq: number, readonly name: string, readonly data: unknown }

export function project(events: readonly Event[]): Map<string, unknown> {
  const state = new Map<string, unknown>()
  for (const event of events) state.set(event.name, event.data)
  return state
}
```

Effect:

- A reader that missed the live stream rebuilds the same map from the committed events.
- A notification fires after the event is appended. A failed append emits nothing.
- A cache that cannot be rebuilt from the log is a second source. It is deleted or derived.

## Not this

```ts
export function onLive(name: string, data: unknown, cache: Map<string, unknown>): void {
  cache.set(name, data)
}
```

Effect of the mistake: a process restart loses `cache` while the log still has the event. The next reader and the live reader disagree.
