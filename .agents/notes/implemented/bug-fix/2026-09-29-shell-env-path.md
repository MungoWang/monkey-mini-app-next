# Agent Note: Shell PATH for the Dock launch

Status: implemented

## Problem

A Dock launch does not read `.zshrc` or `.bashrc`. `zsh -lc` is a login shell and still skips those files, so nvm, fnm, volta, and asdf never join `PATH`. The launcher then used Homebrew's Node. That Node times out talking to the local calendar MCP. Walking `~/.nvm` fixes one installer and misses the next.

## Decision

On macOS and Linux the launcher asks the user's shell with `-ilc` and `command env`, between a marker, and uses that `PATH`. Node and npm are the first executables on it, the same lookup as `command -v`. Pi peers come from `npm root -g` on that same PATH. Windows keeps the process environment. The shell call gives up after 8 seconds. Oh My Zsh auto-update and its tmux autostart are turned off for that call.

## Alternatives considered

- Hardcode `~/.nvm/versions/node/v22/bin/node`. Lost: fnm, volta, asdf, and a direct install do not live there.
- Depend on the `shell-env` npm package inside the window binary. Lost: the launcher is Rust. The package is the same `-ilc` plus `command env` call, which is what we run.
- Keep preferring whichever Node has Pi. Lost: that is not the Node the terminal would run.

## Consequences

A machine whose terminal `node` is nvm 22 boots that Node from the Dock. [Launcher prefers a Node that has Pi](2026-09-28-launcher-prefers-node-with-pi.md) no longer overrides the shell. The window binary has to be replaced.
