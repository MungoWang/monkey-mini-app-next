# Agent Note: The panel is a built page

Status: implemented

## Problem

Host compiled the panel on every start, and the document also carried a second stylesheet of `mma-*` rules. App stylesheets are compiled on request because author source changes while Host is running. The panel does not.

## Decision

`pnpm build:panel` writes `packages/shell/dist/panel.html` and `panel.js`. `pnpm dev:host` reads those files and refuses to start when they are missing. Tailwind is the only panel stylesheet. `GET /` still injects the host palette. A relative import is judged from the importing file, so `api/` may import `shared/`.

## Alternatives considered

- Keep compiling the panel inside `bootHost`. Lost because a static page was paying the app compile path.
- Keep `panelCssText` beside Tailwind. Lost because the two stylesheets described the same chrome.

## Consequences

A panel source change is invisible until `pnpm build:panel` runs again. Author apps are not given a compatibility import for the previous package names.
