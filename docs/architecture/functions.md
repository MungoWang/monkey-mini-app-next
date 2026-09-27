---
status: locked
updated: 2026-09-19
---

# Functional architecture

This page cuts the product by who uses it. It does not follow a previous package tree. Feature pages own call fields. [packages.md](packages.md) owns the package cut. [implementation.md](../product/implementation.md) owns how a call is built. This page owns the caller cut.

## Three surfaces

One product, three callers. Each caller has one surface. A surface does not reach into another surface's process.

| Caller | Surface | Does |
| --- | --- | --- |
| The person who owns the machine | [Owner surface](../product/owner-surface.md), over HTTP | Lists apps, opens one, changes settings, reads history and storage, reloads a view, deletes an app. Does not write app source. Does not construct Host. |
| The authoring agent | [Author surface](../product/author-surface.md) | Creates and edits an app, reloads, calls a method, reads view failures. Does not receive the app `ctx` bag. Does not delete the app directory. |
| The running mini-app | [App surface](../product/app-surface.md) | Stores, calls the network, runs a command, asks a model, pushes events to its own view. Does not see authoring tools. Does not choose the model vendor. |

Shell is not a fourth surface. It is the composition root: the only process that constructs Host, injects the brain, and opens the panel against that origin.

## Records

Each fact has one committed record. A view is derived from it.

| Fact | Record | Who writes |
| --- | --- | --- |
| App source | one history branch per app | authoring tools, after a successful change |
| App data | one SQLite file per app | the app, through `ctx.storage` |
| Host policy | `host.json` | Shell bootstraps a missing file. Panel writes public fields. A present corrupt file fails boot. |
| External tool servers | `mcp.json` | Panel MCP editor on save. A missing file is zero servers. A present invalid file fails boot. |
| Progress to an open view | per-app event buffer | `ctx.push` only |
| Panel and Shell signals | host event stream | Host. An author view does not subscribe. |

The iframe isolates a crashed view from the panel. It does not confine the machine.

## What can be swapped

A seam exists only where a second implementation changes for a different reason. One implementation stays one owner.

| Function | Seam | Why it swaps |
| --- | --- | --- |
| The brain (`llm`, `agent`) | yes | Shell registers providers. Host calls the interface. Switching model does not change that provider's tool set. Switching provider replaces the brain. `echo` is always registered and has no tools. |
| External tools | yes | `ctx.mcp(serverId, toolName, args)` calls one configured server. Args are the tool's own object. The authoring catalog is not on this client. |
| Platform modules the app may import | one table | The compiler, the loader, and the served file read the same row. Adding a module is one row, not a new package per app. |

These stay one owner until a second provider exists: storage, HTTP, bash, push, compile, history, install, the panel, the authoring tool implementation. Do not split them to mirror the feature pages.

## What a new package is

A package appears when it has code and its role changes for a different reason than the package that calls it. The feature list is not a package list. An empty directory is not an architecture.

Authoring MCP and the HTTP tool route are two consumers of one tool implementation. Panel is a consumer of Host HTTP. The app contract is the definition of `ctx`. Host provides that definition until a second provider exists.
