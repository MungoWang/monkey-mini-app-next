# Agent Note: The app iframe cannot replace the panel

Status: implemented

## Problem

The opened panel mounts each app in an iframe on the same origin as the panel. A link, `window.top.location`, or a form targeted at the top frame replaces the panel. The navigation page had parked every navigation case on the future webview, so the browser people already use had no refusal.

## Decision

The app iframe carries `appFrameSandbox`. Scripts, same-origin Host calls, forms, modals, downloads, and popups stay allowed. No `allow-top-navigation` token is present. A popup uses `allow-popups-to-escape-sandbox`, so `target="_blank"` opens a normal browser tab. In-frame navigation still replaces that app document. The contained full-screen view, `mailto:`, custom protocols, and `javascript:` URLs stay with the window that owns the webview.

## Alternatives considered

- Leave every navigation case until that window exists. Lost because a top link already replaces the panel in the current browser.
- Omit `allow-same-origin`. Lost because the app calls Host on that origin.
- Treat the sandbox as confinement. Lost because `allow-scripts` plus `allow-same-origin` can reach the parent document and remove the attribute. [trust.md](../../../docs/product/trust.md) already says the iframe does not confine the machine.

## Consequences

Ordinary top navigation stays on the app document. A script that edits the parent iframe can still remove the attribute. The contained view is deferred in [webview navigation](../architecture/2026-09-19-webview-navigation-deferred.md).
