# Agent Note: 1.0 release hygiene

Status: implemented

## Problem

A readiness review found the 1.0 behavior node complete, but the release surface was dirty: two product pages contradicted shipped code, feature `progress` was mostly unjudged, the 1.0 plan still sat under `proposed/`, the changelog omitted post-cut work, branch coverage sat on the 85% floor, and on-disk artifacts used a pre-rename path.

## Decision

Ship the hygiene in the same change as the review:

- [App lifecycle](../../../docs/product/host/lifecycle.md) matches `mini_app_register`: manifest fields in, `needed` paths out, no `files`.
- [Product decisions](../../../docs/architecture/decisions.md) lists gallery card styles `glass`, `stamp`, `etch`, `hero`, `pulse`, and `list`.
- 1.0 feature pages carry `progress: settled`. Deferred pages stay deferred without a false settled mark.
- The 1.0 plan moves to [implemented](./2026-09-20-one-oh-plan.md). [Blueprint](../../../docs/blueprint.md) points there.
- The superseded workbench-slot proposal is [rejected](../../rejected/architecture/2026-09-20-workbench-slot.md).
- [Changelog](../../../docs/changelog.md) records the 1.0.0 surface that main actually ships.
- Boundary tests raise branch coverage off the gate floor (about 85.8% → about 87.2%) across frame-bus, tabs, desk, theme pin, owner mount, wrapper streams, mcp-list, and http-client parsers. The gate stays 85%.
- `pnpm build:artifact` and `pnpm publish:check` refresh `artifacts/Mohou-1.0.0-*` and the ten npm packs, including `@mohou/app-view`. The old `mini-app-1.0.0-*` directory is removed.

## Alternatives considered

- Tag 1.0.0 without fixing the doc drift. Lost because register input and card styles are caller contracts, and a wrong page teaches the wrong call.
- Leave feature `progress` blank. Lost because a missing mark means unjudged, not settled, and that misleads the next readiness pass.
- Archive the workbench-slot proposal. Lost because archive is for implemented notes; a superseded proposal is rejected.
- Raise the coverage gate itself to 88%. Lost because the floor stays 85%; headroom is enough without moving the gate. Chasing every remaining branch in menu, view-bridge, and session costs more than it protects.

## Consequences

- `pnpm run check` stays the done bar. Artifact and pack refresh are part of claiming the 1.0 cut clean.
- npm upload still waits for `MINI_APP_PUBLISH=1`.
- After-1.0 items (UI kit gate, Windows machine pass, responsive, page find, recommendation) stay off this node.
