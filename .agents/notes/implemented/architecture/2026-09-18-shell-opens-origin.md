# Agent Note: Shell opens the panel origin

Status: implemented

## Problem

Construction order ends with a panel window. `bootHost` started HTTP and left the origin for a person to paste.

## Decision

`openPanelWindow` launches the loopback origin with the platform command: `open` on macOS, `cmd /c start` on Windows. Other platforms throw. `bootHost({ openWindow: true })` runs that after a successful start, using the bound port. Tests inject spawn. A dedicated window runtime is not chosen.

## Alternatives considered

- Leave the origin as a printed URL. Lost because construction says the panel is opened against that origin.
- Embed Tauri or Electron now. Lost because a window library is not locked, and the platform opener already opens the origin on both shipped OSes.

## Consequences

`pnpm dev:host` opens the origin. Dock and close-panel chrome in a native window still wait on a window runtime.
