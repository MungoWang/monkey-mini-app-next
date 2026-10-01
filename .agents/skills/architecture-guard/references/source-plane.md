# Source plane

Read this when a test, a typecheck, or a gate resolves a workspace package.

Static checks and tests resolve workspace imports to `src`. A gate that reads built `lib/` says so in the command that runs it. The two planes are not mixed in one check.

## Example

```json
{
  "compilerOptions": {
    "paths": {
      "@mohou/values": ["./packages/util/values/src/index.ts"]
    }
  }
}
```

Effect:

- `pnpm typecheck` and `pnpm test` pass on a clean tree without a prior build of `lib/`.
- A check that spawns plain Node against `lib/` is a separate command. It fails if `lib/` is missing. It does not fall back to `src`.
- An import of `@mohou/values` in a test hits `src/index.ts`, so the test and the typecheck see the same file.

## Not this

```ts
import { assertNever } from '../../lib/index.js'
```

Effect of the mistake: the test passes against a stale build while `src` has already changed. The next clean checkout fails because `lib/` is absent.
