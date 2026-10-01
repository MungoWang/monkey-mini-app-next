# Agent Note: DSH is a skill install target

Status: implemented

## Problem

The writing-skill dest table held Claude, Pi, OpenCode, Kiro, and WorkBuddy. This product is developed inside DSH, which reads every directory under its own `skills/` — the skill driving this work sits at `~/.dsh/skills/monkey-mini-app` — and no row could install into it. Setting DSH up meant copying the tree by hand.

## Decision

`builtinSkillAgents` carries DSH: `skillsDir` is `~/.dsh/skills`, `detectDir` is `~/.dsh`. The panel's skill section renders rows from the host's `/api/author-skill` response, so the row needs no panel change, and a machine without `~/.dsh` shows it dimmed as missing-home. The install writes `~/.dsh/skills/mohou-mini-app` under the skill-id rule.

## Alternatives considered

- Leave DSH to the custom skill directory the user adds by hand. Lost because `~/.dsh/skills` has the same shape as the other rows, and the feature exists to avoid a hand copy.
- Add a DSH row to the authoring-MCP table in the same change. Deferred here and shipped next: the write path and format are in [the authoring-MCP note](2026-10-02-dsh-authoring-mcp.md).
- Change the skill id so the install replaces the older copy. Lost because the directory name is the id, and the older copy belongs to the previous plugin.

## Consequences

- A DSH install writes `~/.dsh/skills/mohou-mini-app`, so a machine that also carries the older plugin's `monkey-mini-app` shows both skills to the agent until the old one is removed.
- The DSH MCP connection has no install row until the harness names its MCP server file.
