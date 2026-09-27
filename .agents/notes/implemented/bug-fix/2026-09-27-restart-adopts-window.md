# Agent Note: Restarted sidecar adopts the panel window

Status: implemented

## Problem

Settings → Restart host disposes Host and exits the sidecar with code 75. The wrapper starts Node again with `MINI_APP_SKIP_WINDOW=1` so the existing Tauri window stays up. That relaunch only listened for `SIGINT` and `SIGTERM`. The window is not a child of the new process, so closing it left the sidecar running and the app looked quit while Node still held the port.

## Decision

The launch that opens the window writes `panel-window.pid` in the runtime root (mode `0600`). Exit 75 leaves the file and the window. The next sidecar reads that pid, polls until the process is gone, then disposes Host and exits 0. `SIGINT` and `SIGTERM` still dispose. A missing or dead pid exits 0 immediately. The wrapper removes the file on a normal window exit. `MINI_APP_WINDOW_PID_FILE`, when set, replaces that path.

## Alternatives considered

- Make the Tauri binary the parent and spawn Node as its child. Lost for this fix: port discovery, login `PATH`, and the exit-75 loop would move into Rust. The window would still need a way to outlive a Node restart.
- Restart Host inside the same Node process. Lost: the restart exists to drop native handles and child MCP processes. The wrapper already owns that clean start.
- Detach the window on every spawn. Lost: a crashed sidecar would leave the window up with nothing waiting to exit when it closes.

## Consequences

`pnpm dev:host` and the macOS app launcher share this adopt path. Closing the window after a host restart disposes the new sidecar. A pid reused by an unrelated process in that short gap can be treated as the window; the file is removed when the sidecar stops.
