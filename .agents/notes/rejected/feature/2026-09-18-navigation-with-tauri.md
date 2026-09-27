# Agent Note: Embedded navigation ships with the Tauri shell

Status: rejected — the contained view is deferred, not part of the first window

Superseded by [webview navigation stays deferred](../../implemented/architecture/2026-09-19-webview-navigation-deferred.md).

## Problem

A link or a script inside an app can navigate the host frame away and take the panel with it. The browser iframe now refuses top navigation. That does not build the contained view. See [the browser iframe note](../../implemented/bug-fix/2026-09-19-app-frame-cannot-replace-panel.md).

## Proposal

The work is one pass with the Tauri shell, not a patch on the current browser panel. The pass covers links, script and form navigation, downloads, mail and phone links, custom protocols, `javascript:` URLs, and an iframe that navigates its top frame. The concrete list is taken from a published webview pattern at the time the shell is built. A case that pattern shows is not left for a follow-up.

## Alternatives considered

- Build it now in the browser panel. Rejected: the current window is an ordinary browser tab. The contained view needs the shell that owns the webview.
- Handle `<a href>` only. Rejected: downloads and custom protocols replace the host frame the same way.

## Acceptance criteria

- The Tauri shell contains or refuses every navigation case the chosen pattern names.
- None of those cases replace the host frame.
- Dismissing a contained page returns to the same app.

## Risks

- The published pattern may name cases this product should refuse rather than display. The page already allows contained, external, or refused.
