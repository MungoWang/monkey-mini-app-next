# Scope

Read this when a registration is visible to more than one owner, or when a child must not see a parent's private registration.

A registration is global, or it is owned by exactly one scope key. Scope keys compare by object identity. A scoped name does not inherit to children. Parent and child facts are data on the record. They are not a visibility chain.

## Example

```ts
type Scope = object

type Registration = {
  readonly name: string
  readonly scope?: Scope
}

export function visible(registrations: readonly Registration[], scope: Scope): Registration[] {
  const byName = new Map<string, Registration>()
  for (const registration of registrations) {
    if (registration.scope !== undefined && registration.scope !== scope) continue
    const current = byName.get(registration.name)
    if (current === undefined || current.scope === undefined) byName.set(registration.name, registration)
  }
  return [...byName.values()]
}
```

Effect:

- A tool registered on the parent scope is absent from the child. The child does not inherit it.
- A scoped `bash` replaces the global `bash` for that scope only. Other scopes still see the global one.
- `parentId` on a record does not make the parent's scoped tools visible.
- Setup registers before the owner is published. Setup does not run the owner.

## Not this

```ts
export function visibleToChild(parent: Scope, child: Scope, registrations: readonly Registration[]): Registration[] {
  return registrations.filter(registration => registration.scope === parent || registration.scope === child)
}
```

Effect of the mistake: the child sees the parent's private registration. Isolation depends on callers remembering not to look up.
