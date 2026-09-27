# Agent Note: Loopback HTTP and Tailwind sheets

Status: implemented

## Problem

Author, owner, and iframe calls existed in-process while product pages still said HTTP was not mounted. App class names had no compiler. A host-local `kit-entry.ts` of unstyled `box()` exports pretended to be the UI kit.

## Decision

`startAuthorHttp` binds 127.0.0.1 with Hono. Author, owner, and iframe are separate mounts. Path strings come from `httpLayout`. Tailwind compiles each app sheet; Host does not parse `className`. `@theme` only connects `themeTokens` to `--color-*`. The author's `ui.css` is appended unchanged.

`POST /mcp` with `Accept` that includes `application/json` is stateless. `Accept: text/event-stream` only opens a session and returns `mcp-session-id`. Later GET, POST, and DELETE reuse that header. GET and DELETE without a live session are 404.

There is no `@mini-app/ui` package yet and no host-written kit. `/mma/sdk.js` is reserved. The kit specifier is not an allowlist row.

## Alternatives considered

- Host-scanned className maps such as `.flex` and `.bg-primary/60`. Lost because that is hidden behavior; Tailwind's compiler is the class language.
- A fake kit in `packages/host/src/compile/kit-entry.ts`. Lost because unstyled boxes are worse than no kit. The real kit is a later package port, not a rewrite inside Host.
- Copying the old `packages/ui` stylesheet and `popover` / `sidebar` / `chart-*` tokens into `themeTokens`. Lost because those names are shadcn surface slots, not this product's theme contract.

## Consequences

Panel talks to Host only over HTTP. An iframe loads runtime, lodash, and motion vendor files. App sheets include Tailwind utilities used in that app. A later kit package is vendor-built like lodash, and Tailwind `@source` will scan its source so kit classes appear. Overlay and chart classes in that port map onto existing tokens (`card`, `background`, `primary`), not extra theme names.
