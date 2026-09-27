# Agent Note: Build-cache names are dist and .cache

Status: implemented

## Problem

The history page and the author surface said snapshots and listings skip build caches. `snapshotSkip` was `.git`, `storage`, and `node_modules`. No cache directory had a name, so none was skipped. Host compile output stays in memory. An app-written `dist/` or `.cache/` was committed and listed.

## Decision

`dist` and `.cache` are the build-cache names. They sit in `snapshotSkip` with `.git`, `storage`, `node_modules`, and `theme.json`. `coverage` is not in that set. Host still does not create `dist` or `.cache`.

## Alternatives considered

- Leave the sentences as "build caches" and skip nothing until Host grows a cache directory. Lost because an app can already write those directories, and the sentences claimed a skip that did not exist.
- Also skip `coverage`, `.turbo`, `.next`, and `out`. Lost because a longer list hides a real source directory, and `coverage` was called out as not a cache name.

## Consequences

A file named `dist` or `.cache` anywhere under the app is absent from listings and from new snapshots. The next source commit removes one that an older snapshot already contains. `coverage/` is still source.
