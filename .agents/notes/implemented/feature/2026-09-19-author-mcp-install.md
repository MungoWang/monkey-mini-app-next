# Agent Note: Authoring MCP installs like the writing skill

Status: implemented

## Problem

Settings only offered a JSON snippet for other assistants. The writing skill already had a dest table and one-click copy. Connecting Pi or Cursor still meant pasting by hand.

## Decision

Shell injects assistant MCP file paths. Host merges a `mini-app` server into those files. The live url and token come from this host. A dest whose url or Authorization does not match is `updateAvailable`. The generate-snippet dialog stays as a fallback. This does not write the app `mcp.json`.

## Alternatives considered

- Only keep the snippet. Rejected: the skill dest table already proved one-click install.
- One format for every assistant. Rejected: OpenCode nests `mcp` with `type: remote`; Claude Code wants `type: http`.

## Consequences

Token rotation marks installed copies stale until the user updates. Writing OpenCode's jsonc rewrites the file as JSON and drops comments.
