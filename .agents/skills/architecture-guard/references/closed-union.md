# Closed union

Read this when switching on a tag that the type already lists in full.

The last arm is `assertNever` from `@mini-app/values`. A merge-extensible tag is not closed. It falls through a documented default and does not call `assertNever`.

## Example

```ts
import { assertNever } from '@mini-app/values'

type Kind = 'open' | 'closed'

export function label(kind: Kind): string {
  switch (kind) {
    case 'open':
      return 'open'
    case 'closed':
      return 'closed'
    default:
      return assertNever(kind, 'label')
  }
}
```

Effect:

- Adding `'locked'` to `Kind` fails the build at `assertNever(kind)` until a case exists.
- A value that escaped the type throws `unreachable variant in label: "locked"`. The rendered value is in the message.
- Callers do not need a fallback string. An unknown tag is a thrown error, not `'unknown'`.

## Merge-extensible tag

```ts
export function label(kind: string): string {
  switch (kind) {
    case 'open':
      return 'open'
    case 'closed':
      return 'closed'
    default:
      return kind
  }
}
```

Effect: a tag added by another package passes through. `assertNever` is not used. The caller observes the tag string, not a thrown unreachable error.

## Not this

```ts
switch (kind) {
  case 'open':
    return 'open'
  case 'closed':
    return 'closed'
  default:
    return 'unknown'
}
```

Effect of the mistake: a new tag compiles. Callers observe `'unknown'` and cannot tell a bug from a real label.
