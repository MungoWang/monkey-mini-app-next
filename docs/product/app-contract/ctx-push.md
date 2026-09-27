---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# ctx.push and useApp events

Layer: [App contract](README.md). Index: [features.md](../features.md).

- Owner: App contract for the call shape. Host owns the buffer and the per-app stream.
- Input: `ctx.push(name, params?)`. `params` must be JSON-serialisable. The UI subscribes with `useApp().on(name, cb)` or `useApp().onAny(cb)`. `on("*", cb)` receives every channel's data. `onAny` receives `{ name, data }`.
- Output: the open views of this app receive `{ name, data, seq }` on this app's event stream. The path is not locked. A late subscriber receives the retained buffer. `on` and `onAny` return an unsubscribe function. One stream is shared per app id and closes when the last subscriber leaves.
- Failure: `push` never throws and never fails the API call that emitted it. A non-JSON payload is dropped and the host logs a warning. A reconnect whose last id is older than the buffer delivers `app:gap` with `{ appId, since }`. `onAny` surfaces that gap as `{ name: "*", data: { gap: true } }`. The UI refetches a snapshot. It does not invent the missing events.
- The stream sends a retry hint on open and a ping while open. The buffer keeps a bounded tail per app. Sequence ids are per app. The hint, the ping interval, and the tail length are host policy.
- Non-goals: a UI reading another app's events; polling as the progress path; mixing host diagnostics into this stream; delivering `ctx.llm` or `ctx.agent` deltas. A method that wants the UI to see text yields it on `streamCall`. A parent-posted author event still reaches `on` and `onAny`. The UI still renders when nothing is posted.

## Implementation


Role: `ctx.push` writes the per-app author buffer. A non-JSON payload is dropped and logged. The call still succeeds. A subscriber receives a retry hint on open and a ping while attached. The live stream closes when the last subscriber leaves; the retained tail stays. `on` and `onAny` are that mapping. `GET /api/app/:appId/events` is mounted. The runner delivers a parent-posted author event to `useApp().on` and `onAny`. A gap reaches `onAny` only. Ping and the retry hint stay off this hook. Buffer length and ping interval are host policy and are not locked. Diagnostics never enter this stream. Plan: [implementation.md](../implementation.md).
