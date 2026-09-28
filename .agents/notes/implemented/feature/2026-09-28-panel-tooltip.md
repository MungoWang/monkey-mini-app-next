# Agent Note: Panel tooltip

Status: implemented

## Problem

Native `title` on icon chrome appears late and is easy to miss. The panel does not import the UI kit tooltip.

## Decision

Panel chrome uses `packages/panel/src/ui/tooltip.tsx`. Hover or focus shows the hint immediately. Icon toolbar buttons, the status-row workbench control, history commit ids, and truncated dest paths use it. Visible text on a control does not also take a tooltip.

## Alternatives considered

- Keep native `title`: the delay and contrast were the complaint.
- Import the UI kit tooltip: the panel does not import the kit.

## Consequences

Tests that clicked `button[title=…]` now use `aria-label` or `data-commit`.
