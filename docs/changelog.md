---
status: locked
updated: 2026-09-29
---

# Changelog

This page owns released version notes. The product version is the `version` field of `@mini-app/shell`. `@mini-app/host` carries the same string because the about block prints it. The window crate uses the same string. [development.md](development.md) owns the build command.

## 1.0.5

When a workbench fills the slot, the status row chip names a custom home, more in a tab, and an open-in-new-tab arrow. Clicking current home on a workbench tab writes the builtin library. Opening settings, history, or storage, and closing a tab, no longer flash a window scrollbar. An MCP reconnect that exhausts its budget leaves the server registered; `mcp-not-connected` is an unknown id only.

## 1.0.4

App-tab set-as-home is pin plus the home label; delete is a trash icon in the same block. Chrome hints use the panel tooltip with card, border, and foreground tokens. The home desk switcher shows a grid icon on the builtin library and an acronym tile on each workbench. The status-row workbench control stays on the right. An update confirm returns before the sidecar restarts, so a dropped connection is not a failed install.

## 1.0.1

Settings, history, and storage open with a short rise instead of a hard fade. Local app bundles copy their tarballs to `~/.mini-app/packages` so an installed tarball build can see a newer pack.

## 1.0.0

Product name is Mohou (墨猴). The window title follows the panel locale. [Window and event bridge](product/shell/window.md) owns the name.

`pnpm build:artifact` writes `artifacts/Mohou-1.0.0-<platform>/`. That directory holds the release window binary named Mohou, the panel bundle, a `VERSION` file, and a `run` script. The script starts Host from this checkout and points it at that directory. It is not a signed installer. Native addons stay in the workspace install.

The ten workspace packages publish at this version. `pnpm publish:packages` uploads them only when `MINI_APP_PUBLISH=1`. [Package architecture](architecture/packages.md) owns the set.

### Shell and Host

- One live Host session. Window exit, `SIGINT`, and `SIGTERM` dispose it.
- An external `http` or `https` link, and `mailto:`, open outside the app. Same-origin links stay. `javascript:` runs in the iframe. There is no contained browser.
- `ctx.log` appends JSON lines under `apps/<appId>/logs/`. History snapshots skip `logs/`, `dist/`, `.cache/`, and `.autogen/`.
- Compile writes the UI bundle and stylesheet under `.autogen/`.
- App opens are recorded in `activity.json` and returned on the owner list as `activity`.
- Authoring register takes manifest fields and returns `needed` paths. The agent writes source with its own file tools. A `files` field is rejected.
- A successful reload of a dirty tree commits. A failed reload does not.
- Runtime diagnostics stay off `ctx.push`. A view render error paints in the iframe. A module load failure paints into the app root.
- Open app tabs share one host event stream. The tab appears before the bundle finishes building.

### Panel

- Library gallery with card styles `glass`, `stamp`, `etch`, `hero`, `pulse`, and `list`.
- Workbench slot: a workbench app fills the home frame; the tab strip and host chrome stay on the panel. `ctx.workbench` is the app API.
- Settings, theme picker, MCP editor, history (read-only), storage browse with restore, reload and trash delete.
- Close-panel is hidden in the shipped window. There is no dock mode. Narrow layout is deferred.

### App contract and kit

- `ctx` members: storage, state, credentials, config, log, signal, http, bash, pwsh, metrics, push, llm, agent, mcp.
- `useApp().call`, `on` / `onAny`, and `resolveAssetUrl` for `assets/`.
- UI kit with layout presets, editors, charts, illustrations, and `LiveRefresh` for app-owned soft timers. Kit coverage is outside the 85% gate.
- Facades and looks ship in the author skill. Skill version is independent of the package version.
- Authoring MCP discovery is two tools: `mini_app_mcp_list` returns server and tool names only; `mini_app_mcp_tools({ serverId, toolName? })` returns descriptions and schemas for one server. Both are on the author MCP catalog and HTTP invoke, not on `ctx`.

### Platforms

- macOS and Windows code paths ship together. A Windows machine pass of the Tauri window is after 1.0.
- Linux has no panel window.
