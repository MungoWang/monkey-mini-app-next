# Agent Note: Close the pre-Tauri product gaps

Status: implemented

## Problem

MCP settings, Pi, the writing skill, and authoring MCP install shipped, but `pnpm check` was red, several product pages still said the work was unbuilt, and storage restore wrote without asking.

## Decision

Tests cover the new owner routes and the settings dest lists. Product pages name the shipped MCP editor, agent dests, and restore confirm. Claude user-scope MCP stays `~/.claude.json`; `CLAUDE_CONFIG_DIR` moves that file inside the named dir. A stdio check that exits is still `mcp-start-failed`. That is the server, not a second Host start path.

## Alternatives considered

- Drop coverage below 85% for the new files. Rejected: the gate is the quality bar.
- Special-case `uvx mcp-server-fetch`. Rejected: a dest table and a live check already surface the failure.

## Consequences

Embedded navigation, the Tauri window, and a Windows machine run stay deferred together.
