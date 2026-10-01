# Package boundary

Read this when adding a package or an import that crosses packages.

A package has one role, stated in its README: `values`, `definition`, `provider`, `consumer`, or `composition`. Split definition, provider, and consumer only when those roles change for different reasons. A group directory is a container: no `package.json`, no source.

Cross-package imports use the package name. A path under another package's `src/` is not an import path.

## Values

```ts
export function assertNever(value: never, context?: string): never {
  const rendered = JSON.stringify(value) ?? String(value)
  const label = context === undefined ? '' : ` in ${context}`
  throw new Error(`unreachable variant${label}: ${rendered}`)
}
```

Effect: every other package can import this helper. The file imports no package from this repo, so a change in a provider does not rebuild the helper for a new dependency.

## Definition

```ts
export type Port = number & { readonly __brand: 'Port' }

export function port(value: number): Port {
  return value as Port
}
```

The definition package imports `values` and other definitions. It does not import the package that opens the socket.

Effect: replacing the socket provider does not change this file. A consumer and the provider both import `Port`. Neither re-parses the brand.

## Composition wires the provider

```ts
import { port, type Port } from '@mohou/ports'
import { openSocket } from '@mohou/socket-local'

export async function boot(raw: unknown): Promise<{ port: Port, close(): Promise<void> }> {
  const resolved = port(resolvePort(raw, 'port'))
  const socket = openSocket(resolved)
  await socket.start()
  return socket
}
```

`resolvePort` is the boundary function from [resolve-at-boundary.md](resolve-at-boundary.md). `openSocket` lives in the provider package. The consumer receives the started value. It does not import `@mohou/socket-local`.

Effect: a request handler cannot construct a second socket stack. Tests replace `openSocket` at the composition root, not inside the consumer.

## Deep import

```ts
import { hidden } from '@mohou/socket-local/src/private.ts'
```

Effect of the mistake: callers depend on a file the package did not export. Moving that file breaks them even when the package name and the public entry stay the same.

## Provider does not import a consumer

```ts
import { Panel } from '@mohou/panel'

export function paint(panel: Panel): Panel {
  return panel
}
```

Effect of the mistake: the socket provider cannot load without the panel package. A second consumer cannot reuse the provider.

## Consumer does not construct a provider

```ts
import { openSocket } from '@mohou/socket-local'

export function onRequest(): void {
  void openSocket(port(8080)).start()
}
```

Effect of the mistake: the request path builds a second socket stack beside the one `boot` already started.

## Not this

```ts
import type { Socket } from '@mohou/socket-local'

export type Port = Socket['port']
```

Effect of the mistake: the definition package now changes when the provider changes. Callers who only needed a port number compile against the socket implementation.
