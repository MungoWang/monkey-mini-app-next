# Agent Note: A package update does not block boot

Status: implemented

The peer line is narrowed by [update keeps UI imports](./2026-09-29-update-keeps-ui-peers.md). The park-on-open rule stands. `--omit=peer` stays; `react-is` is a direct dependency.

## Problem

Confirming an in-app update wrote `update.json` and the sidecar exited 75. The launcher then ran `npm install` and waited with no budget before starting the sidecar. That install resolved optional Pi peers from the registry. A TLS failure retried for more than a minute, so the window stayed on the splash. Quitting the app orphaned `npm` and left `update.json`, so the next open started another install. Three installs stacked on the same prefix.

## Decision

`update.json` installs only after sidecar exit 75 in the process that is still running. A file left by a previous process is parked as `update.failed.json` and does not block open. The install omits peer dependencies, retries a fetch once, and stops after 120 seconds, on failure, or when the window closes. The prefix `package.json` and lockfile are restored from a snapshot. The sidecar then starts from that prefix. The install process group dies with the launcher, so a quit does not leave `npm` running.

## Alternatives considered

- Keep retrying `update.json` on every open: a hung install would delay every launch by the budget.
- Install into a second prefix and swap: correct against a torn `node_modules`, and not worth the copy for a file-tarball install that fails before it writes when peers are omitted.
- Repair with `npm ci` after a failure: `npm ci` deletes `node_modules` first, so a failed repair is worse than the torn tree.

## Consequences

The budget and the park-on-open rule live in the window binary. An in-app shell update does not replace that binary. Peer omission is also in the staged args, so a later host still asks for it.
