# Agent Note: Restart drops open panel sockets

Status: implemented

## Problem

A packed Mohou.app accepted `POST /api/restart` and then stayed up without listening. The sidecar never exited 75. Host dispose waits for `server.close()`, and that callback waits until every socket ends. The panel event stream, plus any open browser tab, keeps a socket open, so dispose never finishes.

## Decision

After `server.close()`, Host calls `closeAllConnections()`. The listener can finish while the panel is still open, and the sidecar can exit 75.

## Alternatives considered

- `process.exit(75)` before dispose finishes. Lost: native handles and child processes would be abandoned, which is the reason restart leaves the process.
- Ask the panel to disconnect before restart. Lost: the Tauri window and any second browser tab would still have to cooperate, and a missed socket would hang the same way.

## Consequences

Restart with the panel open returns the port. Clients see the stream drop and reconnect after the sidecar is back.
