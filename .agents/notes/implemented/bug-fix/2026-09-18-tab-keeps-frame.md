# Agent Note: An open tab keeps its frame

Status: implemented

## Problem

Switching away from an app tab unmounted its iframe. Coming back created a new document, so the app reloaded. The tab model already said a switch does not reload.

## Decision

Every open app frame stays in the tree. The active one is shown. The others are hidden. Closing the tab removes that frame. Opening a tab that is already open does not call reload.

## Alternatives considered

- Snapshot React state and remount the iframe. Rejected: the document, scroll position, and dialogs would still reset.
- Keep one iframe and change its `src`. Rejected: assigning `src` loads the document again.

## Consequences

A hidden app keeps running. Theme and dock messages go to every open frame. Closing the tab is what drops the instance.
