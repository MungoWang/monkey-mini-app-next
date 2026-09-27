# Agent Note: A palette is a theme file

Status: implemented

## Problem

Colour tokens were enough, but the host still special-cased a closed list of palette ids. Those ids had no colour values. A pin of `tokyo` succeeded and painted nothing. Light and dark values were written under `data-mode`, and nothing on the document set that attribute, so the values did not apply.

## Decision

A palette id is valid only when a theme file with that id parses. Shipped themes are those files, not an id whitelist. A user file with the same id replaces the shipped file. The host palette id, when it names no file, bakes no token values. The runner sets `data-mode` from appearance. `light` and `dark` are fixed. `system` follows the OS and is not stored as a resolved colour. Authors do not set `data-mode`. Layout and type are not more host tokens.

## Alternatives considered

- Keep the id list and ship colour files later. Lost because a successful pin that paints nothing is a false palette.
- Let the skill set `data-mode`. Lost because a skill instruction does not switch the document. The values stay unused.
- Add spacing and type to `themeTokens`. Lost because those are kit and skill concerns, not another host colour list.

## Consequences

`builtinPalettes` is gone. The picker lists shipped files and user files. A user file wins on the same id. `renderRunnerDocument` takes the appearance and applies `data-mode`. A later skill tells authors not to set it themselves.
