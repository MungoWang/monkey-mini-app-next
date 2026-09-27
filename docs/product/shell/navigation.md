---
status: locked
progress: settled
updated: 2026-09-20
---

# Embedded navigation

Layer: [Shell](README.md). Index: [features.md](../features.md).

This page owns how a link or a form leaves the app document. Which node it belongs to is [the blueprint](../../blueprint.md). The panel refusal is [Window and event bridge](window.md).

- Owner: Shell.
- The app iframe cannot replace the panel. `appFrameSandbox` has no `allow-top-navigation`.
- A new browsing context for `http` or `https` opens the system browser. The panel does not embed that page. There is no address bar, back stack, or close control for a foreign page.
- `javascript:` runs in the app iframe.
- A same-origin URL stays in the app iframe. That includes a relative URL and a `#hash`.
- An `http` or `https` URL on another origin, when it would load in this iframe, does not. The system browser opens it. `target="_blank"` already does that and is left to the browser.
- A form whose action is on another origin does not submit in the iframe. The system browser opens the action URL. The form body is not sent.
- `mailto:` opens the system mail handler.
- Any other scheme does not navigate and does not open a window.
- Failure: none. A blocked scheme is not an error. The app document stays.
- Non-goals: a contained browser; downloads of a foreign page inside the panel; a custom protocol handler inside the panel.

## Implementation


Role: composition. The sandbox on the panel iframe stops top navigation and does not stop the iframe from navigating itself. `leaveGuardSource` is the capture-phase click and submit listeners in the runner document Host serves. An unmodified primary click is the one it handles. A modifier click is left to the browser. An app script can remove those listeners. The window's navigation handler is the fallback a page cannot remove: a foreign `http` or `https` load is cancelled, and macOS `open` or Windows `start` opens it. `mailto:` is opened the same way. `javascript:` and `about:` stay. A new window is denied inside the shell and opened outside instead. Plan: [implementation.md](../implementation.md).
