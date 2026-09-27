---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# File tools

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host, exposed through the [author surface](../author-surface.md). That page is the catalog. This page does not define a second one.
- Non-goals: a tool that deletes the app; a tool that writes outside the app directory; curling the host as a substitute for these tools.

## Implementation

Role: provider. One implementation. Authoring tools inject the history committer. Paths that escape emit `path-escape` for both POSIX and Windows absolute forms, on either host. Listing skips `.git`, `storage`, `node_modules`, `theme.json`, `logs`, `dist`, and `.cache`. `coverage` is listed. Extra protected paths are injected. This module does not know which owner marked them, and it does not open the database. Without a committer, a mutating tool still writes the file and reports `commit.status: failed`. Plan: [implementation.md](../implementation.md).
