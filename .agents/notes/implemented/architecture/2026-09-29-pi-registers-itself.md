# Agent Note: Pi registers itself

Status: implemented

## Problem

Linking Pi and importing it both ran before the sidecar printed its origin. `npm root -g` waited in the launcher. `probePiRuntime` then imported `@earendil-works/pi-coding-agent`. A failed import left Pi unregistered, and a saved `pi` id failed boot with `config-invalid`. The splash stayed up for work the first screen does not need.

## Decision

Shell calls `registerPiRuntime` on the provider registry and does not await the load. Pi links its global peers and imports them after that call. The id is registered before Host listens. A failed load leaves Pi unhealthy. Calls fail on that call. Boot does not.

## Alternatives considered

- Keep the launcher link and only move the import: the splash still waits on `npm root -g`, and two places still own one job.
- Fall back to `echo` when Pi is missing: the saved id would no longer be the brain the user selected.

## Consequences

The launcher no longer links Pi. A Dock launch still has to resolve Node before the sidecar can start. The import moves with the shell package. Skipping the launcher link needs a window binary rebuild. An old launcher still links before spawn; that link is redundant, not wrong. Whether the peers are present uses `import.meta.resolve`. `require.resolve` throws on these packages because their `exports` field has no CJS main, and that false miss left Pi unhealthy.
