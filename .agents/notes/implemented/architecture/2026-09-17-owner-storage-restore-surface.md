# Agent Note: Owner storage restore surface

Status: implemented

## Problem

A migration that succeeds can still damage data. The snapshot and `owner.restoreStorage` already undo that. There was no panel control, and the HTTP path was not locked.

## Decision

The storage pane has a restore control. It asks first, then calls the existing `owner.restoreStorage`. It does not run on migration failure. A failed schema file already rolls back.

## Alternatives considered

- Restore automatically when a schema file fails. Lost because that failure is already a transaction, and blocking the checksum would stop the fixed file from running.
- Drop `owner.restoreStorage` until the panel exists. Lost because the in-process call is the undo for a successful migration.

## Consequences

A one-click restore without a confirm would replace the live database. The pane asks first.
