---
status: locked
updated: 2026-10-01
---

# @mohou/runtime-pi

Role: `provider`.

Pi brain. `llm` is one `ModelRuntime.completeSimple` call. `models` is `ModelRuntime.getModels()`. Pi owns the catalog path and the provider API. This package does not read `models.json` and does not send its own HTTP request. `agent` is one in-memory coding-agent session and does not write a session file. Shell injects it. Host does not import this package. Product: [ctx.agent](../../../docs/product/runtime/ctx-agent.md).
