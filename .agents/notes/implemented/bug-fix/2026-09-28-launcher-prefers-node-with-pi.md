# Agent Note: Launcher prefers a Node that has Pi

Status: implemented

Superseded for Windows Pi linking by [Windows launcher links Pi peers](./2026-09-28-windows-launcher-links-pi.md).

## Problem

Installed Mohou.app exited before ready with `runtime provider is not registered: pi`. Login `PATH` put Homebrew Node 26 first. That Node has no global `@earendil-works/pi-coding-agent`. nvm Node 22 does. The launcher linked peers only from the first Node, so `probePiRuntime` failed, and a saved `runtimeProvider.id` of `pi` failed boot.

## Decision

Among executable Node candidates on `PATH`, nvm 22/24, and the usual Homebrew and `/usr/local` bins, the launcher uses the first whose global modules contain `pi-coding-agent`. If none do, it keeps the first Node and still boots Echo only when `host.json` does not ask for Pi.

## Alternatives considered

- Fall back to Echo when Pi is missing. Lost: [Provider injection](../../../docs/product/runtime/provider.md) already fails boot on an unregistered id, and a silent swap hides the saved provider.
- Always use the first `PATH` Node and tell the user to install Pi there. Lost: the peer is already installed for the Node this machine uses for Pi.

## Consequences

A machine with Pi only under nvm still starts the packaged app on that Node. A machine with no Pi global still uses the first Node. Windows linking is unchanged.
