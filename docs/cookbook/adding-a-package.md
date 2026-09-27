---
status: locked
updated: 2026-09-20
---

# Cookbook: adding a workspace package

Add a package under an existing group when the group already matches the role. A new group is a directory only: no `package.json` at the group level. One package per directory, npm scope `@mini-app`.

State the package role in its README before the first cross-package import. The scene, with the effect of a wrong import, is [.agents/skills/architecture-guard/references/package-boundary.md](../../.agents/skills/architecture-guard/references/package-boundary.md).

## 1. Create the directory

```
packages/<group>/<pkg>/
  package.json
  tsconfig.json
  src/index.ts
  README.md
  tests/          # when the package has behavior to run
```

`apps/<name>/` uses the same files. An app is a process entry, not another group under `packages/`.

## 2. package.json

- `"type": "module"`.
- `"name": "@mini-app/<name>"`. The package directory is `packages/<group>/<pkg>`.
- `exports["."]` points at the typed entry. Local relative imports inside `src` use a `.ts` specifier.
- `dependencies` lists only packages the role may import, each as `workspace:^`.
- A package that imports nothing in this repo has no workspace dependency.
- Do not set `private`. Set `publishConfig.access` to `public`, `engines.node` to the root range, and `files` to `src`, `lib/types`, and `README.md`. The version is the `@mini-app/shell` version. [Package architecture](../architecture/packages.md) owns the publish set.

## 3. tsconfig.json

Extend `tsconfig.base.json`. Set `rootDir` to `src`, `outDir` to `lib/types`, and list each workspace dependency under `references`. Do not inherit a `paths` map that points at another package's `src`: that pulls the file into this package and the editor reports ts(6059).

Add a `paths` entry in the root `tsconfig.json` for the new package name, pointing at `src/index.ts`. That entry is only for the repo-wide typecheck. `exports.types` points at `lib/types/index.d.ts`. Run `pnpm run types` after a public type change so the editor resolves the dependency instead of its source.

## 4. Name the role that exists

Name the current responsibility. Do not name a future expansion or the first caller. An exported type spells its words. The abbreviation rule is [packages/AGENTS.md](../../packages/AGENTS.md).

A package also has one architecture role: `values`, `definition`, `provider`, `consumer`, or `composition`. A swappable capability is a seam of definition, provider, and consumer. Split those packages only when the roles change for different reasons. [.agents/skills/architecture-guard/references/capability-seam.md](../../.agents/skills/architecture-guard/references/capability-seam.md)

| Word | Use it when | Do not use it when |
| --- | --- | --- |
| `Provider` | It supplies one implementation of a definition | It is the definition, the registry, or the process that wires providers |
| `Registry` | It owns named registrations, lookup, and disposal | Its main contract is dispatch or execution |
| `Resolver` | It computes one answer from supplied inputs | It owns that answer's lifecycle |
| `Presenter` | It converts values and performs no I/O | It subscribes, mutates state, or owns a child |
| `Gateway` | It adapts a process or network boundary | It only stores metadata |
| `Handle` | It refers to one live resource | It creates and manages the whole pool |
| `Store` | It owns one data set and offers snapshot or update | It validates a state machine or dispatches work |
| `Runtime` | It runs live work and owns cancellation across calls | It only stores records or resolves one value |

## 5. README

One line pointing at [docs/product/features.md](../product/features.md) until the package has a contract of its own. When it does, the README owns that contract and still links product behavior there instead of restating it.

## 6. Verify

```sh
pnpm install
pnpm run check
```

`pnpm run check` runs lint, typecheck, and test. Run the package test file directly when the change is confined to one package:

```sh
pnpm exec vitest run packages/<group>/<pkg>/tests/<behavior>.spec.ts
```
