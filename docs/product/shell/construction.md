---
status: shape-locked
progress: settled
updated: 2026-09-28
---

# Construction

Layer: [Shell](README.md). Index: [features.md](../features.md).

- Owner: Shell.
- Input: the runtime root (default `~/.mini-app/runtime`), an optional port override, and the set of runtime providers Shell knows how to construct. `echo` is always in that set.
- Order: resolve the root; bootstrap `host.json` when missing; refuse a present corrupt file; construct the selected runtime provider; inject it into Host capabilities together with platform bash, push, MCP client, credentials, and config; start Host HTTP; open the panel against that origin.
- Output: one Host, one panel window, one authoring token at `authoring.token` (created if missing, not world-readable, not inside `host.json`).
- Credentials: Shell passes source specs into one read provider. The default entry is the credentials file in the mini-app home. A missing file is an empty list. Another source is another entry, with its own target. The panel cannot edit it. Writes stay on the source, not on the provider Host sees.
- Window: the Tauri binary from **`packages/launcher/tauri`**, not from the shell npm package. It exposes no Tauri commands to the page. `pnpm dev:host` passes the loopback origin; the binary refuses any other URL. The macOS app executable is that binary. Windows `run.cmd` execs `Mohou.exe`. A release zip places that executable beside `Resources/prefix`, so runtime data uses the user profile, as the macOS app does. A local prefix beside the executable stays the local-app layout. It spawns the shell sidecar, reads the loopback origin the sidecar prints, and opens that origin. Sidecar exit 75 starts the sidecar again and keeps the window. On both platforms it links the Pi peers from that Node's global modules into the prefix. Windows uses a directory junction, not an administrator symlink. Windows global modules are the directory beside `node.exe`, `lib/node_modules`, and `%AppData%\npm\node_modules`. nvm-windows version directories are candidates the same way nvm is on macOS.
- Failure: bad config, unknown provider id, provider `start` failure, or a missing window binary exits non-zero and prints the message. Shell does not start a half-configured Host. Port in use fails start with that message. A missing binary names `pnpm build:window`.
- Non-goals: Panel calling the constructor; Host choosing the provider implementation; embedding this platform inside another agent product; packing Tauri sources inside `@mini-app/shell`.

## Implementation


Role: composition. `bootHost` resolves the root, bootstraps or refuses config, constructs `echo` and Pi, and injects both. It injects the file credential provider, the Pi `mcp-adapter.json` import path, the writing-skill dest table, and the authoring-MCP dest table, then starts Host. The Pi dest names the `pi-mcp-adapter` extension. A failed start disposes the session. `openPanelWindow` spawns `mini-app-window` from `packages/launcher/tauri/target`, release before debug, with the loopback origin. macOS and Windows use that binary; Windows adds `.exe`. `admitWindowOrigin` rejects a non-http URL, a non-loopback host, and a path. A missing binary throws before spawn. `pnpm dev:host` spawns the window and disposes the live host when that window exits, and on `SIGINT` or `SIGTERM`. A dev restart exits 75 and leaves that window running; the next sidecar reads `panel-window.pid` in the runtime root and disposes when that window exits. The packaged macOS executable, and the Windows local `Mohou.exe`, are that Tauri binary. It sets `MINI_APP_SUPERVISED=1`, spawns `node --import tsx` on the packaged shell entry, and opens the origin that entry prints. Sidecar exit 75 starts that process again. Closing the window signals the sidecar and the binary exits. Pi peers are linked before the spawn: a symlink on macOS, a directory junction on Windows. `MINI_APP_RUNTIME` and `MINI_APP_HOST_PORT`, when set, choose the root and the port. `MINI_APP_PANEL`, when set, is the directory of `panel.html` and `panel.js`. `MINI_APP_WINDOW`, when set, is the window binary. They are not locked. The default root is `defaultRuntimeRoot`. The credentials file is `homeCredentialsPath`. The authoring token is created if missing and is not a field of `host.json`. Plan: [implementation.md](../implementation.md).
