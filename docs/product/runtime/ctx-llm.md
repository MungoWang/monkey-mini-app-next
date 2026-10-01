---
status: shape-locked
progress: settled
updated: 2026-10-01
---

# ctx.llm

Layer: [Runtime](README.md). Index: [features.md](../features.md).

- Owner: Runtime.
- Input: `ctx.llm(prompt, opts?)`. Shared options: `provider`, `model`, `system`, `schema`, `maxTokens`, `retryTimes`, `signal`. `stream` defaults to false. Omitted `provider` and `model` use the runtime provider config. Omitted `maxTokens` and `retryTimes` use the resolved host policy. A caller value outside that policy fails the call. `retryTimes` counts the first attempt.
- Output: a string when `stream` is omitted or false. `schema` is a JSON Schema hint plus fence stripping. The caller parses it. When `stream` is true, the same object is an async iterable of `status`, `text-delta`, `error`, and `done`, and awaiting it is still the final string. `done` is that call's final string. The iterable does not reach the UI. A method that wants the UI to see text `yield`s it. `llmEventType` from `@mohou/ui` lists those `type` values. A view does not write `"text-delta"`. The same union is `LlmEvent` from `@mohou/ui`.
- Failure: no live provider throws. An empty completion throws. Cancel throws `cancelled`. Retries exhaust and throw the last error. A throwing app does not leave a session behind.
- Non-goals: a separate `ctx.llm.stream` method; a tool list on this call; copying this iterable onto `streamCall`. The method yields what the UI should see.

## Implementation


Role: Host wraps the provider call. A `schema` option strips one fence and still returns a string. `stream` true is a pull stream. Empty result emits `empty-completion`. Cancel emits `cancelled` and is not retried. Exhausted retries emit `retry-exhausted`. A caller budget outside policy emits `model-policy` before the provider runs. Token and retry numbers are host policy and are not locked. Plan: [implementation.md](../implementation.md).
