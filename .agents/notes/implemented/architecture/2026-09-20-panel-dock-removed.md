# Agent Note: The panel has no dock mode

Status: implemented

## Problem

`fill` and `side` were described as docking the panel. The control only restyled gallery cards and posted `data-dock` into open iframes. The window stayed full width.

## Decision

The panel has no dock mode. Overlay Shell still shows close-panel and calls the embedder. Standalone Shell hides that control. Theme messages do not carry a dock value. Cards do not change layout for a side position. A narrower library is [Responsive layout](../../../docs/product/panel/responsive.md), and it is not in the product now.

## Alternatives considered

- Leave `fill` and `side` until the responsive layout is decided. Lost because the control does not dock the panel, and keeping it invites a second mechanism.
- Teach cards a `dock: 'side'` flag. Lost because the flag does not change the pane size.

## Consequences

- `syncDock`, `postDock`, and `data-dock` are gone. A missed iframe post is no longer retried.
- [Close panel](../../../docs/product/panel/dock.md) owns the remaining control. The responsive page owns the later layout.
