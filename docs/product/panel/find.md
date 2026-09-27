---
status: deferred
updated: 2026-09-22
---

# Page find

Layer: [Panel](README.md). Index: [features.md](../features.md).

This capability is not in the product now. Target: **post-1.0**.

A find bar on the panel chrome searches the visible panel document and the currently visible same-origin app iframe, like browser find-in-page. It does not search hidden app tabs. CodeEditor keeps its own find when that editor owns the shortcut. Match highlighting must not rewrite React-managed DOM. The page does not gain Tauri IPC for this. Thresholds, match caps, and the exact highlight engine are not decided.

Proposal: [.agents/notes/proposed/feature/2026-09-22-panel-page-find.md](../../../.agents/notes/proposed/feature/2026-09-22-panel-page-find.md).
