# Agent Note: Settings can recycle the host

Status: implemented

## Problem

Changing the runtime wrote the file and said restart was required, without saying what to restart or offering a way to do it.

## Decision

The message names the host. A button asks Shell to dispose the live session and start another in the same process. That is not a hot-swap of the brain. Host only calls the restart function Shell injected.

## Alternatives considered

- `process.exit`. Rejected: nothing respawns this process.
- Switching the live brain in place. Rejected: the product keeps that for a host restart.

## Consequences

The panel reloads after the new listener is up. Open app frames are new documents.
