# Agent Note: UI kit is its own package

Status: implemented

## Problem

Host must not write kit components. A host-local `box()` file is not a kit. Copying the old kit stylesheet would also copy `popover` / `sidebar` / `chart-*` into the theme contract.

## Decision

`@mohou/ui` lives at `packages/app/ui`. It is the old kit source, with package names rewritten and overlay/chart/sidebar classes mapped onto existing `themeTokens`. Host vendor-builds that package into `/mma/sdk.js` like lodash, with `react` and `motion` external. Tailwind `@source` scans the kit source so those classes appear in the app sheet. `useApp` reads the host wrapper. The kit does not fill theme values.

## Alternatives considered

- Rewrite the catalog as unstyled host boxes. Lost because that is a fake kit.
- Add `popover`, `sidebar`, and `chart-*` to `themeTokens`. Lost because those names are shadcn surface slots, not this product's theme contract.
- Ship the old `globals.css` defaults. Lost because theme files own the values.

## Consequences

Authors import `@mohou/ui`. Adding a kit dependency is a kit `package.json` change, not a host rewrite. A missing optional theme token still omits that colour; kit classes that need `card` or `primary` follow the palette file.

`pnpm run typecheck` covers the kit. oxlint and coverage exclude `packages/app/ui` until those files are brought onto the repo rules without dropping the catalog.
