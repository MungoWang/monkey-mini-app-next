# Agent Note: Tab default and delete icons

Status: implemented

## Problem

On an app tab, set-default and delete sat in the same toolbar as refresh, theme, history, storage, and settings, as words. The words broke the icon row. Icon-only pin then hid whether the open workbench was already home.

## Decision

Those two actions live in their own toolbar block. A workbench tab shows pin plus the home label, a short rule, then a trash icon. When that app is already the stored id, the pin is filled and the label is current home; the action does not write. A non-workbench tab shows only the trash icon. Delete still asks before it runs.

## Alternatives considered

- Keep both as words inside the existing icon toolbar: the row stayed mixed.
- Pin as icon-only: the current-home state was only a tooltip, which the screenshot rejected.

## Consequences

Delete stays icon-only with the panel tooltip. The builtin library still has no set-as-home action.
