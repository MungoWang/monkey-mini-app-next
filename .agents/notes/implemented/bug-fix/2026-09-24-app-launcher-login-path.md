# Agent Note: App launcher imports login-shell PATH

Status: implemented

## Problem

Workbench GitHub PRs showed an empty list in the installed app. `com.pwang.desk` runs `gh search prs` through `ctx.bash`. Finder starts Mohou with `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, so `gh` (Homebrew) is missing. The desk command ends with `2>/dev/null || echo "[]"`, so a missing binary becomes "没有打开的 PR". The earlier launcher only prepended the Node bin directory.

## Decision

Before starting the sidecar, the macOS launcher replaces a bare GUI `PATH` with the user's login-shell `PATH` (`zsh -lc` / `bash -lc`), then prepends the resolved Node bin directory. If the login shell yields nothing, it falls back to Homebrew and common user bin dirs. bash/pwsh and stdio MCP still inherit this process env after the existing credential scrub (`KEY|SECRET|TOKEN|PASSWORD`).

## Alternatives considered

- Run every `ctx.bash` as `bash -lc`. Loads profile on each call, slower, and can re-run interactive hooks. Rejected.
- Pass through `GH_TOKEN` and other token env vars. Rejected: spawned commands must not inherit credential-shaped names; `gh` already uses the keyring when the binary is on `PATH`.
- Hardcode only `/opt/homebrew/bin`. Helps `gh` on this machine, misses uvx/cargo/nvm shims elsewhere. Kept as the no-login fallback only.

## Consequences

GUI launch cost includes one login-shell PATH probe. A broken `~/.zshrc` that prints to stdout can pollute `PATH`; the probe discards stderr only. Token env vars remain scrubbed; tools must use OS credential stores or explicit app config.
