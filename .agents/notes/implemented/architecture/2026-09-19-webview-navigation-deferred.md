# Agent Note: Webview navigation stays deferred

Status: implemented

Superseded for the handoff by [External links leave the app](./2026-09-20-external-link-handoff.md). This note still records why the first window has no contained browser.

[The blueprint](../../../docs/blueprint.md) puts the contained view on the 1.0 node. This note stays the decision that shipped with the first window: the view was not built then.

## Problem

The browser iframe already refuses top navigation, and current apps open external links with `target="_blank"`. The earlier proposal still tied a contained webview, `mailto:`, custom protocols, and `javascript:` URLs to the first window.

## Decision

That contained view is not in this product. [Embedded navigation](../../../docs/product/shell/navigation.md) is `deferred`. External links open the system browser. Reconsider the contained view later. It is not part of the first window.

## Alternatives considered

- Build the contained view with the first window. Lost because the apps that exist only need a system browser tab, and a contained browser is a second product.
- Leave the page as an open draft. Lost because an undecided sentence reads as work still in progress.

## Consequences

The first window does not gain a navigation surface. `appFrameSandbox` remains the refusal in the browser panel. The proposal that bundled this with the Tauri shell is rejected.
