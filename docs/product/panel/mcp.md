---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# MCP servers

Layer: [Panel](README.md). Index: [features.md](../features.md).

- Owner: Panel for the editor. Host for the file. The file shape is [Server config](../mcp-client/server-config.md).
- The editor is its own settings section. It is not a row inside runtime, network, or [writePolicy](../owner-surface.md#writepolicy).
- The person adds, edits, and removes servers. Each server uses the shape that file already accepts. A disabled server is stored as `disabled: true` and is not started at boot.
- Paste, a chosen JSON file, and the Pi import Shell points at are admitted by one parser. A fragment without braces is wrapped. A map, an `mcpServers` object, and one server object are accepted. Other editors' field names are mapped onto command, args, url, and env. Import does not write the file. It opens the add/edit form so the person can adjust and check, then save.
- A server can be checked without saving: whether it connects, and which tools it exposes. Running uses the theme colour. The rest of the tool list opens in one dialog: names on the left, the selected tool's detail on the right. A failed check stays on that server. It does not fail Host boot, and it does not mark the other settings sections dirty.
- Saving writes `mcp.json`. A check does not write the file. Delete asks first.
- Failure: a save that would make the file invalid is shown, and the file stays as it was. A check that cannot start the server shows that error. An empty `{}` file is an empty list, not an import error.
- Non-goals: discovering servers from another product's home directory; a credential editor; editing theme CSS. Installing the authoring MCP into other assistants is [Settings](settings.md), not this editor.

## Implementation

Role: consumer. `McpSettings` calls `listMcp`, `writeMcp`, `checkMcp`, `admitMcp`, and `importMcp` on the injected client. Routes are in [host/http.md](../host/http.md). Admission lives in Host `mcp-import.ts`. Plan: [implementation.md](../implementation.md).
