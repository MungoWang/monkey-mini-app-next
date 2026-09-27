---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Theme

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel.
- Operations: [setAppPin](../owner-surface.md#setapppin), [listPalettes](../owner-surface.md#listpalettes), and [writePolicy](../owner-surface.md#writepolicy) for global appearance. The app-local row appears only in app scope and only when `theme.css` parsed.
- Failure: a failed save shows the host error and leaves the previous pin. No message uses the panel label. An ignored theme file does not appear as a selectable chip; its reason is available from the palette response.
- Non-goals: editing theme CSS in the picker; a disabled "custom palettes are unavailable" row.

## Implementation


Role: consumer. `PanelTheme` calls an injected client and `useReducer`. The picker refetches on open and reads the stored pin. The active row is pressed. `appFile` reports whether that app's `theme.css` parsed. The row stays hidden when it did not. A failed save leaves the previous pin. Ignored files are not chips. No theme client hides the picker. This package does not name a host route. Plan: [implementation.md](../implementation.md).
