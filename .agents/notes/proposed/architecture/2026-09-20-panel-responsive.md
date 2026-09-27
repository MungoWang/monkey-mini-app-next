# Agent Note: A narrow panel is a container width

Status: proposed

## Problem

`side` was described as docking the whole panel. The control only restyles gallery cards. The window stays full width, so the control does not dock anything.

## Proposal

A later change makes the library and its cards respond to the width of the panel's outer container. The embedder, or the window, changes that width. The panel does not grow a second dock mode for it. [Responsive layout](../../../docs/product/panel/responsive.md) owns the behavior. It is not in the product now. [The blueprint](../../../docs/blueprint.md) assigns the node.

The `fill` and `side` control is removed. It did not change the pane size.

## Alternatives considered

- Keep teaching cards a `dock: 'side'` flag. Lost because the flag does not change the pane size.
- Leave `fill` and `side` until the responsive layout is decided. Lost because the control does not dock the panel, and keeping it invites a second, wrong mechanism.

## Acceptance criteria

- The deferred page names the capability and does not name a release.
- The blueprint lists it under After 1.0.
- No card code reads a new responsive breakpoint in this change.

## Risks

- The responsive breakpoint is still not decided, so a narrow container does not yet collapse a card.
