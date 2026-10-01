# Agent Note: Type stripping forbids parameter properties

Status: implemented

## Problem

`pnpm dev:host` runs `packages/shell/src/dev.ts` with Node `--experimental-strip-types`. `McpClient` used constructor parameter properties. Strip-only mode threw `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` before Host started.

## Decision

Constructor fields are assigned in the body. `erasableSyntaxOnly` is on in `tsconfig.base.json`, so typecheck fails the same syntax Node cannot strip.

## Alternatives considered

- Switch `dev:host` to `tsx` or `--experimental-transform-types`. Lost because the repo already chose type stripping, and the constructor rewrite is smaller than a second TypeScript runner.
- Leave the constructor and document the crash. Lost because the command is the product boot path.

## Consequences

A new parameter property fails `pnpm run typecheck` before `dev:host`. Enums and namespaces are refused for the same reason. The Node boot graph cannot import `.tsx`; Shell reads panel CSS from `@mohou/panel/chrome`.
