# Agent Note: Windows launcher links Pi peers

Status: implemented

Extends [Launcher prefers a Node that has Pi](./2026-09-28-launcher-prefers-node-with-pi.md).

## Problem

macOS Mohou resolves Node, links `@earendil-works/pi-coding-agent` and `pi-ai` into the prefix, and owns the window. Windows `run.cmd` started Node itself and never linked those peers. Windows global modules are not `lib/node_modules`, so a saved `runtimeProvider.id` of `pi` still failed boot.

## Decision

`run.cmd` execs `Mohou.exe` beside `prefix/`. The same supervisor prefers a Node whose global modules contain Pi, then links those peers. Windows roots are the directory beside `node.exe`, `lib/node_modules`, and `%AppData%\npm\node_modules`. nvm-windows version directories (`NVM_HOME`, `%AppData%\nvm`, `%ProgramFiles%\nvm`) are candidates, as nvm is on macOS. The link is a directory junction, so it does not need an administrator symlink privilege.

## Alternatives considered

- Keep `run.cmd` as a second Node launcher and duplicate the link steps in cmd. Lost: the two launchers had already drifted once.
- Require Developer Mode and use a symlink. Lost: a junction is a directory link Node resolves, and it works without that privilege.

## Consequences

A Windows prefix started from `Mohou.exe` follows the macOS parent protocol: Pi when that Node has it, Echo only when `host.json` does not ask for Pi. `pnpm dist:app` is still macOS-only. A Windows machine pass is still not a 1.0 gate.
