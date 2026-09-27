# Agent Note: No date-fns locale prune in dist:app

Status: implemented

## Problem

Ship prune deleted most `date-fns/locale` files and rewrote the package barrels by hand so vendor esbuild would still resolve `{ enUS, zhCN }`. That rewrite was brittle, easy to get wrong, and not worth ~13MB.

## Decision

`pruneShipModules` does not touch `date-fns`. It only removes `*.map` files and `umd` directories. Upstream locale barrels stay as published.

## Alternatives considered

- Keep en-US + zh-CN and rewrite `locale.js` / `.cjs` / `.d.ts`. Shipped briefly, then rejected: hand-maintained barrels diverge from the package and break startup when incomplete. See [rejected note](../../rejected/bug-fix/2026-09-24-date-fns-locale-prune.md).
- Subset locales without rewriting barrels. Esbuild still walks every `export *` in the barrel and fails.

## Consequences

App prefix keeps the full date-fns locale tree. Size trade accepted. A later slim path needs a different packaging cut (for example prebundled UI), not a post-install delete.
