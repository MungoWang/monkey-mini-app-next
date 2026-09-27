# Agent Note: Credential read port

Status: implemented

## Problem

A string map on Host holds every secret. Authors also invent a new name per app for the same account.

## Decision

Host depends on a read port: `list` names and descriptions, `get` one secret. The author tool is the only list. `ctx.credentials` exposes `get` only. `createCredentials` takes source specs and opens them. Each kind carries its own target. The same name in two sources fails. Writes stay off this port.

## Alternatives considered

- Inject the whole map at boot. Lost because Host then holds every secret.
- Declare names in `defineApp`. Lost because it does not confine a same-user app, and the name list drifts from the call site.
- Rewrite secrets into source before the call. Lost because the secret enters history.

## Consequences

One account is one name in `credentials.json`. A later source is another spec, or another provider in that list. It does not add `put` or `delete` to Host.
