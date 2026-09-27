# Agent Note: Desk switch fill

Status: implemented

## Problem

Choosing the builtin library in the home bar did not clear `defaultWorkbenchId`. The settings write omitted the field, and the host merge kept the previous id. The workbench slot also sat in a scrolling box, so the frame stayed as tall as its content and the rest of the window stayed empty.

## Decision

The home bar writes `defaultWorkbenchId: 'default'`. Host treats that value as absent and drops the stored id. The workbench slot is a column flex fill, the same as an app tab. The library grid still scrolls.

## Alternatives considered

- Omit the field and teach the merge to delete it. A partial settings body would clear a desk the caller did not mention. Rejected.
- Give the workbench iframe a fixed viewport height. It still fails when the window changes. Rejected.

## Consequences

A failed policy write leaves the current desk. The library does not stretch its cards to the window.
