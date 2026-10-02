---
status: shape-locked
progress: settled
updated: 2026-10-02
---

# ctx.mcp

Layer: [MCP client](README.md). Index: [features.md](../features.md).

- Owner: MCP client, held by Host. The runtime provider is not this client.
- Input: `ctx.mcp(serverId, toolName, args?)`. `args` is the tool's own object. `{ input: string }` is a failed call, not a wrapper the client unwraps.
- Output: the tool result. Text-only content is a string. A structured payload is that value. The call does not wrap the result again.
- Connection: the first call to a server opens it. Stdio servers are spawned from `command`, `args`, and `env`. URL servers use streamable HTTP, or SSE when `transport` says so. One live session per server id. A failed start drops the session so the next call retries. The set can be replaced while running: a removed id, or one whose spec changed, closes its session, and an id whose spec is unchanged keeps it.
- Failure: an unknown server emits `mcp-not-connected`. A start failure emits `mcp-start-failed` with the start error as `cause`. A server tool error emits `mcp-tool-failed`. The app has already booted; only this call fails. Secrets in `env` are not copied into the error, the panel, or `ctx.log`. What counts as a credential is one table in the client: a name segment says so (`KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `CREDENTIAL`, `AUTH`, `SIGNATURE`, `COOKIE`, `SESSION`) or the value's shape does (`Bearer …`, `sk-…`, `ghp_…`, a JWT, 32 hex characters or more). Codes: [implementation.md](../implementation.md).
- Non-goals: listing external tools into the app; re-exporting external tools on the authoring server; blocking app load on a missing server; a second MCP client inside the runtime provider.

## Implementation


Role: seam, held by Host. Not the runtime provider. First call opens the server. One session per id. Start failure emits `mcp-start-failed` and drops the session so the next call retries. Unknown id emits `mcp-not-connected`. A tool error emits `mcp-tool-failed`. Secrets in `env` are not copied into the error. Reconnect budget exhaustion fails that call and stops retrying inside it. The server stays registered. Dispose awaits child exit. Plan: [implementation.md](../implementation.md).
