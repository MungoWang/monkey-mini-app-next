# Agent Note: Settings close remounts, sections stay separate

Status: implemented

## Problem

The settings overlay stayed mounted with `hidden`. After close, `closed` stayed true, so a second close did nothing. Appearance also showed every other settings group on one page, including a leftover palette name under the title.

## Decision

Unmount settings when the overlay is not open. The sidebar lists appearance, network, model, MCP, and about. Runtime is a select of registered brains on the model page, and that brain's `models()` fills the vendor and model lists. About holds package versions and the update check result.

## Alternatives considered

- Reset `closed` on reopen while keeping the form mounted. Rejected: a fresh mount is the same as opening the page again.
- A free-text runtime id. Rejected: the host already lists registered brains.

## Consequences

A dirty form is discarded when the overlay unmounts after a confirmed close. Echo has no `models()` list, so the model page says so instead of offering a typed name.
