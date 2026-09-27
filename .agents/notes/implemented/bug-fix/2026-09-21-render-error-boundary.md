# Agent Note: Render error boundary

Status: implemented

## Problem

A throw during `ui.tsx` render posted to `mini_app_errors`, then the runner boundary painted `null`. The iframe went white. The author only saw the React console line.

## Decision

The runner wraps the app in `AppRuntime` and `AppErrorBoundary` from the UI kit. A render failure shows that card and still posts `kind: render`.

## Alternatives considered

- Keep the inline boundary and draw a local alert. The kit already has the card and the post. Rejected.
- Leave the white frame and tell the author to call `mini_app_errors`. The page looks dead. Rejected.

## Consequences

Module, uncaught, and async failures still post without a card. Those are not render throws.
