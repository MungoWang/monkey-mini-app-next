# Agent Note: Open the tab before the build

Status: implemented

## Problem

Opening a card waited for the host, and the runner document built the UI bundle before it returned. A large app froze the panel for seconds. The tab appeared only after that build.

## Decision

The panel adds the tab on the click, then tells the host. The tab shows a host pending state until the iframe document loads. The runner document does not include the bundle. The iframe loads `entry.js` after the document.

## Alternatives considered

- Keep the bundle inside the runner document and only paint the tab first. The document request would still build before the iframe could load. Rejected.
- Build on a worker and keep the document waiting. The tab would still be blank until the worker finished. Rejected.

## Consequences

A failed open removes the tab it added. A cache hit still loads `entry.js`, but it does not rebuild.
