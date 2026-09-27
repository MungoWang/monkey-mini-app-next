# Agent Note: Theme menu closes on a blank press

Status: implemented

## Problem

The theme menu stayed open until the toolbar button was pressed again. A press on the page behind it did nothing.

## Decision

While the menu is open, a transparent layer covers the window behind the menu and the toolbar button. A press on that layer closes the menu. A press inside the menu does not.

## Alternatives considered

- Close on any document click. Rejected: the press that opens the menu would also close it.
- Leave close on the toolbar button only. Rejected: the menu covers part of the app and has no other dismiss except that icon.

## Consequences

Settings, history, and storage still close from their own control. They cover the stage, so there is no blank area behind them.
