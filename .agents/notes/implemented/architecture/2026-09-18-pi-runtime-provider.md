# Agent Note: Pi is a second brain package

Status: implemented

## Problem

Settings listed only `echo`. The person's Pi catalog already has vendors and models. Putting that adapter inside Host would embed a vendor. Putting it next to `echo` would mix two brains that change for different reasons.

## Decision

`@mohou/runtime-pi` implements `RuntimeProvider`. Shell reads `~/.pi/agent/models.json` and injects the brain. Host picks the live id from the registered list. Host does not import Pi. A private package does not query the public npm registry on update check.

## Alternatives considered

- Teach `echo` to read Pi's file. Rejected: echo's contract is to return the prompt.
- Host opens `~/.pi`. Rejected: Shell owns paths into another product home, same as the Pi MCP import.

## Consequences

Selecting Pi writes `runtimeProvider.id` and needs a host restart. `models()` rereads the catalog file. Completions use that vendor's OpenAI-compatible URL. The interface stays in `@mohou/runtime-provider` because it did not have to change with echo.
