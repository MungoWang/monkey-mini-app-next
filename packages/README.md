---
status: locked
updated: 2026-09-20
---

# Packages

Grouping is `packages/<group>/<pkg>`. One package per directory. npm scope: `@mini-app`. A group directory has no `package.json` and no source. Apps live under `apps/*` and are not a package group.

A package is added when it has code. An empty package is not a placeholder for a later layer.

Each package has one role, stated in its README. The package cut is [docs/architecture/packages.md](../docs/architecture/packages.md). The import scene is [.agents/skills/architecture-guard/references/package-boundary.md](../.agents/skills/architecture-guard/references/package-boundary.md). Product behavior lives in [docs/product/features.md](../docs/product/features.md).

| Path | Name | Role |
| --- | --- | --- |
| `packages/util/values` | `@mini-app/values` | `values` |
| `packages/app/contract` | `@mini-app/contract` | `definition` |
| `packages/app/view` | `@mini-app/app-view` | `definition` |
| `packages/app/ui` | `@mini-app/ui` | `definition` |
| `packages/runtime/provider` | `@mini-app/runtime-provider` | `provider` |
| `packages/runtime/pi` | `@mini-app/runtime-pi` | `provider` |
| `packages/host` | `@mini-app/host` | `provider` |
| `packages/mcp/client` | `@mini-app/mcp-client` | `provider` |
| `packages/panel` | `@mini-app/panel` | `consumer` |
| `packages/shell` | `@mini-app/shell` | `composition` |

Package authoring rules: [AGENTS.md](AGENTS.md). Adding a package: [docs/cookbook/adding-a-package.md](../docs/cookbook/adding-a-package.md).
