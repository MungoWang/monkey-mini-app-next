# Agent Note: Release bundles are built in GitHub Actions

Status: implemented

## Problem

`pnpm dist:app` only produced a macOS `.app` on the machine that ran it. A Windows zip did not exist, and there was no runner that built Apple silicon and Windows x64 bundles as the files a release would ship.

## Decision

`pnpm dist:app:local` and `pnpm dist:app:release` write the same unsigned bundle. Local installs the prefix from `artifacts/npm` tarballs, copies them to `~/.mini-app/packages`, and stamps that directory as `mohou.tarballDir`. A tarball install checks that directory. A registry install checks the npm registry. Confirming an update writes `update.json` and exits 75. The launcher runs that npm install before it starts the sidecar again. Release installs `@mini-app/shell` from the npm registry and stamps `registry`. macOS keeps `Mohou.app`, a zip, and a dmg, named `macOS-<arch>`. Windows writes `Mohou.exe` beside `Resources/prefix` and zips that folder as `windows-<arch>`. That `Resources` parent is what sends runtime data to the user profile, the same place as the macOS app. `.github/workflows/release.yml` runs the registry command on `macos-14` and `windows-latest`. The tag must equal the shell version, and that version must already be published. The tag run attaches the zip and dmg to the GitHub Release.

## Alternatives considered

- Cross-compile both bundles on one Mac. Lost: the Windows Tauri binary and its native modules have to be built on Windows.
- A signed notarized installer. Lost: that installer is still not specified, and these bundles stay unsigned.
- Run the bundle build on every pull request. Lost: the prefix install and release window build are too slow for the check workflow.

## Consequences

A dispatch produces downloadable artifacts and does not publish a Release. A tag `v1.0.0` publishes when the shell version is `1.0.0`. Finder layout of the dmg is skipped when `CI` is set. A Windows machine pass of the running app is still not this workflow.
