# Agent Note: The author skill keeps the previous product's capabilities

Status: implemented

## Problem

The skill in this repo was a short write loop that told the agent not to import the UI kit. The previous product's skill also carried facades, component contracts, loader notes, and troubleshoot notes. The kit now exists, so that cut is no longer true.

## Decision

The author skill is the whole previous-product system, rewritten for this product. Sentences are shorter. A capability is not dropped unless this kit or this `ctx` removed it.

`pnpm gen:skill` writes catalog, contracts, examples, and theme tokens from `@mohou/ui`; the look pages are hand-written. Handwritten pages document the write loop, `ctx`, tools, loader, history, eval, and troubleshoot. Templates are the eight facades, with `@mohou/contract`, `@mohou/ui`, and `ctx.storage.kv()`.

This product does not have `mini_app_history_revert` or `ctx.storage.table()`. Theme files use the same token names as `themeTokens`, not short `--bg` keys. The skill does not curl the host.

## Alternatives considered

- Keep the short loop and add kit imports only. Rejected: the facades and the per-component notes are how an agent picks a screen. The loop does not replace them.
- Generate a new catalog and ignore the previous skill. Rejected: the previous skill is the functionality bar. Generation can replace a hand-copied list. It cannot silently omit a component the kit still ships.
- Add a `ui-examples` workspace package. Rejected: packages.md does not list it. The examples live in `packages/app/ui/examples` and publish into the skill.

## Consequences

- After a kit component change, run `pnpm gen:skill`. `pnpm check:skill` fails if a tool, `ctx` member, or catalog link drifts.
- Installing the skill copies this tree. Reinstall only when this port should replace a previous install.
