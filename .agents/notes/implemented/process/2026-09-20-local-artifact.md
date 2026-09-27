# Agent Note: Local artifact

Status: implemented

## Problem

The product version was `0.0.0` in the packages the about block reads and `0.1.0` in the window crate. `pnpm build:window` produced a debug binary. There was no directory a person could run as this version.

## Decision

`@mini-app/shell` owns the product version. `@mini-app/host` and the window crate use that same string. `pnpm build:artifact` builds the panel, builds the release window, and writes `artifacts/mini-app-<version>-<platform>/` with the binary, the panel files, and a `run` script. The script sets `MINI_APP_PANEL` and `MINI_APP_WINDOW`, then starts `dev.ts` from this checkout. [Changelog](../../../docs/changelog.md) owns the notes. [Development](../../../docs/development.md) owns the command.

## Alternatives considered

- A signed disk image or Windows installer. Lost because the host is a Node process with native addons, and that installer is not specified.
- Bundle the host into one file beside the window. Lost because `better-sqlite3`, esbuild, and Tailwind's native package stay in the workspace install.
- A second version constant inside the window. Lost because the about block reads package files and does not invent a number. The crate copies the shell version.

## Consequences

- The artifact runs on the machine that built it. Copying the directory to a machine without this checkout does not start the host.
- `artifacts/` is not committed.
- Embedded navigation is not part of 1.0.0.
