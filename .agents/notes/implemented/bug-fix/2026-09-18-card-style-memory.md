# Agent Note: Card style stays in the browser

Status: implemented

## Problem

The gallery card style lived only in the panel reducer. Refreshing the page, or opening the panel again, always started on `hero`. Settings showed the same in-memory value, so it looked saved until the document reloaded.

## Decision

The choice is written to `localStorage` under `mini-app.panel.card-style` when the gallery switch or the settings preview changes it. The next panel load reads that value. It is not written to host policy.

## Alternatives considered

- Add card style to host policy. Rejected: the product says card style is not a host field.
- Keep it in memory only. Rejected: the homepage switch then does not survive a reload.

## Consequences

A failed storage write still changes the current view. Another browser profile does not see the choice.
