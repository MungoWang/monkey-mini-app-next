# Agent Note: Pulse cards do not wash white in the dark

Status: implemented

## Problem

The pulse card copied a light-surface gradient: a 35% white veil and a solid white inset edge. On a dark card that veil covered the top half and the acronym, painted for a light ground, went dark.

## Decision

Dark mode keeps the raised card, but the veil is a 10% wash of the card hue that fades by mid-card. The inset edge is 7% white. The acronym uses the same hue at 74% lightness. Light mode is unchanged.

## Alternatives considered

- One gradient for both modes. Rejected: the light recipe is the raised-button look, and weakening it would flatten the light cards.
- Drop the surface treatment in the dark. Rejected: the pulse style would then match a plain card.

## Consequences

Switching the document to dark repaints the pulse cards without a reload. The dot and the hover shadow stay on the card hue.
