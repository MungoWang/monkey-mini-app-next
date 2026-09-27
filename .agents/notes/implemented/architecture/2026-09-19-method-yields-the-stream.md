# Agent Note: method yields the stream

Status: implemented

## Problem

`stream: true` pushed model events through `onEvent`, and Host copied them onto `streamCall` next to a `result` frame. The UI saw the model finish and the method return as two endings. A method could not read the model stream and hand the UI a different one.

## Decision

`ctx.llm` and `ctx.agent` with `stream: true` return a pull stream. The method reads it with `for await`. Awaiting the same object is that call's final string. Those events stay inside the method.

`streamCall` yields only what the method yields, or what it returns when that value is itself a stream. Awaiting `streamCall` is the method return. It is not a yielded event. `call` drops yields and returns that value.

## Alternatives considered

- Keep `onEvent` and let the method opt in to forwarding. Lost because a callback is not a stream the method can read.
- Put the method return on the same event list as model `done`. Lost because the UI then has two endings, and a post-processed return is not a model event.

## Consequences

`onEvent` is not an author option. Provider code still uses it internally to feed the pull stream. [model stream is the call response](2026-09-19-model-stream-is-the-call-response.md) is superseded for delivery. `done` remains the model call's final string, visible only to the method unless it yields that event.
