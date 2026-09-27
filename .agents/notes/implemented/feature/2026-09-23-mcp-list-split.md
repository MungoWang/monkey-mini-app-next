# Agent Note: Author MCP list splits names from schemas

Status: implemented

## Problem

`mini_app_mcp_list` returned every connected server with full tool `description` and `inputSchema`. One verbose server blew the authoring context. Authors usually need names first, then detail for one server or one tool.

## Decision

Two authoring tools replace the single fat list:

- `mini_app_mcp_list` returns `{ servers: [{ id, tools: string[] }] }`. Names only. A failed server still returns `{ id, error }` with `mcp-not-connected` or `mcp-start-failed`. No `env`, descriptions, or schemas.
- `mini_app_mcp_tools({ serverId, toolName? })` returns `{ id, tools: [{ name, description?, inputSchema }] }` for that server. Omitting `toolName` returns every tool on the server. A named tool returns that one. Unknown `toolName` is `tool-args`. Server start failures return `{ id, error }` without throwing.

Neither tool is on `ctx`. [Author surface](../../../docs/product/author-surface.md) owns the catalog rows. The skill points authors at list, then tools, then `ctx.mcp`.

## Alternatives considered

- Keep one tool and add a `detail: boolean` flag. Lost because a default-full response still burns tokens when the agent forgets the flag, and two names make the cheap path obvious.
- List only server ids with no tool names. Lost because choosing a server without knowing its tool names forces an extra round trip on every browse.
- Throw on server start failure from `mini_app_mcp_tools`. Lost because list already returns per-server errors; matching that shape keeps one failure pattern.

## Consequences

- Authoring MCP `tools/list` gains `mini_app_mcp_tools` and the shorter list description.
- Call sites that parsed `tools: [{ name, description, inputSchema }]` from `mini_app_mcp_list` must switch to names, then call `mini_app_mcp_tools`.
- Skill version bumps with the catalog change.
