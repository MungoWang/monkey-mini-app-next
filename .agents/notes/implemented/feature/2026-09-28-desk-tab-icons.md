# Agent Note: Desk tab icons

Status: implemented

## Problem

The home desk switcher listed the builtin library and custom workbenches as the same kind of text chip. They were hard to tell apart at a glance.

## Decision

The builtin tab shows a `LayoutGrid` icon. A workbench tab shows that app's two-letter acronym. Card-style chips on the library page stay text-only. No new manifest field.

## Alternatives considered

- The same lucide dashboard icon on every custom tab: names would be the only distinction.
- A house icon for a workbench: it clashed with the pin current-home control.
- A new manifest `icon` field: not needed while acronym already identifies the app.

## Consequences

The panel maps `builtin` to the grid icon and `acronym` to the mark. Host and the contract list stay unchanged.
