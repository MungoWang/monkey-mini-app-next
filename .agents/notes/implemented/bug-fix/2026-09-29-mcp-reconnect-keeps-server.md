# Agent Note: MCP reconnect keeps the server

Status: implemented

## Problem

A live MCP session that dropped a few times was unregistered. `ctx.mcp('calendar', …)` then threw `mcp-not-connected` even though `mcp.json` still listed the server. Only a Host restart put the id back.

## Decision

Reconnect budget applies inside one call. Exhaustion emits `mcp-start-failed` and stops retrying that call. The spec stays registered. The next call starts a fresh budget. `mcp-not-connected` is only an unknown id.

## Alternatives considered

- Keep unregistering after the budget: a flaky HTTP server such as calendar could never recover without restarting Host.
- Retry forever: a crashing stdio child would loop.

## Consequences

Calendar can fail, then succeed on a later call in the same Host session. A missing id is still `mcp-not-connected`.
