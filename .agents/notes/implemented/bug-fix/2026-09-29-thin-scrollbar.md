# Agent Note: Scrollbars stay thin

Status: implemented

## Problem

A workbench taller than the frame shows the platform's always-on scrollbar. On macOS that bar is a thick gray capsule at the window edge. Windows WebView2 draws the same kind of bar. Hiding it removes the scroll affordance.

## Decision

The runner document and the host chrome set `scrollbar-width: thin` and an 8px `::-webkit-scrollbar` thumb. The webkit rule sets `-webkit-appearance: none`, or macOS keeps the thick always-on bar. WKWebView and WebView2 both honor that rule. `scrollbar-width` covers engines that ignore it. Pill and desk rails keep `scrollbar-width: none`.

## Alternatives considered

- Hide every scrollbar. Lost: a long workbench still needs a visible scroll position.
- Style only the host page. Lost: the thick bar in the screenshot is the app iframe, which does not inherit host CSS.

## Consequences

An app that sets its own scrollbar rules can still override these. The installed host must be restarted before an open iframe picks up the runner style.
