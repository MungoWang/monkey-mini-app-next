# Agent Note: Panel motion stays short

Status: implemented

## Problem

Tab changes, the theme menu, settings, history, storage, and the delete prompt appeared and disappeared in one frame. The only motion was a card hover with no duration.

## Decision

The gallery and each open app frame cross-fade over 200ms. A hidden frame stays mounted. The theme menu, settings, history, storage, and the delete prompt fade in over 150ms. Toolbar and tab controls fade their hover color. Nothing bounces, and nothing waits on an exit animation before the next view is usable.

## Alternatives considered

- A shared motion library for exit animations. Rejected: the panel would have to delay unmount, and the kit already carries motion for apps.
- Animate every settings card. Rejected: those are selections inside a page, not a view change.

## Consequences

A tab switch no longer cuts. Overlay close is still immediate. A hidden app frame still runs.
