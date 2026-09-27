---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Events

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host.
- Two streams.
- Host stream `GET /api/events`: `app:open` (app id and optional title), `app:reload` (app id, after a successful reload), `app:eval` (a view query the shell must deliver), and a storage-size notice. Ping keeps the stream open. This stream is for Panel and Shell. An author UI does not subscribe to it.
- App stream `GET /api/app/:appId/events`: author events from `ctx.push` only, scoped by app id on the server before write.
- Failure: a dropped client reconnects with the last event id. A gap is explicit. A storage notice is advisory. Writes already succeeded.
- Non-goals: an author reading the host stream; a host diagnostic framed as an author event.

## Implementation


Role: provider. Two typed maps: host stream and author stream. Producers and consumers share the map. An author UI cannot subscribe to the host stream. Publish a storage notice after the write commits. `GET /api/events` and `GET /api/app/:appId/events` are mounted. A subscriber receives a retry hint on open and a ping while attached. `bindFrame` posts `app:reload`, `app:eval`, and author events to the caller. On bind it replays the retained tail and posts `app:gap` when that tail no longer starts at sequence 1. It does not post `app:open`, `storage-size`, ping, or the retry hint. Diagnostics do not enter the author buffer. Plan: [implementation.md](../implementation.md).
