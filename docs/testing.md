---
status: locked
updated: 2026-09-20
---

# Testing

Commands are in [development.md](development.md). This page owns which tier proves what.

## Tiers

- **Unit** (`pnpm run test`). Specs live in `packages/<group>/<pkg>/tests/`, next to the code they exercise. Cover the contract, the error code, and the edge that a later edit will break. A type-only export needs no runtime test.
- **Coverage** (`pnpm run test:coverage`). This is the gate inside `pnpm run check`. Lines, branches, functions, and statements are each at least 85% for `packages/*/*/src`, excluding the UI kit, the author templates, and the esbuild builders (panel page, `dev.ts`, vendor CLI). Those builders are the real-entry tier. Coverage shows a line ran. It does not show the feature works.
- **Real entry**. When a process exists, one test boots that process and checks a result outside the process: a file on disk, an HTTP response, or a disposed child. A hand-built function call does not replace it. This tier starts with the process, not before.
- **Expected output**. A user-visible result that is awkward to assert in a unit spec keeps its expected file under that package's `tests/expected/`. Review the diff. Do not record a model transcript as the oracle.
- **Live provider**. A test that calls a real model or a real external server self-skips when its key is absent. Keyless runs stay green. A no-key test proves plumbing. It does not prove the provider.

Performance and browser stress runs are not gates until a measured path exists.

A complete run on a Windows machine is not a gate until the Tauri app exists and the product features that app hosts are in it. Until that run, each change still includes the Windows code path beside the macOS path. [implementation.md](product/implementation.md) owns that rule. The machine pass is that Tauri app on Windows, not an earlier browser session.

## What a spec may fake

Fake only the boundary that is expensive or non-deterministic: a model, a clock, a remote network. Keep the code under test real. An assertion that only checks the object's own return value is weaker than one that re-reads the file or the record.

## Isolation

Specs run in forked workers and may run together. A spec owns the port, path, and child it acquires, and teardown releases them. A spec that passes only when run alone is a defect in the spec.

## Source plane

Unit and coverage runs resolve workspace imports to `src`. A test that spawns built `lib/` says so and fails if `lib/` is missing. It does not fall back to `src`.
