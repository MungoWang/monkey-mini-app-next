---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Version history

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host.
- Input: mutating authoring tools, a successful reload of a dirty tree, or `mini_app_history_commit`, `mini_app_history_list`, `mini_app_history_reset`.
- Output: one branch per app. A commit is a full source snapshot. List returns nodes with parent ids, including backup tips after reset. Restore is defined on the [author surface](../author-surface.md#history-restore). Nothing is erased.
- Mutating tools commit by default. `commit: false` batches until reload or an explicit commit. A successful reload of a dirty tree commits with the reload tool description. `mini_app_history_commit` requires `message`.
- Snapshots exclude `storage/`, history metadata, `node_modules/`, `theme.json`, `logs/`, `dist/`, `.cache/`, and `.autogen/`. `coverage/` stays in the snapshot. The pin is not source. `schema/` is source and is committed. Resetting history does not roll the database back. The lockfile is source and is committed.
- Failure: an unknown commit id fails the call. A commit during a failed compile is not attempted. A commit error is `commit:` on reload and `committed.status: "failed"` on the tool.
- Non-goals: merge, rebase, cherry-pick, or a second branch; the panel moving the branch; deleting history objects from the panel.

## Implementation


Role: provider. One branch, `main`. `commitApp`, `listHistory`, `resetApp`, and `readAppCommit` are the implementation. Reset is `checkout --force` plus `refs/mini-app/backup/<previous>`. Content is compared by bytes, not mtime. Snapshots exclude `storage/`, `.git`, `node_modules`, `theme.json`, `logs`, `dist`, `.cache`, and `.autogen`. `coverage` is not skipped. Owner history HTTP is `GET /api/apps/:appId/history` and `GET /api/apps/:appId/history/:commitId`. A tree change publishes `app:reload`. A bound frame posts that to the runner, which refetches. Plan: [implementation.md](../implementation.md).
