# Agent Note: Tauri supervises the sidecar

Status: implemented

## Problem

`Mohou.app` used a shell script as `CFBundleExecutable`. That script found Node, then Node spawned the Tauri window. Exit 75 restarted Node from the script so the window could outlive it. The window process was not the app the Dock and the bundle describe, and closing it after a restart depended on a pid file the new Node had to adopt. A shell script is a fragile macOS executable.

## Decision

The Tauri binary is `Contents/MacOS/Mohou`. With no origin argument, and with `Contents/Resources/prefix` present, it is the parent: it resolves Node and the login-shell `PATH`, links the Pi peers, and spawns `node --import tsx` on the packaged shell entry with `MINI_APP_SUPERVISED=1`. The sidecar prints `http://127.0.0.1:<port>`. The binary opens that origin. Sidecar exit 75 starts it again and navigates the same window. Any other exit, or closing the window, signals the sidecar process group and the binary exits. `pnpm dev:host` still passes an origin and stays the child window. A local prefix uses the same binary: `run` execs `Mohou` beside `prefix/`.

## Alternatives considered

- Keep the shell script as the executable and only document it. Lost: the user asked for the normal parent. A script executable does not own the window, the Dock identity, or the sidecar lifetime.
- Make Node the parent inside the Tauri process via a plugin. Lost: the product sidecar is a separate Node so the shell package can update without a new binary. The binary only supervises it.

## Consequences

`pnpm dev:host` is unchanged aside from honoring `MINI_APP_SUPERVISED`. The packaged app no longer copies `unix-sidecar.sh` into `Contents/MacOS`. Windows `run.cmd` still starts Node directly. A sidecar that exits because of a signal does not restart.
