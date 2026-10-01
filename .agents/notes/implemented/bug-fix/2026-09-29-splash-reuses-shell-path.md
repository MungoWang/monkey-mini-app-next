# Agent Note: A later open reuses the shell PATH

Status: implemented

## Problem

Every Dock open waited on an interactive login shell before the sidecar started. On this machine that shell takes about three seconds, mostly `nvm.sh` and sdkman. Skipping Oh My Zsh does not remove that cost, and those lines are how the terminal finds Node. The splash also stayed on one fixed label for the whole wait.

## Decision

The launcher writes the shell PATH to `shell-path.json` in the runtime root. A later open uses it when that PATH still contains a Node executable, and starts the sidecar without asking the shell. A background refresh writes a newer PATH for the next open. It does not restart the sidecar already running. The splash text names the step: checking the runtime, starting the platform, or installing an update.

## Alternatives considered

- Restart the sidecar when the background shell names a different Node. Lost: a version switch is rare, and a restart flashes a window that has already opened.
- Skip Oh My Zsh and keep asking the shell every open. Lost: the remaining `nvm.sh` cost is still on the splash.

## Consequences

The first open, and an open whose remembered Node is gone, still waits for the shell. The window binary has to be replaced for the splash and the cache to apply.
