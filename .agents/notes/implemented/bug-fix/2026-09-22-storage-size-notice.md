# Agent Note: Storage size notice default and copy

Status: implemented

## Problem

A size notice fired at 1 MiB and the banner showed only the table name, so a full `kv` table looked like a bare "kv" toast.

## Decision

The default notice threshold is 64 MiB. The banner uses a panel label that names the table and suggests asking an agent to split the data. Opening storage and focusing the app are unchanged.

## Alternatives considered

- Keep 1 MiB. Too low for a local SQLite mini-app. Rejected.
- Hard-code Chinese in the surface. The panel already owns locale labels. Rejected.

## Consequences

Host may still pass a lower `storageNoticeBytes` in tests. The host event still carries the table name only; the panel formats the sentence.
