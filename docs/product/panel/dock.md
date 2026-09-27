---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Close panel

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel.
- Input: close-panel; Shell kind.
- Output: an overlay embedder shows close-panel. Standalone Shell hides it. The panel has no dock mode. A narrower pane is [Responsive layout](responsive.md). This page does not change the pane size.
- Failure: none. Closing the panel is the embedder's callback.
- Non-goals: persisting a dock in `host.json`; a dock control; a close-panel control in the shipped standalone window.

## Implementation

Role: consumer. Standalone Shell hides close-panel. Overlay Shell shows it and calls the embedder's callback. The panel does not post a dock value into an iframe. Plan: [implementation.md](../implementation.md).
