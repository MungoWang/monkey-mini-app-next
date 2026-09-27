# Agent Note: Status row only on the gallery tab

Status: implemented

## Problem

The host status row sat under the tab strip on every tab. On an app tab it only repeated "host ready" and the app count, and it took a row away from the app.

## Decision

The row renders only while the gallery tab is active. An app tab does not render it.

## Alternatives considered

- Keep the row and shrink its padding. The text is still unused on an app tab. Rejected.
- Move the row into the library body so a workbench iframe also hides it. The gallery tab is the home, including when a workbench fills that tab. Rejected.

## Consequences

Switching back to the gallery tab shows the row again. A workbench that fills the gallery tab still shows it.
