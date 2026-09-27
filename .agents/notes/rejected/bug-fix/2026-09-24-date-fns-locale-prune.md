# Agent Note: date-fns locale prune must keep _lib and rewrite barrels

Status: rejected — ship prune no longer touches date-fns; hand-written barrels were not worth the break risk. See [implemented note](../../implemented/simplification/2026-09-24-no-date-fns-locale-prune.md).

## Problem

`dist:app` deleted every `date-fns/locale` entry except `en-US` and `zh-CN`. Opening Mohou.app then exited at once: host vendor esbuild follows `date-fns/locale.js`, which `export *` every locale file, and `en-US/_lib` imports `locale/_lib/buildMatchFn.js`. Both the other locales and `_lib` were gone.

## Decision

(Superseded.) The prune briefly kept `_lib` plus `en-US` / `zh-CN` and overwrote locale barrels. That is withdrawn: leave date-fns locales intact.

## Alternatives considered

- Stop pruning date-fns locales. Chosen after the barrel rewrite proved too brittle.
- Keep `_lib` and leave the generated barrels. Esbuild still fails on missing locale files.
- Stub the missing locale files. Hundreds of empty modules.

## Consequences

Historical only. Current ship prune is maps + umd only.
