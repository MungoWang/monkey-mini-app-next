# Agent Note: Workbench card mark

Status: implemented

## Problem

The library grid put a "workbench" label and a set-default control in a row above the card. That row is only on a workbench, so that card sits lower than the others in the same row.

## Decision

The row stays off the grid. The home bar and the workbench tab still change the stored id. A workbench card is the same card as an ordinary app.

## Alternatives considered

- A spacer above every card so the row does not shift one card. The grid would carry an empty strip on ordinary apps. Rejected.
- Leave the row and accept the offset. The row is not part of the card, so the grid cannot align. Rejected.
- Put the mark inside the card, in the same box as the name and description. The card would grow a third line only on a workbench. The home bar already lists them. Rejected.

## Consequences

The library grid no longer says which card is a workbench. The home bar still lists them.
