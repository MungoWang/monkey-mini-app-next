# Agent Note: Panel state stays until the views

Status: implemented

## Problem

Search, tabs, delete confirmation, port checks, and chrome labels started as free functions so the views would not invent Host routes. Those functions were easy to mistake for the panel itself.

## Decision

The views use `useReducer` and call those functions. The panel still does not import Host. HTTP starts only after the path table is locked.

## Alternatives considered

- Extract a reducer before any component. Lost because it is another layer with nothing to render.
- Replace the functions with components immediately. Lost because the owner HTTP paths were still draft.
- Move the functions into Host. Lost because search, tabs, dock, and delete confirmation are panel-local.

## Consequences

New panel-local state still belongs in the reducer next to the view, not as a second state library.
