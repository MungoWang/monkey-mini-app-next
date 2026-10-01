# Agent Note: Source pack for another machine

Status: implemented

## Problem

Moving the monorepo to another computer needed a repeatable archive. Copying the checkout by hand dragged `node_modules`, Cargo `target/`, and other gitignored build trees. `dist:local` / `dist:app` ship a product install, not the editable source tree.

## Decision

`pnpm pack:source` runs `scripts/pack/source.mjs`. The file list is `git ls-files -co --exclude-standard` (tracked plus untracked source, minus gitignore). The archive is `artifacts/source-pack/mohou-mini-app-<shell-version>-source-<YYYYMMDD>.tgz` and includes a generated `SOURCE-PACK.md` with unpack and run steps. [Development](../../../docs/development.md) owns the command.

## Alternatives considered

- `git archive HEAD` only. Clean, but drops uncommitted source the user still wants to move. Rejected.
- Full-tree `tar` with a hand-maintained exclude list. Duplicates `.gitignore` and drifts. Rejected.
- Bundle `node_modules` or a built window binary. Not this command; use `dist:local` / `dist:app` for runnable product trees.

## Consequences

The other machine still runs `pnpm install` and builds the panel/window. Secrets in `.env` stay out when gitignored. Output under `artifacts/` is not committed.
