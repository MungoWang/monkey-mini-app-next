# Agent Note: Status open chip and clear-home pin

Status: implemented

## Problem

The status-row workbench control repeated the desk name plus an arrow. First-time users read it as a second switcher. The app-tab pin labeled current home did not write, yet it hovered like a button, and the pin and text did not sit on one line.

## Decision

The status control is a chip: custom home, a rule, more in a tab, and an open-in-new-tab arrow. It still opens the slot workbench as an app tab. The builtin library has no chip. Clicking current home writes `default` and the slot returns to the builtin library.

## Alternatives considered

- Name plus arrow only: the screenshot still read as a second switcher.
- Visible verb `在标签中打开` without identity: the control did not say it was the current home, or that the tab has other tools.
- Pencil on the chip: it looked like edit, not open as tab.
- Leave current home inert and drop hover: a dead control next to delete.

## Consequences

Panel labels add `open-workbench-tab-now`, `open-workbench-tab-more`, and `clear-default-workbench`. Hover on the chip still names storage, history, and theme. [Tab default and delete icons](2026-09-28-tab-default-and-delete-icons.md) said current home does not write; this note owns the write.
