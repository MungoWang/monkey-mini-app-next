# Agent Note: List cards stay frosted rows

Status: implemented

## Problem

The list card style was a plain full-width row. The other styles already had a distinct surface, so list read as the unfinished one.

## Decision

A fill-dock list card is a short frosted row. An asymmetric wash sits behind a blurred text panel. A slow conic orb uses that card's own hue at low opacity. The monogram and a round chevron stay on the right. Side dock keeps the compact row. No extra palette is introduced.

## Alternatives considered

- Portrait cards at the sample's 200 by 300 size. Rejected: a gallery of apps would stop being a list.
- The sample's purple-to-orange spin. Rejected: the panel already colors each card from its hue, and a second palette would fight the theme.

## Consequences

List still puts the name before the monogram. Hover no longer paints the whole row with the muted fill. The two-letter mark stays on one line in the right rail. On hover the letters open their tracking and take the card hue. The corner light is one gradient behind the frosted wash. It has no circular mask and no drawn edge. The chevron slides sideways inside its circle, and a one-pixel highlight replaces the resting border. The line is brightest at the upper left and fades along the card hue. On a light card that highlight is the hue, not white, or the edge disappears.
