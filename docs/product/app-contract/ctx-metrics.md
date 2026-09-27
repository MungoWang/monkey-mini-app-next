---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# ctx.system.metrics

Layer: [App contract](README.md). Index: [features.md](../features.md).

- Owner: App contract. Host reads the OS snapshot.
- Input: `ctx.system.metrics()`.
- Output: `{ platform, arch, hostname, uptimeSec, loadavg, memory: { total, free, used, usedRatio }, cpu: { count, model, speedMHz }, collectedAt }`. `loadavg` is `{ "1m", "5m", "15m" }`, or `null` on Windows, where the OS does not provide it.
- Failure: an unreadable snapshot throws. The method does not invent zeros.
- Non-goals: per-process metrics of other apps; a push channel (the UI polls or the app pushes a copy via `ctx.push`).

## Implementation


Role: definition. Host reads one OS snapshot per call. An unreadable snapshot throws `metrics-unreadable` with `cause`. Windows load average is `null`, not zeros. No push channel is added here. Plan: [implementation.md](../implementation.md).
