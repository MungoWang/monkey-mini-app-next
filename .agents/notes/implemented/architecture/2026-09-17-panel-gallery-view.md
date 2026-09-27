# Agent Note: Panel gallery view

Status: implemented

## Problem

Panel state lived in free functions because a view that fetched would have invented host routes.

## Decision

`PanelGallery` is the first view. It uses `useReducer` and calls the existing search, tab, and delete-confirmation functions. Host access is an injected `PanelClient`. The package does not name a route and does not import Host. The frame contents are injected.

## Alternatives considered

- Wait for locked HTTP paths before any component. Lost because the view can render against a client without knowing the path.
- Put the route strings in the panel package. Lost because those paths are not locked.

## Consequences

A later HTTP adapter implements `PanelClient`. It does not grow a second tab or search implementation.
