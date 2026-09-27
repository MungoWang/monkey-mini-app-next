# Agent Note: The returned host is the live one

Status: implemented

## Problem

`bootHost` returned the first session. Restart disposed that object and started another, stored only in the closure. Window exit disposed the returned session. After a restart, the live host stayed up. `SIGINT` disposed nothing.

## Decision

`bootHost` returns a handle whose methods call the session that is running now. Restart disposes the current session, starts the next one, and the handle follows it. `pnpm dev:host` disposes that handle when the window exits and on `SIGINT` or `SIGTERM`. A signal kills the window first. A second drain does not dispose twice.

## Alternatives considered

- Restart in place inside one session object. Lost because `createHost` already builds the listener, the brain, and the child ports. Rebuilding them is the recycle the owner surface describes.
- Leave Ctrl-C to the operating system. Lost because SQLite and child processes would not be disposed.

## Consequences

A caller that keeps `host.author` from before restart is holding the disposed session. The handle's `author` is the live one. `MINI_APP_RUNTIME` and `MINI_APP_HOST_PORT` select the process entry's root and port. They are not locked product fields.
