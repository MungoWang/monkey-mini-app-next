# Agent Note: Dialog close shares one renderer

Status: implemented

## Problem

Closing a kit dialog rejected with `Cannot read properties of undefined (reading 'T')` inside `flushSync`. The kit bundle carried its own `react-dom`. That copy read React internals off the module namespace, which does not expose them, and it was not the renderer that mounted the app.

## Decision

`react-dom` and `react-dom/client` are platform modules served by the runtime file. The kit build leaves them external. The runtime file exports `createPortal`, `flushSync`, and `unstable_batchedUpdates` next to `createRoot`. A CommonJS `require('react')` inside the kit receives the React exports object, including the default export's internals.

## Alternatives considered

- Re-export only the internals symbol and keep the kit's `react-dom`. Rejected: `flushSync` would still run against a renderer that did not mount the tree.
- Catch the rejection in the dialog. Rejected: the close would still skip the update `flushSync` was there to commit.

## Consequences

A kit dialog close uses the same renderer as the app. A second `react-dom` in `sdk.js` is a bug, not a fallback.
