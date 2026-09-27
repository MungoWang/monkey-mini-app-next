---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# HTTP surface

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host. Panel and the iframe are clients. Shell publishes the origin.
- Loopback only. A non-loopback caller is refused.
- App and panel data routes carry no token. Authoring routes require the authoring token.
- The path strings in the table are locked and mounted on the loopback listener Host starts.

| Route | Client | Result |
| --- | --- | --- |
| `GET /api/apps` | Panel | app list, including pin, local palette summary, version, acronym, `tags` when set, and `createdAt` / `updatedAt` when a commit exists |
| `GET /api/activity` | Panel | `activity.json`. A missing file is no activity. A bad file is `activity-invalid` and is not an empty document. |
| `POST /api/apps/:appId/open` | Panel | same operation as `mini_app_open` |
| `POST /api/apps/:appId/reload` | Panel | refetch event; does not compile |
| `GET /api/trash` | Panel | newest trashed copy per id, with the same app fields as the list |
| `POST /api/trash/:appId/restore` | Panel | restores that copy |
| `DELETE /api/app/:appId` | Panel | app moved to trash |
| `GET /` | Panel | panel document, when Shell attached one |
| `GET /panel.js` | Panel | panel script, when Shell attached one |
| `GET /api/events` | Panel, Shell | host stream, plus every app's author events. The panel does not open a stream per tab |
| `GET /api/app/:appId/events` | iframe | one app's author stream. The panel does not use this for an open tab |
| `POST /api/call` | iframe, authoring tool | `{ ok, value }` or `{ ok: false, error }`. `Accept: text/event-stream` writes each method yield as `{ value }`, then `{ return }` or `{ error }` |
| `GET /api/host-config` | Panel | public config fields |
| `POST /api/host-config` | Panel | writes a valid config, or 400 with the field error |
| `GET /api/palettes` | Panel | custom palettes plus `ignored[]` |
| `GET /api/apps/:appId/history` | Panel | commit list, limit default 50, max 200 |
| `GET /api/apps/:appId/history/:commitId` | Panel | message, time, files, per-file add/del and preview |
| `GET /api/apps/:appId/storage` | Panel | file size, table names, size notices |
| `GET /api/apps/:appId/storage/:table` | Panel | exported rows of that table |
| `POST /api/apps/:appId/storage/restore` | Panel | restores the storage backup |
| `GET /api/apps/:appId/theme` | Panel | current pin |
| `POST /api/apps/:appId/theme` | Panel | saves or clears the pin |
| `GET /api/about` | Panel | process name, environment, package versions, and the authoring MCP url plus token |
| `GET /api/updates` | Panel | `{ name, current, latest, updateAvailable, error? }` |
| `GET /api/runtime-providers` | Panel | registered providers and their settings fields |
| `POST /api/runtime-providers/activate` | Panel | writes the selection; `{ restartRequired: true }` |
| `POST /api/runtime-providers/probe` | Panel | one tiny completion against the selected provider; does not switch the live brain |
| `POST /api/restart` | Panel | Shell recycles the host process; the written runtime becomes live |
| `GET /api/author-skill` | Panel | writing skill dests, source `version`, and per-copy `version` / `updateAvailable` |
| `POST /api/author-skill` | Panel | copy the writing skill into the selected assistant and custom dirs |
| `POST /api/author-skill/reveal` | Panel | open one installed skill folder |
| `GET /api/author-mcp` | Panel | assistant MCP files and whether `mini-app` is current |
| `POST /api/author-mcp` | Panel | merge the authoring server into the selected assistant files |
| `POST /api/author-mcp/reveal` | Panel | open one assistant MCP file |
| `GET /api/mcp-servers` | Panel | servers in `mcp.json` |
| `POST /api/mcp-servers` | Panel | replace `mcp.json` |
| `POST /api/mcp-servers/check` | Panel | start one server and list tools; does not write |
| `POST /api/mcp-servers/admit` | Panel | parse pasted text into server drafts |
| `GET /api/mcp-servers/import/:source` | Panel | read one import file Shell named |
| `GET /api/tools` | authoring client | authoring tool names and input schemas |
| `POST /api/tools/invoke` | authoring client | tool result, or an error that matches the tool's failure |
| `POST /mcp` | authoring MCP client | authoring tools only; JSON `Accept` is stateless; SSE-only `Accept` opens a session; `GET` and `DELETE` reuse or 404 |
| `GET /app/:appId` | iframe navigation | runner document; it does not include the UI bundle; query carries `theme` and `palette` only |
| `GET /mma/runtime.js` | iframe | React |
| `GET /mma/sdk.js` | iframe | UI kit and `useApp` |
| `GET /mma/vendors/:id.js` | iframe | one allowlisted vendor; unknown id is 404 |
| `GET /api/app/:appId/ui.css` | iframe | Tailwind's sheet for that app, then the author's `ui.css` if present |
| `GET /api/app/:appId/ui/entry.js` | iframe | compiled UI |
| `GET /api/app/:appId/assets/*` | iframe | a file under that app's `assets/`; missing or escaped path is 404 |
| `POST /api/app/:appId/errors` | iframe | always 204 |
| `GET /api/app/:appId/errors` | authoring tool | retained errors |
| `POST /api/app/:appId/alive` | iframe | always 204 |
| `POST /api/app/:appId/view/eval` | iframe | always 204 |

- Failure: invalid JSON on `POST /api/call` is `{ ok: false, error: "invalid json" }`. A missing method is `{ ok: false, error: "missing appId or method" }`. Those two failures stay JSON even when the client asked for a stream. A method failure on a stream is `{ error }` and then the response ends. Host-unreachable is the client's error to show. Diagnostic posts never return an error status.
- A stream response is one `POST`. Parallel `streamCall`s are parallel responses. A yield is not the method return. The return is the `{ return }` frame, and the UI promise resolves to it. It is not a yielded event.
- Non-goals: a remote multi-user API; panel routes that import Host code; serving a directory listing of vendors.

## Implementation


Role: provider of the loopback surface, consumer of nothing in Panel. Authoring routes require the token. App and panel data routes do not. `GET /api/app/:appId/errors` is an authoring read and requires the token. The server library is Hono on a loopback Node listener. `Accept: text/event-stream` on `POST /api/call` writes method yields, then the return value. A plain call stays JSON. Author, owner, and iframe routes are separate mounts. History list limits are host policy in `historyListBound`. `POST /api/apps/:appId/storage/restore` is owner `restoreStorage`. Tailwind compiles the classes. Host does not. The kit file is `/mma/sdk.js`. The kit specifier is `@mini-app/ui`. Plan: [implementation.md](../implementation.md).
