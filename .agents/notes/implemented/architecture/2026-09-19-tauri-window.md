# Agent Note: The panel window is Tauri

Status: implemented

## Problem

Shell opened the loopback origin in the system browser. Closing that tab left Host running, and the page was an ordinary browser tab.

## Decision

The window is the Tauri binary `mini-app-window` in `packages/shell/src-tauri`. Shell still constructs Host, then spawns that binary with the loopback origin. `admitWindowOrigin` and the binary both refuse a non-http URL, a non-loopback host, and a path. The page gets no Tauri commands. `pnpm dev:host` waits for the window to exit, then disposes Host. A missing binary names `pnpm build:window` and does not spawn. macOS and Windows use the same binary; Windows adds `.exe`.

## Alternatives considered

- Keep `open` and `cmd /c start`. Lost because that is a browser tab, not the product window.
- Make the window its own package. Lost because it is Shell's composition. Host still does not know about it.
- Give the panel Tauri IPC. Lost because the panel already calls Host over HTTP. A second channel would split the owner surface.

## Consequences

`pnpm build:window` must run before `pnpm dev:host` on a new machine. The contained webview stays deferred. The binary does not add it.
