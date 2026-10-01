---
status: locked
updated: 2026-10-01
---

# Launcher

Group directory (no `package.json`). GUI launchers live here. Composition stays in `@mohou/shell`.

| Path | Role |
| --- | --- |
| `tauri/` | First panel window (Tauri). Binary name `mini-app-window`. Shell opens it with the loopback origin, or a future process entry spawns shell as a sidecar then this window. |

Build: `pnpm build:window` → `packages/launcher/tauri/target/{debug,release}/mini-app-window`.
