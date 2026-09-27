# Agent Note: Panel chrome matches the original panel

Status: implemented

## Problem

The Tailwind gallery opened, and the theme and settings controls did not. The page did not match the original panel: no toolbar popover, no settings page, and card style sat in the list instead of settings.

## Decision

The panel document includes this package's copy of the original chrome stylesheet. Toolbar buttons are native buttons. Theme opens the palette and appearance menu and writes host policy. Settings opens the settings page. Card style stays panel-local and is edited there. The author kit is not imported.

## Alternatives considered

- Keep the Tailwind-only gallery. Lost because the controls did not open and the layout was not the original panel.
- Import `@mini-app/ui` for the chrome. Lost because that kit is the author surface, and the original chrome already has its stylesheet.

## Consequences

`GET /` still injects the host palette into the theme tokens the stylesheet reads. Apps are listed from this product's runtime root, not from another product's directory. Supersedes the control-copy note [2026-09-18-panel-owns-its-controls.md](2026-09-18-panel-owns-its-controls.md) for how the chrome is drawn.
