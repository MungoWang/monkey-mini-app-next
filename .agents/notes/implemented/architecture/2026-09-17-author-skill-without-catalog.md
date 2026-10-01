# Agent Note: Author skill without a catalog

Status: implemented

## Problem

The write loop and the style slots were specified, and no skill file existed. An agent writing an app had to reconstruct both from several pages, or invent a kit import.

## Decision

`skills/mohou-mini-app/SKILL.md` documents the write loop, the mounted tool names, `ctx`, and the two style slots. It does not contain a component catalog. The catalog waits for the kit. The skill forbids a direct write into the app directory, a kit import, and a second colour name.

## Alternatives considered

- Wait until the kit exists before any skill file. Lost because the write loop and the style rules are already enough to stop the common mistakes.
- Hand-write the component catalog from the kit page. Lost because that page says a hand-edited catalog is not the contract.

## Consequences

When the kit is generated, the catalog is added to this skill. Until then, an author uses native elements and `var(--token)`.
