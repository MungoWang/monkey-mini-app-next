# Agent Note: GitHub check

Status: implemented

## Problem

The repository had no remote and no CI. `pnpm run check` is the local gate. A push could land without that gate, and the entry tests need a built panel and the Tauri window binary, which a clean machine does not have.

## Decision

`.github/workflows/check.yml` runs on push and pull request, on `macos-latest`. It installs the pinned pnpm and Node 22, installs the stable Rust toolchain, then runs `pnpm build:panel`, `pnpm build:window`, and `pnpm run check`. [docs/development.md](../../../docs/development.md) names that workflow.

## Alternatives considered

- Ubuntu without the window binary. Lost: `windowBinaryName` throws on Linux, and the process-entry spec opens the real binary.
- Skip the window spec when `CI` is set. Lost: the real-entry tier would not run on the machine that is supposed to prove it.

## Consequences

The first push of this repository includes the workflow. A red run is a failed `pnpm run check` or a failed window build, not a missing job.
