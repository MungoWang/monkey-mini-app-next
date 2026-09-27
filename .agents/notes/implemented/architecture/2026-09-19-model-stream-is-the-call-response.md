# Agent Note: model stream is the call response

Status: implemented

Superseded for delivery by [method yields the stream](2026-09-19-method-yields-the-stream.md).

## Problem

`ctx.llm` and `ctx.agent` mirrored events onto `ctx.push` through a shared event name. Two calls that used the same name interleaved. A call id chosen by the author could collide or be omitted. Putting `on` on every `call` made ordinary methods look like they had a stream.

## Decision

`useApp().call` stays one JSON result. `useApp().streamCall` is the same `POST /api/call` with `Accept: text/event-stream`. The response body is that invocation's events, then `{ type: "result", value }` or `{ type: "error", message }`. Parallel calls are parallel responses.

`ctx.llm(..., { stream: true })` and every `ctx.agent` write onto that response when it is open. Each invocation gets a `runId`. `source` is `llm` or `agent`. A plain `call` drops the events. The author does not see or pass an id. `onEvent` still runs inside the method. A throw there does not drop the response event. Model events are not `ctx.push`.

## Alternatives considered

- Tag `ctx.push` with a call id and filter in `on(name)`. Lost because the UI had to know an internal channel name, and a handwritten id can collide.
- `run.on` on every `call`. Lost because most methods emit nothing, so the method does not explain itself.
- `ctx.llmStream` returning a stream to `main.api`. Lost because the UI reads the response. The method still returns a string.

## Consequences

`streamTo` is gone. A method that starts a model call and returns before it finishes will not deliver those events on `streamCall`. The method has to stay running. [llm stream is optional](2026-09-19-llm-stream-is-optional.md) still owns the default of `stream: false`.
