# Agent Note: MCP servers are their own settings section

Status: implemented

## Problem

External tool servers existed only as `mcp.json`. The panel could not add one, see if it connects, or list its tools. Folding that into the runtime or network form would mix a live check with a config save.

## Decision

Settings has one MCP section. It edits the file [Server config](../../../docs/product/mcp-client/server-config.md) already describes. Check does not write. Save writes `mcp.json`. Disabled servers persist as `disabled: true` and are not started at boot. Import (paste, Pi, file) recognizes first, then opens the add/edit form. Delete asks. The editor is a dialog, not nested in the settings `<form>`.

## Alternatives considered

- A row inside Runtime or Network. Rejected: those sections are one field and one save. A server list and a live check are not that form.
- Leave the file as the only editor. Rejected: the panel is where the owner configures the host.

## Consequences

A check starts a server process and must not outlive the request. Import admission lives in `mcp-import.ts`, not in the editor or the view.
