# Agent Note: External links leave the app

Status: implemented

[The first window](./2026-09-19-webview-navigation-deferred.md) shipped no contained browser. This note is the handoff that replaces that deferral.

## Problem

`allow-top-navigation` stops an app from replacing the panel. It does not stop an `<a>` with no target from replacing the iframe document. A foreign page then refuses to be framed, so the app goes blank and the host stays up. `javascript:` is not that kind of link.

## Decision

The runner document captures click and submit. A same-origin URL stays, including a relative URL and a hash. `javascript:` runs. `http` and `https` on another origin open in the system browser and do not replace the app. `mailto:` opens the system mail handler. Any other scheme does neither. An external form opens its action URL and does not send the body. There is no contained browser. The window navigation handler repeats that decision outside the page: a foreign load is cancelled, and the system opens the URL. A page script cannot remove that handler.

## Alternatives considered

- A panel webview for foreign pages. Lost because that needs an address bar, a back stack, certificate failures, and downloads, and the window only loads loopback.
- Swallow the click and open nothing. Lost because a new browsing context for `http` and `https` already opens the system browser. A same-frame external link should do the same, not go blank.
- Block `javascript:`. Lost because it runs in the app document and does not replace it.

## Consequences

- The runner guard is not confinement. An app script can remove it, as it can remove the sandbox attribute. The window handler still cancels the foreign load.
- [Embedded navigation](../../../docs/product/shell/navigation.md) is `locked`.
