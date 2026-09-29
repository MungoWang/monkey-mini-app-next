# Agent Note: Clip chrome overflow during pane and tab motion

Status: implemented

## Problem

Opening settings, history, or storage translated the overlay 12px down. That paint overflowed the window and showed a scrollbar until the rise finished. Closing a tab left the pill glide wider than the rail for the same duration, so the rail drew a horizontal scrollbar.

## Decision

The document and `#mma-host` clip overflow. The overlay parent clips the rise. The tab rail and desk still scroll on overflow, and hide the scrollbar.

## Alternatives considered

- Drop the rise: the overlay would pop in. Changelog already named the short rise.
- `overflow-x: hidden` on the rail: many tabs could not scroll.

## Consequences

A tooltip that paints outside the host is clipped. In-pane scroll (settings, history, storage, library) is unchanged.
