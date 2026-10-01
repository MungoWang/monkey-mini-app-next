# Agent Note: migrating a runtime root off the retired scopes

Status: implemented

## Problem

The rename to `@mohou` left three things on a machine that ran an earlier build. App source under the runtime root still imports the retired scope, so the app fails to compile — the backend reports `install @mini-app/contract with mini_app_install`. The local pack directory holds `mini-app-*.tgz`. An app's `.autogen` bundle can still import the retired scope, and the host serves that bundle while its stamp matches the sources; the stamp is one mtime plus a file count, so a tree restored with preserved mtimes keeps it equal.

## Decision

`pnpm migrate:legacy` runs [scripts/migrate/legacy-names.mjs](../../../../scripts/migrate/legacy-names.mjs). It is a dry run until `--write`. It rewrites app source only: `storage/`, `logs/`, `.autogen/`, `dist/`, `.cache/`, and `node_modules/` never change. Every file it touches is copied into `~/.mini-app/migration-backup-<stamp>/` first. It clears `.autogen` for an app whose source it rewrote, and for any app whose bundle names a retired scope. It moves `mini-app-*.tgz` into the backup instead of renaming them. A name the table cannot express, such as `@monkey-mini-app/sdk`, is reported and left alone.

## Alternatives considered

- Rename the stale tarballs. Lost because the archive still declares `@mini-app/shell`, so the launcher would look for `node_modules/@mohou/shell` and find nothing. The pack directory is rebuilt instead.
- Rewrite every text file under the app. Lost because `storage/` is the app's data, not source.
- Trust the source stamp and leave `.autogen` alone. Lost for a tree whose mtimes were preserved by a copy or an extract: the stamp stays equal and the stale bundle is served.
- Document the edits as a one-off command. Lost because the same five files exist on every machine that ran an earlier build, and the cache hazard is not visible in the source.

## Consequences

- A migrated machine must repopulate the pack directory: `pnpm dist:app:local`.
- A panel view that is already open keeps the bundle it loaded. `POST /api/apps/<appId>/reload` reloads the frame; the module map of the old document is not reused by a fresh document.
- The migration reads and writes only what the runtime root holds. An agent skill directory installed under the old skill id is untouched.
