# Agent Note: nvm Node lives in bin

Status: implemented

## Problem

A Dock launch ran Homebrew Node 26. `pnpm dev:host` ran nvm Node 22. Calendar MCP `tools/list` against `127.0.0.1:4466` returns on Node 22 and times out on Node 26 (`MCP error -32001: Request timed out`). The launcher meant to prefer the Node that has Pi, but it looked for `~/.nvm/versions/node/v22.x/node`. nvm-sh puts that binary at `bin/node`, so the candidate was never executable and the first `PATH` Node won.

## Decision

Unix nvm candidates are `versions/node/v22|v24.*/bin/node`. The first of those that has `pi-coding-agent` still wins.

## Alternatives considered

- Pin the MCP SDK so Node 26 stops timing out. Lost: Node 22 works with both 1.30 and 1.31; Node 26 times out on 1.30 too.
- Always use the first `PATH` Node. Lost: login `PATH` puts Homebrew ahead of nvm, which is the failure.

## Consequences

A machine whose Pi install is only under nvm boots that Node from the Dock. The window binary has to be replaced; a shell tarball update does not change this search.
