---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Reload and delete

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel for the controls. Host for the effects.
- Operations: [reloadView](../owner-surface.md#reloadview) and [deleteApp](../owner-surface.md#deleteapp). Delete asks for confirmation before the operation.
- Failure: a failed delete shows the host error and leaves the app in the list. No message uses the panel label. A reload of a missing app shows the host error in the frame.
- Non-goals: an authoring tool that deletes the app; reload on every tab click.

## Implementation


Role: consumer. The app tab reload control calls the injected client. `switchTab` does not reload. `deletePrompt` asks before delete. A failed delete does not remove the tab. A failed reload shows the error in the frame. This package does not name a host route. Plan: [implementation.md](../implementation.md).
