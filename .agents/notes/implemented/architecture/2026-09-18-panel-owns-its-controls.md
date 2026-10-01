# Agent Note: Panel owns its controls

Status: implemented

## Problem

The panel document had no stylesheet, then a partial chrome port. Importing `@mohou/ui` would put author products, `useApp`, and the iframe vendor on the window. The author kit and the panel chrome change for different reasons.

## Decision

Panel copies the button and the input it renders. It does not import `@mohou/ui`. Tailwind for the panel scans panel source only. Host injects the current palette into `GET /` so those utilities resolve `--background` and the other theme tokens. Reducers and HTTP clients stay.

## Alternatives considered

- Import leaf components from `@mohou/ui`. Lost because the kit is the author surface, and a panel bundle should not follow kit products.
- A shared primitives package. Lost because only the panel needs this copy. The kit keeps its own components for authors.

## Consequences

A new panel control is copied here, not re-exported from the kit. Theme values still come only from theme files. The earlier chrome stylesheet note is [2026-09-18-panel-chrome-from-original.md](2026-09-18-panel-chrome-from-original.md).
