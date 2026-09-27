---
status: implemented
---

# Vendor SDK must use automatic JSX

## Decision

`buildVendorFiles` always sets `jsx: 'automatic'`. `ensureVendorFiles` stamps `jsx-automatic-1` and rebuilds when the stamp is missing so installed trees do not keep a classic-JSX `sdk.js`.

## Why

Monorepo builds pick up `packages/app/ui/tsconfig.json` (`jsx: react-jsx`) via esbuild's config walk. A packed `@mini-app/ui` has no tsconfig, so esbuild defaulted to classic `React.createElement` without binding `React`. Iframe then threw `Can't find variable: React` (WebKit).

## Given up

Relying on ambient tsconfig next to the UI package for vendor transform.

## Coverage

- Stamp forces one rebuild of pre-fix local-app vendor dirs on next host start.
