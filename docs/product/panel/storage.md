---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Storage browse

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel.
- Operations: [readStorage](../owner-surface.md#readstorage) and [readTable](../owner-surface.md#readtable).
- Output: the database file size and table names, then one table exported as JSON. A size notice for the active app is a dismissible banner. The threshold is not locked.
- Failure: no storage capability hides the control. A failed read shows the host error. No message uses the panel label. Writes are not offered here.
- Restore asks first, then calls [restoreStorage](../owner-surface.md). It replaces the live database with the last backup.
- Non-goals: editing storage in the panel; blocking the app because a table is large.

## Implementation


Role: consumer. `PanelStorage` calls an injected client and `useReducer`. A size notice focuses that app and opens storage. The banner uses a panel label and names the table. The selected table is pressed, and the export is labeled with that table name. A key/value row shows the key and a readable value; other rows stay JSON. The same export can be shown as that reading or as the JSON text. The choice does not reload the table. A close control on the pane hides it; the toolbar control still toggles it. The notice is a dismissible banner and does not block the app. This package does not name a host route. Plan: [implementation.md](../implementation.md).
