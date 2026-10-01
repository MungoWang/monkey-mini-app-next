# Agent Note: Shell boots Host

Status: implemented

## Problem

Host could be constructed by any caller. The product says only Shell constructs it. There was no composition package, so that rule had nowhere to live.

## Decision

`@mohou/shell` resolves the runtime root, bootstraps or refuses config, constructs `echo`, and starts Host. A failed start disposes the session. The panel window is not opened. The panel view is not written.

## Alternatives considered

- Leave construction in Host. Lost because Host would then choose the provider, which the product forbids.
- Open a browser window now. Lost because the panel view does not exist, and the window paths are not locked.

## Consequences

A later window calls `bootHost` and opens the panel against the Host origin. It does not construct Host a second way.
