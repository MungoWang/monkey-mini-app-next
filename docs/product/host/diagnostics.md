---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Runtime diagnostics

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host. The iframe reports. Shell delivers view queries. The author reads them through tools.
- Why the iframe reports: the iframe is on the host origin and the panel is cross-origin to it, so the panel cannot read the iframe DOM or console. Host cannot reach into the browser. A crash is a push, because a dead page cannot be polled. A question is a pull, because a fixed snapshot cannot guess the next question.

Error report:

- Input: the iframe posts one failure to `POST /api/app/:appId/errors`. Kinds: `render` (injected error boundary, includes `componentStack`), `module` (bundle failed to evaluate), `uncaught` (`window.onerror`), `async` (unhandled rejection). Resource-load errors with no message are dropped before the post. An unhandled rejection, render error, or module error with no message is dropped the same way. The runner does not invent a message.
- Output: `mini_app_errors({ appId, since?, clear? })` returns `{ errors, lastSeq, dropped, emptyHint? }`. Each error has a monotonic `seq`. `dropped` counts evictions for this app, not a global cursor. The ring keeps 50. Reload clears it. `clear: true` empties it before the read.
- Failure: the post always answers 204, including malformed JSON, an unknown kind, a bad app id, or an oversized body. An empty ring after reload is not "clean" until the view has been opened; `emptyHint` says so.
- Non-goals: the author writing the error boundary; the panel scraping the iframe; mixing these records into `ctx.push`.

Liveness:

- The runner posts `POST /api/app/:appId/alive` once the document script has executed. Reload forgets that marker.

View query:

- Input: `mini_app_view_eval({ appId, code?, maxBytes?, timeoutMs? })`. `code` is an async function body and must `return`. Omission returns `mma.$("#root")`.
- Injected names: `mma.$(sel, root?)` returns an element or null; `mma.$$(sel, root?)` returns a plain array; `mma.selector(el)` returns a CSS selector that resolves back through `mma.$`. No fourth name. Same-origin `fetch("/api/app/<appId>/errors")` is the escape hatch for host-side data.
- Output: `{ result, view, tookMs, bytes, truncated, stoppedBy, visited, matched, dropped?, error?, hint?, budgetMs }`. `stoppedBy` is `bytes`, `nodes`, `depth`, or `timeout` when one fires. The text also shows the truncation. The caps and the host budget are host policy and are not locked. The reply echoes `budgetMs`.
- `view` is `live` (the iframe answered; `ok` may still be false), `not-open` (no host-stream subscriber, or Shell has no frame), `runner-not-booted` (timed out and no alive post since reload), `pending` (the view is healthy and a query for that app is still running; a second call returns immediately), or `stuck` (timed out after alive). Hints name the next step: open, read errors, raise the budget, or ask the user to reload the tab. Only `stuck` means the main thread is blocked. No tool recovers `stuck`.
- The query travels on the existing host event stream. `requestId` is issued by Host, bound to one app id, and consumed by the first answer. A late, duplicate, or wrong-app reply cannot settle a live query. The iframe accepts the message only from `window.parent` and only from the origin that first spoke to it. Shell posts with an explicit target origin equal to the host origin. Replies are re-bounded on the way in.
- The rendered outline spells geometry (`x=`, `y=`, `w=`, `h=`), viewport pixels, child counts on containers, quoted text on leaves, and `display:none` when hidden. Detached nodes are flagged rather than reported as zero size. Indentation is two spaces.
- Failure: a query that does not answer still returns the envelope with `view` and `hint`. It does not hang the tool past `timeoutMs`.
- Non-goals: a pre-declared snapshot of every possible question; a host-side interrupt of a synchronous loop; reload-on-tab-switch.

`mini_app_open` is the step that makes a view exist. It returns whether a panel received `app:open`.

## Implementation


Role: provider for the ring and the query id. The runner installs `mma.$`, `mma.$$`, and `mma.selector`, accepts `app:eval` only from `window.parent` and the first parent origin, and posts the answer. Shell delivers `app:eval`. The panel cannot read the iframe DOM. Query ids are single-use and bound to one app id. Ring size and query caps are host policy and are not locked. `POST /api/app/:appId/errors`, `POST /api/app/:appId/alive`, and `POST /api/app/:appId/view/eval` answer 204 even when the body is bad, the app id is unknown, or the payload is oversized. They carry no authoring token. Plan: [implementation.md](../implementation.md).
