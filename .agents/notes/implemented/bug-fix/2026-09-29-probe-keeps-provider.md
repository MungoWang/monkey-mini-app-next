# Agent Note: A finished app call does not stop the host provider

Status: implemented

## Problem

Settings probe of the live Pi provider reported `runtime provider is not healthy: pi` after a mini-app chat succeeded. Probe reads `healthy()`, which is the provider's started flag. `bindBrain` starts that same shared provider for one call, then `stop()` clears the flag. The next chat starts it again, so chat still works. The probe sees the cleared flag.

## Decision

Ending an app call does not stop the injected provider. Host start and dispose own that lifecycle.

## Alternatives considered

- Make the settings probe ignore `healthy()` and only import Pi packages. Lost: the flag would still be wrong for the next call that checks it before `start()`.
- Give each call its own provider. Lost: Shell registers one brain and Host starts it once.

## Consequences

A probe of the live provider stays healthy after chat. Host dispose still stops the provider.
