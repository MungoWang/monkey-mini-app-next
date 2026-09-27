# Agent Note: Panel chrome is the original stylesheet

Status: implemented

## Problem

`pnpm dev:host` opened a document with no CSS. The gallery was unstyled buttons. The original panel already had the chrome CSS and card layout.

## Decision

`@mini-app/panel` owns the original chrome stylesheet, with `--dsw-alias-*` mapped onto the host theme tokens. Shell inlines that CSS in the panel document. Gallery markup uses the original `mma-*` classes. Reducers and injected clients stay. The first card style is `hero`.

## Alternatives considered

- Restyle the stub HTML with Tailwind. Lost because the original chrome already exists and the instruction was to integrate it, not redraw it.
- Mount the original panel store and host adapter. Lost because this repo already has the panel clients, and Panel still must not import Host.

## Consequences

Empty gallery still has chrome. Shell loads the stylesheet from `@mini-app/panel/chrome`, a `.ts` entry, because Node type stripping cannot import `.tsx`. A later change can pin host theme values onto the same tokens. Card-style switching in the theme pop is not wired yet.

Superseded for the control source by [2026-09-18-panel-owns-its-controls.md](2026-09-18-panel-owns-its-controls.md). Panel copies button and input. It does not import the author kit.
