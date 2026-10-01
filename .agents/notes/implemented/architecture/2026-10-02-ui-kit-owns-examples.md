# Agent Note: the UI kit owns its examples

Status: implemented

## Problem

`scripts/gen/skill/fixtures/components/` held one author-facing example per kit component. The generator read them as text and published them into the skill, so nothing compiled them: they resolved no workspace `node_modules`, `tsc` reported 302 `Cannot find module 'react'` errors for the directory, and no test bundled an example. A stale prop or a wrong argument shipped to authors regardless.

## Decision

The examples and their shared helpers are `packages/app/ui/examples/`, beside `tests/`. The root [tsconfig.json](../../../../tsconfig.json) typechecks that directory, so `pnpm typecheck` covers every example. `pnpm gen:skill` reads them there and publishes them into `skills/mohou-mini-app/references/examples/`. The look pages are hand-written under `skills/mohou-mini-app/references/looks/`. [Package architecture](../../../docs/architecture/packages.md) owns the package cut.

## Alternatives considered

- Keep the examples under the generator. Lost because no TypeScript project covered them, so they were never compiled.
- Add a `ui-examples` workspace package. Rejected again: packages.md does not list one, and the kit is the natural owner.
- Put the examples under `packages/app/ui/src`. Lost because `files` ships `src`, so every consumer would download all 84 examples.
- Generate each example from the component. Lost because the `@exampleOf` / `@scenario` metadata is authoring judgment, not derivable from source.

## Consequences

- Retiring or renaming a prop now fails `pnpm typecheck` while its example still uses it.
- Nine examples held real type errors and were repaired in the same change.
- The generator reads one directory for examples and another for looks.
