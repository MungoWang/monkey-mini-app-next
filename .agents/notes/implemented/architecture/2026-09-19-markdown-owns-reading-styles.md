# Agent Note: Markdown owns the reading styles

Status: implemented

## Problem

`Markdown` carried a short class string. Tailwind preflight removes list markers and table borders. Headings below `h2`, ordered lists, tables, quotes, and rules had no rule, so a normal document looked unstyled unless the caller added classes.

## Decision

The component owns the reading styles: headings through `h4`, paragraphs, both list types, links, emphasis, inline code, code blocks, quotes, rules, tables, and images. `className` still overrides. A normal document does not restyle those elements.

## Alternatives considered

- Leave the string and document that authors pass `className`. Lost because the published example is `<Markdown>{text}</Markdown>` with no style step.
- Add a `prose` variant the caller must opt into. Lost because the default would stay the broken look.

## Consequences

A caller who already passed `className` can still override. The shared `sdk.js` must be rebuilt before an open iframe sees the new rules.
