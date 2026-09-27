# Agent Note: History and storage panes

Status: implemented

## Problem

History listed a commit id glued to its message, and an ISO timestamp under it. Storage dumped one table as a single JSON line. Both panes covered the stage with no close control of their own, so the only way out was to press the toolbar icon again.

## Decision

Each pane has its own close control. The toolbar icon still toggles the same section. History lists message, local time, and a short id, then the selected commit's files with add and delete counts and the preview text. Storage lists tables, shows the file size, and renders a key/value row as a record. A value that is a list of titled objects shows those titles. Other rows stay pretty-printed JSON. Neither pane writes, except the existing storage restore control.

## Alternatives considered

- Leave the toolbar toggle as the only hide control. Rejected: the control is an icon with no pressed state, and the pane gave no hint that it closes.
- Keep the raw JSON line and only add a close button. Rejected: the export was already on screen and still unreadable.
- Add an editor for storage rows. Rejected: the panel browse is read-only.

## Consequences

The commit id remains on the row and in the detail. A preview is still a preview, not a line-complete diff. A table that is not key/value stays JSON.
