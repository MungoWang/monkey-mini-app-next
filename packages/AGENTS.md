---
status: locked
updated: 2026-10-01
---

# AGENTS.md — Packages

These rules add to the root [conventions](../AGENTS.md#conventions). Grouping and roles: [README.md](README.md).

- One package per directory under `packages/<group>/<pkg>`. npm scope `@mohou`. A package has one role, stated in its README. Create the package when it has code. The import scene is [.agents/skills/architecture-guard/references/package-boundary.md](../.agents/skills/architecture-guard/references/package-boundary.md).
- ESM (`"type": "module"`). Cross-package imports use the package name. Relative imports use a `.ts` specifier.
- Explicit resolution at a package boundary is a named `resolve` step in the owning module. The operation that consumes the result does not apply a hidden default.
- `src/index.ts` is the typed entry. Tests live in `tests/`, not under `src/`.
- `pnpm run test:coverage` is the coverage gate. Lines, branches, functions, and statements are each at least 85% for `packages/*/*/src`. A package that adds behavior adds tests in the same change.
- Package `tsconfig.json` extends `tsconfig.base.json`. This repository has one compiler face ([development.md](../docs/development.md)).
- A closed union ends in `assertNever` from `@mohou/values`.
- An exported type spells its words. `AppContext`, not `AppCtx`. A parameter may stay `ctx` when that is the call-site name. The type, and the file that exports it, do not inherit that abbreviation. Initialisms that are already words stay (`HTTP`, `JSON`, `URL`). A field may be `id`. A type name does not shorten `Identifier` to `Id` or `Context` to `Ctx`.
- `unknown` is for a value that has not been admitted: wire JSON, `JSON.parse`, method `args`, and `storage.get`. A value the author declares keeps its type. Do not erase it to `Record<string, unknown>`.
- A product path, file name, or directory name is one exported table in the package that owns it. Call sites use that table or its path helper. Do not spell `storage`, `app.sqlite`, `manifest.json`, `package.json`, or the same class of name at a second site. A test that needs the path imports the helper. The product page may still name the file; that is the fact, not a second implementation.
- A bag of injected abilities is named `Capabilities`. `Port` is one channel, not the bag. `CallCapabilities`, not `CallPorts`.
- A package README with no contract of its own is one line pointing at [docs/product/features.md](../docs/product/features.md).
