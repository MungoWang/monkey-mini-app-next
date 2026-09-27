# Agent Note: npm publish set

Status: implemented

## Problem

Every workspace package was `private`, so a later `npm publish` would skip it. The entries pointed at TypeScript source, and a pack of `@mini-app/shell` would have included the Tauri `target` directory.

## Decision

The nine packages under `packages/` are the publish set. `@mini-app/root` stays private. Each package version is the `@mini-app/shell` version. `files` lists `src`, `lib/types`, and `README.md`. Shell also lists `src-tauri` and excludes `src-tauri/target`. `publishConfig.access` is `public`. `pnpm publish:check` generates types and packs into `artifacts/npm/`. It does not upload. `pnpm publish:packages` uploads only when `MINI_APP_PUBLISH=1`, the tree is clean, and `pnpm run check` has passed. `pnpm publish` rewrites `workspace:^`.

## Alternatives considered

- Leave `private: true` until the release hour. Lost because the publish command would skip the packages unless someone remembered to edit every file.
- Publish compiled JavaScript instead of `src`. Lost because this repo runs the TypeScript source, and a second build is not the package contract.
- Hard-code a registry URL. Lost because the machine that publishes chooses the registry. The script does not.

## Consequences

- `publish:check` can run at any time. Upload does not.
- A new workspace package joins the set. The checker rejects it until it matches these fields.
- `MINI_APP_NPM_ACCESS=restricted` selects a restricted upload. The default is `public`.
