---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Provider injection

Layer: [Runtime](README.md). Index: [features.md](../features.md).

- Owner: Runtime, constructed by Shell and injected into Host.
- Input: `runtimeProvider.id` plus optional `{ provider, model, options }` from config. The provider exposes `id`, optional `label`, optional `configure`, `llm`, `agent`, optional `healthy`, `start`, `stop`, and optional `describe` for Settings fields (`string`, `secret`, `select`).
- Output: Host calls `configure`, then `start`, then routes `ctx.llm` and `ctx.agent` to that object. Settings lists only providers Shell registered. `echo` is always registered.
- Failure: a config id that is not registered fails Host boot. `start` throwing fails Host boot. A later call when the provider is unhealthy throws on that call. The app still loads.
- Non-goals: the provider implementing bash, HTTP, storage, push, MCP, or authoring tools; Host shipping a vendor adapter; a chat session reused as the app brain.

Echo: `llm` returns the prompt unchanged; `agent` returns the goal unchanged and emits `status` running then `done`; `healthy` is true; the tool set is empty.

## Implementation


Role: seam. Shell registers providers and injects one into Host. Host calls `configure`, then `start`, and routes `ctx.llm` and `ctx.agent`. Host does not embed a vendor. `echo` lives in `@mini-app/runtime-provider`. Pi lives in `@mini-app/runtime-pi`. A missing id fails boot with `config-invalid`. `start` throwing fails boot. Plan: [implementation.md](../implementation.md).
