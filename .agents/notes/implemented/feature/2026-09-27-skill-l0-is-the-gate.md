# Agent Note: Skill L0 is the gate

Status: implemented

## Problem

`SKILL.md` still carried a CRUD sample, a reload-code table, a file-layout dump, and a component index. Those pages already lived under `references/`. A cold agent either skipped the confirm at the top or read the catalog twice. A proposed rename of `references/` into `core/` and `ui/` was still open, with no second reader that needed the new names.

## Decision

L0 is the confirm, the write loop, the MCP tool table, the facade index, and the open-when table. Hand guides live in `references/guide/`. The short `kv()` sample is `guide/skeleton.md`. Reload codes, layout, and allowlists stay in `guide/loader.md`. Generated catalog, contracts, examples, and theme stay in `references/` beside `guide/`, as do the hand-written look pages. One need opens one file. The tree is not renamed into `core/` and `ui/`.

Byte-tool names stay out of the skill tree. `bin/diagnose.mjs` stays the helper when authoring tools fail. `check:skill` keeps both checks. Packaging and sidecar update policy stay out of this cut.

## Alternatives considered

- Rename `references/` into `core/` and `ui/`. Lost: every generated contract link and every open-when row would change, and the load rule was already one file per need.
- Leave the component index on L0 as a shortcut. Lost: it duplicated the catalog and pushed the confirm and the workbench rules down the page.
- Delete the CRUD sample. Lost: a first list still needs one worked `kv()` file. It moved. It was not dropped.

## Consequences

A cold agent can register, write, reload, and call from L0. Props, SQL shape, and reload codes are one open away. [Skill contract](../../../docs/product/author-skill/skill-contract.md) states this load.
