---
status: implemented
---

# Host port: seed probe vs confirm on conflict

## Decision

Two paths, not silent rebind for an existing install:

1. **First boot** (`host.json` missing): `resolveHostConfig` probes from the seed preferred port and writes a free `hostPort` before anything external can pin MCP.
2. **Existing `host.json`**: `start` binds only that port. On `EADDRINUSE` it throws `PortInUseError` with `busyPort` and `suggestedPort`. Shell opens a blocking confirm page (or `portConflict: accept|quit` in tests). Accept writes the new port; quit leaves the file unchanged. MCP must be updated by the user after accept (same idea as settings port change).

## Why

A saved port may already be installed into assistant MCP configs. Auto-rewriting it makes MCP fail quietly. First-time seed has no such external pin, so probing there is safe and avoids local-app vs monorepo collisions on 9743.

## Given up

- Silent start-time rebind that always rewrites `host.json` (shipped briefly, then replaced).
- Treating a busy preferred port as a hard single-instance lock with no recovery UI.

## Coverage

- `packages/host/tests/policy.spec.ts` — seed walks off a busy preferred port.
- `packages/host/tests/session.spec.ts` — existing file keeps port; start throws `PortInUseError`.
- `packages/shell/tests/boot.spec.ts` — quit vs accept recovery.
- `packages/shell/tests/port-conflict.spec.ts` — confirm page HTTP accept.
