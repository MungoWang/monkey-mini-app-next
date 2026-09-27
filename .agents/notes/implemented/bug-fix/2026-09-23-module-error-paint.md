# Agent Note: Module load paints into #root

Status: implemented

## Problem

When the UI entry module failed to import (missing kit export, bad default export), the runner posted `kind: module` to diagnostics and left `#root` blank.

## Decision

`paintModuleError` is vanilla DOM in the runner document. Import failure and a non-function default export both post diagnostics (when a message exists) and paint a reloadable error card. It does not import React or the kit.

## Alternatives considered

- Mount `AppErrorBoundary` after a partial kit load. Module failure may be the kit itself. Rejected.
- Only improve `mini_app_errors` copy. Does not fix the white iframe. Rejected.

## Consequences

Render failures still go through `AppErrorBoundary`. Module failures no longer depend on that tree having mounted.
