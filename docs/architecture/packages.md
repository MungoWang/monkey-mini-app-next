---
status: locked
updated: 2026-09-23
---

# Package architecture

This page is the package cut. [functions.md](functions.md) owns who calls what. A package appears when it has code. This page does not create directories.

**Now** is the tree that exists. The Tauri window crate is `packages/launcher/tauri` (not inside `@mini-app/shell`). Sidecar process ownership and Settings npm-update UX: [.agents/notes/proposed/architecture/2026-09-23-shell-sidecar-and-launcher.md](../../.agents/notes/proposed/architecture/2026-09-23-shell-sidecar-and-launcher.md).

Grouping is `packages/<group>/<pkg>`. npm scope `@mini-app`. A group directory has no `package.json`. Apps live under `apps/*`.

## Direction

```
values
  └── contract          definition of the app surface
        └── runtime-provider   brain interface and echo
              └── host         app runtime; consumes the brain; does not embed a vendor
                    └── shell  constructs echo and Pi; the only constructor of host
runtime-pi                   Pi brain; Shell injects it; Host does not import it
panel                        consumer of host over HTTP; does not import host
```

A definition does not import a provider. A provider does not import the panel or the shell. The panel does not import the host. The shell imports the host and the brain, and constructs both.

## Host and kernel

Host is the owner of the app runtime. Kernel is the part of Host that builds one app call and tears it down. They are not two products.

Kernel is the call loop: build one `AppContext`, run that call, dispose it. Binding the brain onto `llm` and `agent` is one part of that loop. Resolving the working directory is another. Storage, HTTP, bash, and push are further ports on the same loop, not a reason to start a second kernel.

Kernel does not open a socket, read or write app source, compile, or own history. Those stay Host, beside the kernel module.

## Now

| Path | Name | Role | Owns |
| --- | --- | --- | --- |
| `packages/util/values` | `@mini-app/values` | `values` | `assertNever`, branded strings |
| `packages/app/contract` | `@mini-app/contract` | `definition` | app id, manifest, `defineApp`, `AppContext`, the codes it throws |
| `packages/app/view` | `@mini-app/app-view` | `definition` | views of an app shared by the panel and the UI kit. No `useApp` |
| `packages/app/ui` | `@mini-app/ui` | `definition` | author UI kit and `useApp`. Host vendor-builds one copy. It re-exports `@mini-app/app-view` |
| `packages/runtime/provider` | `@mini-app/runtime-provider` | `provider` | brain interface, model catalog check, `echo` |
| `packages/runtime/pi` | `@mini-app/runtime-pi` | `provider` | Pi brain. `agent` is an in-memory session. Shell injects it. Host does not import it |
| `packages/host` | `@mini-app/host` | `provider` | kernel call loop; SQLite storage beside it |
| `packages/mcp/client` | `@mini-app/mcp-client` | `provider` | external MCP sessions for `ctx.mcp` |
| `packages/panel` | `@mini-app/panel` | `consumer` | panel views. It does not import Host |
| `packages/shell` | `@mini-app/shell` | `composition` | constructs Host, attaches the panel document, and may open the panel origin |
| `packages/launcher/tauri` | *(crate, not npm)* | `launcher` | Tauri panel window binary `mini-app-window`. Not packed into `@mini-app/shell` |

Authoring tools stay inside `@mini-app/host` until a second consumer forces a split. The UI toolchain stays there too: React, the UI kit, Tailwind, and esbuild. A compile package, or a child process whose only job is that toolchain, waits until a second consumer exists or Host must start without it. MCP and the HTTP invoke route are projections, not a second package of behavior.

A second brain is a new provider package. It implements `RuntimeProvider`. `echo` stays in `@mini-app/runtime-provider`. The interface moves to its own definition package only when that second brain exists and the interface would otherwise change with `echo`.

## Publish

The ten packages in the table above are the npm publish set. `@mini-app/root` is not. Each published package carries the `@mini-app/shell` version. `pnpm publish` rewrites `workspace:^` to that version. [development.md](../development.md) owns `publish:check` and `publish:packages`. The second command uploads only when `MINI_APP_PUBLISH=1`.

## Not a package

- One feature page.
- Storage, HTTP, bash, push, compile, history, and install, while each has one implementation. They stay in the host package, outside the kernel module.
- A platform module row. That is a row in the host allowlist, not a workspace package per library.
- An empty directory held for a later layer.
- The panel window crate is `packages/launcher/tauri`. Shell may still spawn that binary in the monorepo/dev entry. A future entry where the launcher process owns shell as a pure sidecar is [.agents/notes/proposed/architecture/2026-09-23-shell-sidecar-and-launcher.md](../../.agents/notes/proposed/architecture/2026-09-23-shell-sidecar-and-launcher.md).
