# Agent Note: App logs are files under the runtime root

Status: implemented

## Problem

`ctx.log` kept two hundred lines in memory. Nothing outside the process could read them, and a restart dropped them.

## Decision

Each app appends one JSON object per line to `apps/<appId>/logs/app.log`. The cap is about 5 MB, in 1 MB segments. A line is written whole. The active file is sealed before a line would cross the segment, and a line longer than the segment stays whole in its own file. Past the cap, the oldest sealed file is unlinked and the newest file stays. `write` uses stat, rename, and unlink. It does not read log bytes. `logs` is in the snapshot skip table, so history does not commit it. There is no log table and no panel viewer.

## Alternatives considered

- A `logs` table in the app database. Lost because it would share that file's lock, backup, and quarantine.
- A file inside the app directory. Lost because that directory is the history repo.
- A five-minute window. Lost because the cap is 5 MB.
- Rewrite the file to drop the oldest bytes. Lost because that reads the segment into memory on the write path.
- Put the directory at `runtime/logs/<appId>/`. Lost because the log belongs under `apps/<appId>/logs`.
- A byte ring. Lost because the oldest edge cuts a line, and a raw read mixes that cut with newer bytes.

## Consequences

`host.log.read(appId)` reads the retained segments. That read is not on the write path. A missing directory is an empty list. An app id with a slash, a backslash, or `..` is refused.
