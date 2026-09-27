# Agent Note: llm stream is optional

Status: implemented

Superseded for delivery by [model stream is the call response](2026-09-19-model-stream-is-the-call-response.md). `stream` still defaults to false. `streamTo` is not the delivery path.

## Problem

`ctx.llm` returned one string and hid every token until the model finished. A caller that wanted to show text as it arrived had to use `ctx.agent`.

## Decision

`ctx.llm` keeps a `stream` option. The default is false. False ignores `onEvent` and `streamTo`. True emits `status`, `text-delta`, `error`, and `done`, and `streamTo` mirrors them through `ctx.push`. The return stays a string. `ctx.agent` has no `stream` field.

## Alternatives considered

- A second method, `ctx.llm.stream`, that returns a stream handle. Lost because the return of `ctx.llm` stays a string, and the agent already observes through events.
- Streaming on by default. Lost because a completion that only needs the final string should not require an observer.

## Consequences

Pi reads `streamSimple` only when `stream` is true. Echo emits the whole prompt as one delta in that case. A model that thinks before the first text token still waits inside the provider until that token exists.
