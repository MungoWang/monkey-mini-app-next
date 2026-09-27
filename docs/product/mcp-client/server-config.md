---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Server config

Layer: [MCP client](README.md). Index: [features.md](../features.md).

- Owner: MCP client. Shell points Host at the runtime root. Host reads the file.
- Input: `mcp.json` in the runtime root, or the path in `MINI_APP_MCP_CONFIG` when that variable is set. Shape: a map of server id to `{ command, args?, env? }` or `{ url, transport? }`. An `mcpServers` wrapper is accepted. An entry named `settings` is skipped. An entry with neither `command` nor `url` is invalid.
- Output: zero or more server specs. A missing file means zero servers.
- Failure: a present file that is not valid JSON, or that is not the map shape, fails Host boot. It is not treated as zero servers.
- The panel editor is [MCP servers](../panel/mcp.md). This page owns the file. That page owns the form.
- Non-goals: discovering servers from another product's home directory.

## Implementation


Role: `loadMcpServers` reads the default file, or `MINI_APP_MCP_CONFIG` when that variable is set. A missing default file is zero servers. A present bad file, or a missing explicit path, is `config-invalid` and is not treated as zero servers. No other directory is searched. Plan: [implementation.md](../implementation.md).
