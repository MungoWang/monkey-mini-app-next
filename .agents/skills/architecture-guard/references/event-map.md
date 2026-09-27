# Event map

Read this when adding a fact that another package will observe.

Producers and consumers share one typed map. The key is the event name. The payload is the map's value. An unknown key does not typecheck.

## Example

```ts
export interface EventMap {
  'run:started': { readonly id: string }
  'run:finished': { readonly id: string, readonly exitCode: number | null }
}

export function emit<K extends keyof EventMap>(key: K, payload: EventMap[K], write: (key: K, payload: EventMap[K]) => void): void {
  write(key, payload)
}
```

Effect:

- `emit('run:started', { exitCode: 0 }, write)` fails the build. The payload does not match that key.
- A new event is a new key on `EventMap`. Producers and consumers change together.
- A key absent from the map is not emitted under a cast. A merge-extensible map documents the default for unknown keys. It does not pretend they were declared.

## Not this

```ts
export function emit(key: string, payload: unknown): void {
  bus.set(key, payload)
}
```

Effect of the mistake: a typo in the key compiles. The consumer waits on `run:finished` and never sees `run:finshed`.
