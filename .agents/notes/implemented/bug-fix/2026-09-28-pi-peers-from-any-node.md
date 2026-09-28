# Agent Note: Link Pi peers from any Node on the machine

Status: implemented

## Problem

Closing Mohou from the Dock and opening it again could drop `@earendil-works/pi-coding-agent` from the prefix. Login PATH prefers Homebrew Node, which has no Pi. `link_pi_peers` then removed the existing links, and a saved `runtimeProvider: pi` made the sidecar exit before ready.

## Decision

Peer search walks every Node candidate and nvm version `lib/node_modules`, not only the Node that will run the sidecar. A miss does not delete a working link. The parent-death watcher is its own process group so a SIGKILL of Mohou does not take it down before it can stop the sidecar.

## Alternatives considered

- Keep removing links when the chosen Node has no Pi: a Dock launch then wiped a prefix that had just been linked from nvm.
- Require the sidecar Node itself to be the nvm binary: Homebrew Node can still run the host if the Pi packages are linked into the prefix.

## Consequences

A Dock launch still prefers a Node that has Pi when `find_node` can see it. When it cannot, the prefix keeps or gains the nvm Pi link anyway.
