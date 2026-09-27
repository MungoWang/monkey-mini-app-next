---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Authoring projection

Layer: [MCP server](README.md). Index: [features.md](../features.md).

- Owner: MCP server. The tool behavior is Host's. MCP and `POST /api/tools/invoke` are projections of that one implementation.
- Input: an MCP client on loopback, with the authoring token, calling a `mini_app_*` tool. Names stay `mini_app_*`. A transport that cannot carry a name uses a 1:1 alias and documents the map. The alias is not a second behavior.
- Output: the same result the [author surface](../author-surface.md) returns. A tool failure is an MCP error with the same code. There is not a second app manager behind the projection.
- The MCP catalog is the authoring tools except `mini_app_write`, `mini_app_edit`, and `mini_app_delete`. Those three stay on `GET /api/tools` and `POST /api/tools/invoke`. It is not the `ctx` bag, not external MCP servers, and not the runtime provider's tools.
- Failure: a missing or wrong token is refused. A non-loopback caller is refused. An unknown tool name is an error that names the catalog.
- Non-goals: a custom connection protocol; extensions that redefine a tool schema; authoring that depends on a particular agent product's plugin format.

Manual MCP configuration plus the author skill is a complete authoring path. Shell may write the authoring server into assistant MCP files, and may show the JSON snippet. That is a convenience. It is not a second tool implementation.

## Implementation


Role: consumer of `createAuthorTools`. `POST /api/tools/invoke` calls that implementation directly. `POST /mcp` with `Accept` that includes `application/json` is stateless: each tool call uses that same implementation and does not store a session. `POST /mcp` whose `Accept` is only `text/event-stream` opens a session and returns `mcp-session-id`. Later `GET`, `POST`, and `DELETE` with that header reuse it. `GET` and `DELETE` without a live session are 404. A bad token is `authoring-token`. A non-loopback caller is `authoring-loopback`. An unknown name is `unknown-tool` and names the mounted catalog. Plan: [implementation.md](../implementation.md).
