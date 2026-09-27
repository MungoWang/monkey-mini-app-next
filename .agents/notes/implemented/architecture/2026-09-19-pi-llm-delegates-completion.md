# Agent Note: Pi llm delegates the completion

Status: implemented

## Problem

`ctx.llm` on the Pi brain sent its own `POST /chat/completions`. That client only accepted `openai` and `openai-completions`. Any other API in Pi's catalog failed in this package, even though Pi already speaks that API.

## Decision

`llm` resolves the model the same way `agent` does, then calls `ModelRuntime.completeSimple`. The return is still one string. No tools are passed. A `stopReason` of `error` is `provider-unhealthy`. `aborted` is `cancelled`. An empty text is `empty-completion`. This package does not choose the HTTP shape.

## Alternatives considered

- Keep the fetch client and add a branch per Pi API. Lost because that is a second provider implementation, and it drifts every time Pi adds an API.
- Run `createAgentSession` for `llm`. Lost because that loads tools, extensions, and MCP. `llm` is one completion.

## Consequences

Auth, request shape, catalog path, and provider errors belong to Pi. A missing credential surfaces as `provider-unhealthy` from `completeSimple`, not from a key check in this package. The settings list is `ModelRuntime.getModels()`. Shell does not pass a models path.
