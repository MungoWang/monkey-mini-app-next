# Agent Note: 1.0 plan

Status: implemented

## Problem

A readiness review mixed four kinds of item: work that belongs in 1.0, work that waits until after 1.0, named non-goals, and questions that are not decided. [Embedded navigation](../../../docs/product/shell/navigation.md) was `deferred`. That mark recorded a skip during the first window pass. It was read as "not in 1.0". Agents were raising non-goals that had not reached a draft.

## Decision

This note is the shipped 1.0 cut list. It is not a product page. Product sentences stay on their own pages. Milestone membership is [the blueprint](../../../docs/blueprint.md). This note keeps order and what was deferred.

The contained view is on the 1.0 node. [Embedded navigation](../../../docs/product/shell/navigation.md) is `locked`. There is no contained browser. [External links leave the app](../architecture/2026-09-20-external-link-handoff.md) is the handoff. [Webview navigation stays deferred](../architecture/2026-09-19-webview-navigation-deferred.md) only records why the first window has none.

Shipped on the 1.0 node:

- Restart keeps the live session. Window exit, `SIGINT`, and `SIGTERM` dispose it. `bootHost` returns that live session.
- UI-kit setup runs only for the kit project. The 85% gate excludes `packages/app/ui`.
- `packages/shell/tests/entry.spec.ts` spawns `dev.ts` and the panel-window binary, checks the HTTP response, and checks that exit leaves no window process. `packages/shell/tests/expected/panel-document.txt` is the panel-document oracle.
- `ctx.log` appends one JSON line under `apps/<appId>/logs/`. Snapshots skip `logs`, `dist`, `.cache`, and `.autogen`. `coverage` stays. [Identity](../../../docs/product/app-contract/identity.md) owns the log behavior.
- The storage page asks, then calls `POST /api/apps/:appId/storage/restore`.
- `@mohou/shell` version `1.0.0` is the product version. The other publishable workspace packages carry the same string. [Changelog](../../../docs/changelog.md) owns the notes. `pnpm build:artifact` writes `artifacts/Mohou-<version>-<platform>/`. `pnpm publish:check` packs and does not upload. `pnpm publish:packages` uploads only when `MINI_APP_PUBLISH=1`.
- Embedded navigation: a same-origin link stays; `javascript:` runs; an external `http` or `https` link, and `mailto:`, open outside the app.

After 1.0 (not this node):

- The coverage gate includes the UI kit.
- Start the Tauri window on a Windows machine and use the panel there. A failure is a hotfix.
- A Windows Job Object only if that pass shows `taskkill /T /F` leaves the process tree running.

Do not add a live-provider test. `echo` plus the mocked Pi provider is enough. Windows code paths stay beside the macOS path in the same change. A Windows machine pass is not a 1.0 gate. [The earlier schedule](../../proposed/testing/2026-09-18-windows-test-after-tauri.md) waited only until the Tauri app existed.

Feature-page `status` stays the decision level. `progress` is `open` or `settled`. There is no `wip`. A missing `progress` has not been judged. [AGENTS.md](../../../AGENTS.md) owns that rule. 1.0 feature pages are `settled` except deferred capabilities.

The UI toolchain stays in `@mohou/host` for 1.0. [Package architecture](../../../docs/architecture/packages.md) owns that cut.

## Alternatives considered

- Record milestone membership on each feature page. Lost because a release move would edit every page. [The blueprint](../../../docs/blueprint.md) is the one list.
- Record the task list on a product page. Lost because the list is a plan. The blueprint owns the node; this note owns the order.
- Treat embedded navigation as out of 1.0 because the page said `deferred`. Lost because that mark was a skip during that pass, not a release cut.
- Keep the Windows machine pass as a gate now that Tauri exists. Lost because the user set that pass after 1.0, with a hotfix if it fails.
- Add `wip`, or make `settled` a `status` value beside `shape-locked`. Lost because one field cannot record both "the numbers stay host policy" and "the sentences are implemented".
- Keep `ctx.log` in the app directory, or store it in a SQLite `logs` table. Lost because the app directory is the history repo, and a table would share the app database lock, backup, and quarantine.
- Extract a compile package, or move the UI toolchain into a child process, for 1.0. Lost because Host is still the only consumer.
- Include the UI kit in the 85% coverage gate for 1.0. Lost because the user set that coverage after 1.0.

## Consequences

- Agents read [the blueprint](../../../docs/blueprint.md) for which node a capability belongs to, and this note for what 1.0 already shipped versus after.
- Backlog items are not re-proposed unless the user names them.
- npm upload still waits for `MINI_APP_PUBLISH=1`.
- A later edit can still read the first-window note as "navigation is deferred". The handoff note is the current decision.
