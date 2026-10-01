# Agent Note: A package update keeps UI imports

Status: implemented

Supersedes the peer-omission line in [update does not block boot](./2026-09-29-update-does-not-block-boot.md) only where that line treated every peer the same.

## Problem

`--omit=peer` stopped the optional Pi peer fetch, and it also removed `react-is`. `recharts` imports that peer. The sidecar then exited during its esbuild pass, before it printed an origin.

## Decision

The install still passes `--omit=peer`. Optional Pi peers stay out of the prefix; the launcher links them. `@mini-app/ui` depends on `react-is` directly, so the omit does not remove the import the kit bundle resolves. Fetch retries stay at one.

## Alternatives considered

- Drop `--omit=peer`: the update looks up `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent` again. That fetch is what held the splash.
- Keep the omit and leave `react-is` as a peer only: the next update deletes it and the sidecar exits before it is ready.

## Consequences

A later UI import that exists only as a peer fails the same way. It has to become a direct dependency before an update that omits peers.
