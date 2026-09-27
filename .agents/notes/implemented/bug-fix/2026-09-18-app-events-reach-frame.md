# Agent Note: Author events reach the open frame

Status: implemented

## Problem

`scan` returned immediately and the radar stayed on "启动中". Two things stacked. The call's signal aborts when the method returns, so the detached scan saw `cancelled` and stopped. `ctx.push` was published, but the panel never subscribed to that app's event stream, so the iframe's `on` never ran.

## Decision

The panel opens `GET /api/app/:appId/events` for each open iframe and posts `{ appId, name, data, seq }` to that frame. The radar scan and topic research now await their work, so the signal and the brain stay alive until it finishes. A source change and the toolbar refresh still refetch the document.

## Alternatives considered

- Leave the scan detached and stop aborting `ctx.signal` after return. Rejected: the contract is that the signal ends with the call, and the brain is stopped in the same `finally`.
- Poll `scanStatus` from the view. Rejected: the view already listens for `progress`. The events were not being delivered.

## Consequences

A long scan keeps its `POST /api/call` open. Progress arrives as author events. Closing the tab closes that event stream.
