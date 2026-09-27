# Agent Note: Host runner wraps kit locale

Status: implemented

## Problem

Kit chrome defaulted to English inside every app iframe. Host `locale` only moved the panel shell. Authors expected the runner to inject `UiProvider`.

## Decision

`renderRunnerDocument` wraps `UiProvider` under `AppRuntime`. Host `zh-CN` maps to kit `zh`; anything else maps to `en`. A later host language change applies on the next document load.

## Alternatives considered

- Leave authors to wrap `UiProvider`. Easy to forget; panel and kit then disagree. Rejected.
- Live-post locale into open iframes. Appearance already has a path; locale did not. A reload is enough. Deferred.

## Consequences

An author may still wrap `UiProvider` to override messages. Nested providers win for that subtree.
