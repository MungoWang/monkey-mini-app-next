# Agent Note: Generated app files live in .autogen

Status: implemented

## Problem

A cold open bundled `ui.tsx` with esbuild on every request. A successful reload kept that bundle string on the live app for the life of the process. Opening more apps kept more strings.

## Decision

The UI bundle and the Tailwind sheet are files under `apps/<appId>/.autogen/`. A source stamp is the newest source mtime and the file count. Skipped names, including `.autogen`, do not count. A matching stamp is read from disk and not retained. A mismatch rebuilds and writes. `cleanCaches` deletes the directory before the new bundle is written. Snapshots and listings skip `.autogen`.

## Alternatives considered

- Keep the bundle on the live app. Lost because each open app retained its JavaScript for the process lifetime.
- A runtime-root `.ui-cache` keyed by a sanitized id, as the previous product did for `entry.js`. Lost because `.autogen` already named the generated tree inside the app, and the stylesheet belonged there.
- A content hash of every source byte. Lost because the previous invalidation was mtime plus file count, and the user asked for that same rule.

## Consequences

- The live app keeps the backend module. It does not keep the UI bundle text.
- A host upgrade that does not touch app sources does not by itself invalidate `.autogen`. `cleanCaches` does.
- A cache write failure still returns the bytes just built.
