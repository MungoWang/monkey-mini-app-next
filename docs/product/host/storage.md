---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Storage engine

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host.
- Input: `ctx.storage` writes, and panel reads of `GET /api/apps/:appId/storage`.
- Output: one SQLite file, `storage/app.sqlite`, opened with `better-sqlite3` in WAL mode. A missing directory and a missing file are created owner-only on POSIX. Windows keeps the user-profile ACL; the POSIX mode bits are not a second lock. Host creates `STRICT` tables `kv` and `schema_migrations`, prepares the `kv` statements once, and stamps the layout last. App tables come from `schema/NNN_name.sql`. Opening storage applies pending files in order, after one snapshot at `storage/backup.sqlite`. `query` and `run` are row statements only. Past the host size policy, Host may emit one notice. The threshold is not locked, and a notice does not block an ordinary write.
- Failure: a file that is not a database is renamed aside, with its WAL sidecars, and the call throws `storage-corrupt`. The next open does not create a replacement. A schema stamp from another layout throws `storage-version` and leaves the file in place. Schema files run in id order. One file is one transaction. If it fails, that file is rolled back and is not recorded, and every later file in the batch is not started. A later open runs the failed file again after it is fixed, then continues in order. The error names the files already applied and the files that were not started. Before a new schema file runs, Host estimates the database size from `page_count * page_size`. Over the host backup cap, it does not copy and does not run the file; the call throws `storage-backup-too-large`. The cap is host policy and is not locked. Undoing a migration that succeeded is an owner action, not an app method.
- Non-goals: a second database file; an engine argument; SQL against `kv`; blocking an ordinary write; keeping one backup per migration.

- Reload and the next call open storage through `openStorage`. `storage-migration` or `storage-backup-too-large` fails that reload or call. An already-open view keeps the previous good backend.
- Owner `readStorage` and `readTable` are mounted at `GET /api/apps/:appId/storage` and `GET /api/apps/:appId/storage/:table`. A missing file is an empty read, not a new database. `kv` values are parsed.
- `restoreStorageBackup` is the owner restore. The session exposes it as `owner.restoreStorage`. The panel button calls `POST /api/apps/:appId/storage/restore`.

## Implementation


Role: provider. One `better-sqlite3` connection per app. `kv` writes are one prepared statement. SQL that must stay atomic uses `transaction`. Corrupt files are quarantined on open, not on a directory listing. A foreign schema stamp is rejected, not migrated. Pending schema files are checked as a set, then snapshotted once and applied. A failed file rolls back and stays pending. Owner restore puts the snapshot back and blocks those checksums. The panel storage view asks, then calls `POST /api/apps/:appId/storage/restore`. The size threshold and the backup cap are host policy and are not locked. Plan: [implementation.md](../implementation.md).
