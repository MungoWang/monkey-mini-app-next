# Agent Note: npm scope @mohou

Status: implemented

## Problem

The publish set was named `@mini-app/*`. That scope is registered on the npm registry to an owner this account cannot write, and a `PUT` of a package answers `404 Not found`. Nothing had been published under it, so the names were still free to change.

## Decision

The npm scope is `@mohou`. The ten publishable packages, `@mohou/root`, and `@mohou/templates` carry it. A tarball name follows its package name, so `newestTarball` matches `mohou-<slug>-<version>.tgz` and the pack check in [scripts/publish/packages.mjs](../../../../scripts/publish/packages.mjs) requires `mohou-shell-`. [Package architecture](../../../docs/architecture/packages.md) owns the set.

## Alternatives considered

- Keep `@mini-app` and dispute the scope with npm Support. Lost because the release would wait on a third party with no deadline.
- Unscoped `mini-app-*` names. Lost because `mini-app-ui` is already taken, so the set could not stay uniform.
- The scopes this account already owns, `@monkey-harness` and `@mungowang`. Lost because they name another product line and a person, not this product.
- A private registry. Lost because the release channel installs `@mohou/shell` from the public registry.

## Consequences

- Every import specifier, workspace path, tarball name, and document reference moves with the scope.
- An install prefix packed before this change holds `mini-app-*.tgz`. `newestTarball` no longer sees those files, so a local tarball channel is rebuilt once after the rename.
