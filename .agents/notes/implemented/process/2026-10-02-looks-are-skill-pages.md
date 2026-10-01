# Agent Note: the look pages are hand-written

Status: implemented

## Problem

A Look is an author-facing visual recipe. `scripts/gen/skill/looks/` held the eight recipes as `catalog.json` plus six palette stylesheets, and `pnpm gen:skill` turned them into `skills/mohou-mini-app/references/looks/*.md`. The generator derived nothing from the kit, `check:skill` never validated the pages, and only the generator read the catalog. The `generated — do not edit` banner stood on output nothing could regenerate meaningfully.

## Decision

The nine look pages under `skills/mohou-mini-app/references/looks/` are hand-written, beside the other handwritten pages (`SKILL.md`, `guide/`, `bin/`). Each page carries its recipe, its class literals, and its palette stylesheet in one place. `scripts/gen/skill/looks/` and `looks.mjs` are gone, and the generator no longer touches that directory.

## Alternatives considered

- Keep the catalog and generate the pages. Lost because the generator only reformatted authored content, and no check read the result.
- Keep the catalog next to the skill and generate from there. Lost because the skill tree would carry both the source and its output, and `sync:skill` would ship the source in the published package.
- Move the recipes into `packages/app/ui`. Lost because [facades.md](../../../docs/product/author-skill/facades.md) assigns the recipes to the author skill, a Look is not a kit component, and the files are never compiled or shipped.

## Consequences

- A recipe edit is a page edit; there is no regeneration step and no drift to check.
- A palette rename in the kit no longer reaches the look pages by any mechanism. They are prose, and no gate covers them.
