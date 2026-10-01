---
status: implemented
---

# Host builtin themes must ship in the npm package

## Decision

`@mohou/host` `package.json` `files` includes `themes/`. Builtin palette CSS is part of the published package, not monorepo-only.

## Why

`builtinThemesDir()` resolves to `../../themes` beside `src/`. Monorepo `dev:host` finds `packages/host/themes`. A packed install under `node_modules/@mohou/host` had only `src` and no `themes`, so first paint returned empty style tokens and the panel looked unthemed (plain white).

## Given up

Nothing. Themes were always required at runtime; the pack list was incomplete.

## Coverage

- `scripts/publish/packages.mjs` fails publish:check when host omits `themes` or `theme-default.css`.
