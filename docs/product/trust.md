---
status: locked
updated: 2026-09-16
---

# Trust

Mini-apps run locally as the host user. `ctx.bash`, `ctx.http`, and `ctx.llm` are real host capabilities. The iframe isolates a crashed view from the panel. It does not isolate the machine. This product is not a multi-tenant host and not a place to run untrusted third-party packages. A mini-app the owner just generated is as trusted as the owner. Someone else's app is treated like a script they sent.

## Implementation


Role: stated once. The iframe isolates a crashed view from the panel. It does not confine the machine. No implementation adds a sandbox in this product. Plan: [implementation.md](implementation.md).
