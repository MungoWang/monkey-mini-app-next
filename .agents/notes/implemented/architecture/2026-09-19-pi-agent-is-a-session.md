# Agent Note: Pi agent is an in-memory session

Status: implemented

## Problem

`ctx.agent` on the Pi brain was one chat completion. It never loaded Pi's extensions, skills, or packages, so a goal that needed Jira or a skill stopped after the model wrote a plan.

## Decision

`agent` calls `createAgentSession` once per run. The session manager is `SessionManager.inMemory(cwd)`. The conversation is not written to `~/.pi/agent/sessions`. The loader uses Pi's `getAgentDir()`. Shell does not pass that path. Extensions, skills, and packages from that directory stay in the run. The call does not pass a tool allowlist, because an allowlist drops every tool it does not name. `llm` stays one completion. Echo stays one step. Host does not import the coding-agent package.

## Alternatives considered

- List Host's external MCP tools and loop chat completions inside Pi. Lost because that list is not Pi's extensions or skills, and it is a second tool set beside `ctx.mcp`.
- Reuse the user's on-disk Pi session. Lost because the run must stay isolated and must not archive the conversation.

## Consequences

When the caller and the host config name no model, the session uses the default provider and model in Pi's settings. Pi's own finder drops that default when the catalog key is an environment reference, and then the session model is `unknown`. Passing the default in avoids that. The first agent call pays for loading the agent directory. Extension caches, such as an MCP cache, may still be written. That is not the session file. A tool that asks for a terminal UI can stall, because this run has no TUI. `ctx.mcp` is unchanged.
