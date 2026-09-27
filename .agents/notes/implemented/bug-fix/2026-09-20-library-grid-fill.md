# Agent Note: Library grid fill

Status: implemented

## Problem

The library grid used `auto-fill`. Empty tracks stayed in the row, so a short row left a blank band on the right. Stamp, etch, and pulse cards also sized to their text.

## Decision

The grid uses `auto-fit`, so empty tracks collapse and the cards in the row share the width. Those three card styles are `width: 100%` of the cell. A featured glass card still spans two columns.

## Alternatives considered

- A fixed pixel width for every card. The row would not meet the window edge. Rejected.
- Stretch only the last card. The row would not share one width. Rejected.

## Consequences

A row with few cards grows each card down to the 220px minimum. Below that minimum the row wraps.
