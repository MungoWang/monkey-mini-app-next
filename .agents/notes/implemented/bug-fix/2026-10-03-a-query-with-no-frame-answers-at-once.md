# Agent Note: A view query with no frame answers at once

Status: implemented

## Problem

`mini_app_view_eval` on an app the panel had not opened cost the full `DEFAULT_VIEW_TIMEOUT_MS` (3 s) and then described the wrong thing: `runner-not-booted` with the hint `the runner has not booted since reload`. Nothing was wrong with the app. The panel document held no iframe titled with that app id, so it dropped the `app:eval` event silently, and Host had no way to learn that. The hint sent the reader looking for a runner that was never asked to start.

The documented contract already promised the fast path: `docs/product/author-surface.md` said a subscriber with no frame returns `not-open` immediately, and `docs/product/shell/window.md` said Host records `not-open` as soon as Shell says so. `createViewQueries().absent` implemented it, but only an in-process caller could reach it. `packages/shell/src/watch.ts` calls `views.absent` when the shell has no frame at all, and no HTTP route carried the same report from the panel the window actually shows.

Two smaller consequences lived in the same gap. The `alive` marker is set when a runner posts `/alive` and cleared only by a reload, so a closed tab kept its marker and a later query was reported `stuck` — "the main thread is blocked; reload the tab" — for a frame that no longer existed. And the timeout hint for a missing frame named a runner failure rather than the next step.

## Decision

The panel reports its own absence, and Host drops the marker with it.

- `POST /api/app/:appId/absent` joins the token-free diagnostic posts. `DiagnosticPorts` gains `markAbsent`, and the assembled host wires it to `views.absent`.
- `views.absent` clears `alive` for that app before it settles pending queries, because a marker left by a frame that is gone is stale.
- The panel document posts it when `app:eval` finds no iframe titled with that app id. One `postToAppFrame` serves both the author-event bus and the query path, so the delivery answer the bus already needed is the same answer the query path reports on.
- The timeout hint for a query with no marker is `no live frame for this app; open or reload it in the panel`. It names the step without claiming a cause the marker cannot prove.

## Alternatives considered

- Let the panel answer the query through `POST /api/app/:appId/view/eval` with `view: not-open`. It needs no new route, but it makes one route mean both "the iframe answered" and "no iframe exists", and the answer would have to carry a request id the absence report does not need.
- Wait 3 s and rename the state to something like `not-open` in the host. The caller still pays the full budget, and Host still cannot tell a closed tab from a booting one.
- Clear `alive` on a panel disconnect instead of on absence. A disconnect is a property of the stream, not of one app's frame, and a panel that stays connected while a tab closes would keep the stale marker.
- Report absence after a short delay to let a frame mount. The window a caller can race is one React render, and the price is a timer whose value is host policy; a false `not-open` costs one retry, while the 3 s wait costs every caller.

## Consequences

An eval for an app the panel has not opened returns `not-open` with `tookMs` near zero, and its hint names the step: open or reload the app. `stuck` now means what it says, because a frame that is gone no longer keeps a marker. `runner-not-booted` remains for a timed-out query whose app still reports neither a frame nor a runner.

A panel that does not send the report (an older build, or another front-end) keeps the old behavior: the query times out and reports `runner-not-booted` with the new hint. The window's panel is `packages/shell/src/browser.tsx`, which is bundled into the panel document at pack time, so this report reaches a running app only after the panel artifacts are rebuilt and the host is repacked.
