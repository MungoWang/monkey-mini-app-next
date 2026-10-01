# Agent Note: Shell is an npm sidecar; Tauri is only a launcher

Status: proposed

**Done in tree:** Tauri crate moved to `packages/launcher/tauri`; `@mohou/shell` no longer packs `src-tauri`. **Still open:** launcher process as parent that only spawns shell sidecar (dev entry may still be shell opening the window). Skill-in-shell: [update loops](./2026-09-23-update-loops.md). Pre-1.0 skill UX: [author skill note](../feature/2026-09-23-author-skill-pre-one-oh.md).

## Problem

`@mohou/shell` today mixes two jobs in one tree:

1. **Composition** — construct Host, inject brains and credentials, attach the panel document, serve the product over loopback.
2. **GUI launcher** — the Tauri crate under `packages/shell/src-tauri`, spawned as the panel window.

That coupling teaches the wrong update story: a window binary rebuild looks required for Host/panel/authoring changes, and the local artifact still assumes a checkout. It also blocks swapping the window stack (Electron, Wails, or another embedder) without touching composition.

## Proposal

### Cut

| Piece | What it is | Update unit |
| --- | --- | --- |
| **Shell launcher** | Thin native (or desktop) host: start/stop the shell **sidecar**, open a webview at the sidecar’s loopback origin, enforce origin/navigation policy for that window. **First implementation: Tauri.** Later: Electron, Wails, or others may replace it without changing Shell npm. | Rare. New launcher build only when spawn/webview/navigation/launcher UX changes. |
| **`@mohou/shell` (npm)** | The **sidecar** Node process. Sole composition root: constructs Host, injects runtime providers, panel bytes (or path), skill source layout, authoring MCP dests; listens on loopback. **No Tauri crate inside this package.** | Normal product updates. |
| **`@mohou/host` and other workspace deps** | Libraries the shell package depends on. | Move with shell’s dependency range when shell is updated. |

```text
┌─ Shell launcher (Tauri today; Electron/Wails later) ─┐
│  spawn/keep sidecar · open webview · window policy     │
└──────────────────────┬────────────────────────────────┘
                       │ child process (sidecar)
                       ▼
┌─ @mohou/shell (npm) ────────────────────────────────┐
│  boot · createHost · panel · skill source · MCP dests  │
│  http://127.0.0.1:<port>/                              │
└──────────────────────┬────────────────────────────────┘
                       │ import
                       ▼
              @mohou/host (+ contract, ui, …)
```

### Consequences for layout

- **Shipped path:** `packages/launcher/tauri` holds the window crate. Shell npm `files` must not ship a Tauri tree (enforced in `publish:check`).
- Shell exposes a **stable process entry** the launcher can spawn. Composition stays in shell; the launcher does not `createHost`.
- Panel document build may stay a shell (or panel) concern served by the sidecar.
- Skill **source** is resolved from the shell package (`skill/monkey-mini-app`), not beside the Tauri tree.

### On-the-fly shell update (Settings)

Once the launcher runs a sidecar from an npm-installable prefix:

1. Settings **check for updates** against the registry for the installed `@mohou/shell`.
2. Settings **Update** runs the package manager update in that prefix (conceptually `npm update` / `npm install @mohou/shell@…`).
3. Relaunch or hot-restart the **sidecar**; reload the webview to the new origin/port as needed.
4. Host, panel bundle, authoring tools, and **skill source inside the shell package** come along. Skill `version` equals shell `version` ([update loops](./2026-09-23-update-loops.md)).

A new **launcher** build is **not** required for ordinary shell/host/panel/skill-source bumps.

Replacing the `@mohou/host` directory on update drops a previous on-disk `vendor/` folder under that package; Host start rebuilds vendor when those files are missing. That is enough for tarball replace installs.

Failure and UX details (rollback, mid-update crash, Windows file locks, permission to write the prefix) are not locked here.

### Skill inside shell

Decided: skill tree ships **inside** `@mohou/shell` (`skill/monkey-mini-app`), not a second npm package. K≡S via sync script. Details: [update loops](./2026-09-23-update-loops.md).

### What this is not

- Not “Host npm updates while Shell stays an in-process library of the window.” The updatable sidecar unit is **shell**.
- Not requiring Electron/Wails in 1.0. Tauri remains the first launcher.
- Not auto-implementing Settings update UI in this note—only the architecture that makes that button meaningful.
- Not changing the three product surfaces (owner / author / app). Only process and package cut.

## Alternatives considered

- **Keep Tauri inside `@mohou/shell` and version everything with the window.** Lost: forces a native rebuild for composition-only changes and blocks other launchers.
- **Sidecar is `@mohou/host` only; shell stays the launcher.** Lost: today’s composition (brains, panel attach, skill/MCP dest injection) lives in shell. Host is not the process entry. Elevating host to full composition would rename the problem, not simplify it.
- **Single fixed install: always rebuild a fat artifact with Node+window+modules.** Lost as the *only* model: valid for a first offline pack, but does not explain Settings `npm update` of composition. Fat pack may still *seed* the prefix; updates then target shell npm.
- **Lockstep publish of all `@mohou/*` forever.** Lost as a hard rule for runtime updates. Publish may still release sets together; the launcher must be allowed to run a newer shell than its own build number.

## Acceptance criteria

- `@mohou/shell` package contents have **no** `src-tauri` (or successor launcher tree).
- A documented launcher (Tauri first) spawns shell as a **child** and opens only that child’s loopback origin.
- Shell can be installed/updated via npm into a prefix the launcher is configured to run, without rebuilding the launcher binary.
- Product docs (`packages.md`, construction, blueprint packaging bullets) describe launcher vs shell sidecar; the old “window binary lives in shell package” sentence is removed or marked historical.
- Settings update design can call “update shell package + restart sidecar” without implying a new Tauri download for composition changes.

## Risks

- Native addons under shell’s tree (`better-sqlite3`, oxide, esbuild) must install cleanly on the user’s OS/arch during update; a failed update needs a clear Settings error.
- Windows may lock files while the sidecar runs; update likely requires stop → update → start.
- Launcher and shell protocol (how port is discovered, ready signal, crash restart) must be small and stable or every launcher fork breaks.
- Skill/Panel install paths break if they still assume monorepo-relative shell paths after the split.
