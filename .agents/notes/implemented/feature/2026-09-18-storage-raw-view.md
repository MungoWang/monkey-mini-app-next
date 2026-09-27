# Agent Note: Storage raw view

Status: implemented

## Problem

The storage pane reads a key/value row as titles and dates. That hides the fields the app actually stored, so the shape of the row is not visible.

## Decision

The loaded table has two readings. Preview is the default. Raw prints the exported rows as JSON. Switching does not read the table again. Writes stay out of this pane.

## Alternatives considered

- Replace the preview with JSON only. Rejected: the title list is the faster reading, and the raw text is what was missing.
- Fetch the table again for the raw reading. Rejected: both readings are the same export.

## Consequences

A titled list no longer shows notes, ids, or nested fields until Raw is selected. An empty table has no switch.
