# Agent Note: One unix sidecar launcher

Status: implemented

Superseded for the packaged executable by [Tauri supervises the sidecar](../architecture/2026-09-27-tauri-supervises-sidecar.md). `unix-sidecar.sh` is no longer the app executable.

## Problem

`pnpm dist:app` copied `scripts/build/macos-launcher.sh` into `Contents/MacOS/Mohou`. `pnpm dist:local` wrote a second launcher as a string array inside `scripts/local-app/index.mjs`, and `Info.plist` was another string inside `scripts/build/app.mjs`. The two launchers had already drifted: only the app copy loaded the login-shell `PATH`. The install prefix also repeated the publishable package list by hand.

## Decision

`scripts/build/unix-sidecar.sh` is the unix launcher for both layouts. When its directory is `Contents/MacOS`, it uses `../Resources`, `~/.mini-app/runtime`, and the login-shell `PATH`. Otherwise it uses the directory that contains `prefix/` and that directory's `runtime/`, and it keeps the caller `PATH`. `scripts/build/sidecar.cmd` is the Windows local-app launcher. `scripts/build/macos-Info.plist` holds the bundle keys; the pack step fills `__VERSION__`. Prefix `file:` dependencies are the publishable workspace packages, named the way `pnpm pack` names them. The Finder AppleScript that places the DMG window stays in the pack script: it runs against the mounted volume.

## Alternatives considered

- Keep generating the local `run` script from JavaScript. Lost: the drift already dropped login `PATH` from one copy, and the script was not a file you could read on its own.
- Invert the bundle so the Tauri binary is `CFBundleExecutable` and Node is its child. Lost here: that replaces the launcher protocol. System Node, the login `PATH`, and exit 75 staying outside Node are why the executable is still the shell script.

## Consequences

A launcher fix lands in one shell file. `pnpm dist:app` is still macOS-only. The DMG layout script remains inline because Finder has to position a live volume.
