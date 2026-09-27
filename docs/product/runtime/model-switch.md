---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Model switch keeps the tool set

Layer: [Runtime](README.md). Index: [features.md](../features.md).

- Owner: Runtime.
- Input: a Settings change of `provider` or `model` inside the active runtime provider, or `opts.provider` / `opts.model` on one call.
- Output: the same tool set that provider already exposes for app runs. Authoring tools are not in that set. Echo's set stays empty.
- A brain that talks to vendors publishes `models()` as `{ provider, models }[]`. `provider` here is the vendor name inside that brain, not `runtimeProvider.id`. A call's `provider` must name one group. Its `model` must be in that group. A model with no `provider` must belong to exactly one group. An unknown vendor emits `unknown-model-provider`. An unknown or ambiguous model emits `unknown-model`. Neither failure swaps tools or `runtimeProvider.id`.
- `echo` does not publish `models()`. A model name on an echo call is ignored.
- Non-goals: `ctx.tool`; `listTools`; an app adding or removing tools; a model change that silently attaches the authoring catalog.

Changing `runtimeProvider.id` is a different action. It writes config and takes effect when Shell restarts Host. The new provider brings its own tool set.

## Implementation


Role: seam. Changing model or the provider config field keeps that provider tool set. Changing `runtimeProvider.id` writes config and applies when Shell restarts Host. An unknown model fails the call and does not swap tools. Plan: [implementation.md](../implementation.md).
