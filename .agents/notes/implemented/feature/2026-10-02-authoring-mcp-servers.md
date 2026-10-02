# Agent Note: the authoring surface adds and removes MCP servers

Status: implemented

## Problem

A server reached Mohou only by typing a row into Settings → MCP. The authoring surface could read servers (`mini_app_mcp_list`, `mini_app_mcp_tools`) but not change them, so an agent had to hand the user a form to fill in. A changed file also reached the running host only at the next start, because `McpClient` copied the resolved specs in its constructor: the panel had the same limit.

## Decision

`mini_app_mcp_add` and `mini_app_mcp_remove` are authoring tools, and the ability to change the set lives in `@mohou/mcp-client`. `McpClient.setServers(specs)` replaces the resolved set while running: it retires the session of every id that was removed or whose spec changed, keeps the session of an id that did not change, and switches the set before closing anything so a call that starts during the swap already sees the new set.

The host keeps the file, because the path is host policy (`runtimeRoot`, `MINI_APP_MCP_CONFIG`), which is what [server-config.md](../../../../docs/product/mcp-client/server-config.md) already says. `writeMcpEditor` writes the rows and returns the specs it wrote; the caller hands those specs to the client, so the file and the live set come from one value and cannot disagree. That is also why the client exposes one `setServers` rather than separate add and remove methods: both callers derive the whole set from the file they are about to write, and add and remove are its two cases.

The tool opens a new row once as its check (`checkMcpEditor`) and refuses a row that failed unless `force` is true; a refused row touches neither the file nor the client. `check: false` skips the probe.

## Alternatives considered

- Keep the set fixed at construction and report `restartRequired`. Lost: a restart is a poor answer to "add this server", and the panel save needed the same fix.
- An `addServer` and a `removeServer` method on the client. Lost as redundant wrappers over the reconcile the file write already needs.
- Let the client own the file as well as the set. Lost because a path is a host fact; the client takes resolved specs, never a location.
- Inject the file operations into the tool layer as a named bag of closures. Lost: the file owner and the tools are directories of one package, so the bag was a second name for functions the tools may import, and a bag of abilities is not a `Port`.

## Consequences

- A server added by a tool or by a panel save is usable by `ctx.mcp` and by the authoring tools at once.
- A returned row masks the credential entries of `env` and `headers`, because a tool result travels back to the model. Detection is two signals, either enough: a whole name segment (`GITHUB_TOKEN`, `x-api-key`, `apiKey`, `DB_PASSWORD`) or a value shape (`Bearer …`, `sk-…`, `ghp_…`, a JWT, 32 hex characters or more). An ordinary setting keeps its value, so `NODE_ENV: production` stays readable. The masked form keeps a recognized label, because the label is what tells the caller what the value is: `Bearer ab*****gh`, `ghp_12*****90`. Both tables live in the client's `secrets.ts`, which is also what decides that the ambient environment handed to a child must not carry a name that merely *contains* `KEY`: that test stays broad because withholding one variable costs nothing, while a display test that broad would hide ordinary settings.
- A changed spec closes its session, so the next call spawns the new one; an unchanged spec keeps its child, so re-saving the same list does not restart every server.
- A call that races a replace can fail with `mcp-not-connected`, because the session it was opening belonged to the retired spec. `dispose` relies on the same generation check, so an open that finishes after `dispose` closes itself instead of leaking a child.
