# Agent Note: Handwritten skill pages follow this product's layout

Status: implemented

## Problem

The ported skill still described the previous layout. It omitted `schema/`, treated reload errors as message prefixes, named a cache directory this host does not lock, and told agents to curl `/ui.css`.

## Decision

`references/loader.md` is the layout and import page: `schema/NNN_name.sql`, `theme.css` vs `theme.json`, `event-undeclared`, and the compile codes. `styling.md` and `troubleshoot.md` match those codes and drop plugin-version archaeology. Skill version is `1.0.1`.

## Alternatives considered

- Leave the handwritten pages until a later sweep. Rejected: an agent following `loader.md` would omit SQL schema and invent prefix matching.

## Consequences

Reinstall the writing skill to pick up the pages. Catalog generation is unchanged.
`ctx.md` now documents `kv()`, `query`/`run`/`transaction`, `schema/NNN_name.sql`, and storage codes. Skill version `1.0.2`.
