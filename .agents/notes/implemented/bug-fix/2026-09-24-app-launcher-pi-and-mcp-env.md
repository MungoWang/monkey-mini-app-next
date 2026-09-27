# Agent Note: App launcher resolves Pi peers and system CA

Status: implemented

## Problem

Installed Mohou.app only showed Echo. `host.json` asked for Pi, but `probePiRuntime` could not `import('@earendil-works/pi-coding-agent')` from the app prefix: the package is a global optional peer and ESM does not use `NODE_PATH`. Settings MCP "试连接" printed `fetch failed` for HTTPS servers because Finder launches Node without the shell's `NODE_USE_SYSTEM_CA`, so a private CA fails as self-signed. Stdio MCP commands such as `npx` also missed the Node bin directory on Finder's bare `PATH`.

## Decision

The macOS app launcher (and the local-app `run` script) puts the resolved Node's bin directory first on `PATH`, sets `NODE_USE_SYSTEM_CA=1` when unset, and symlinks `@earendil-works/pi-coding-agent` and `@earendil-works/pi-ai` from that Node's global `lib/node_modules` (including the nested install under the agent package) into the prefix. Missing globals leave Echo only. A stale symlink is removed when the global package is gone.

## Alternatives considered

- Bundle Pi inside the app again. Rejected: size and a second copy of the user's agent.
- Hand-scan `~/.pi` for the package. Rejected: locked "ordinary environment resolution" for the optional peer.
- Rely on `NODE_PATH` alone. Rejected: ESM dynamic `import` does not resolve it.
- Set `NODE_TLS_REJECT_UNAUTHORIZED=0`. Rejected: disables verification entirely; the system trust store is enough for corp CAs.

## Consequences

A machine without a global Pi install still boots on Echo. HTTPS MCP that needs a private CA must be present in the macOS keychain. Windows `run.cmd` only sets `NODE_USE_SYSTEM_CA` for now; Pi linking there is still open if a Windows ship path needs it.
