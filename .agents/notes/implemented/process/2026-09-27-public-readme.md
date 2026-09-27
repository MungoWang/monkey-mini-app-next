# Agent Note: Public README

Status: implemented

## Problem

The repository had no root `README.md`. A reader who opened the project saw package docs and agent orders, and no page that said what Mohou is or which command opens the panel.

## Decision

`README.md` is the public entry, in English. `README.zh.md` is the same entry in Chinese, linked from the first lines of `README.md`. The opening states what a reader can do, then shows `docs/images/board.png` and `docs/images/library.png`. It names the product, the privilege fact, the run commands, the macOS app command, and the authoring skill. Product behavior stays in `docs/product/features.md`. Commands stay in `docs/development.md`. Package roles stay in `packages/README.md`. [docs/AGENTS.md](../../../docs/AGENTS.md) records that split.

## Alternatives considered

- Copy the feature index into the README. Lost: two homes for the same sentences, and the index would go stale.
- Put the YAML document header on the README. Lost: GitHub would show the status block as the first thing a visitor reads. The README is not in the project-document list that requires that header.

## Consequences

There is still no `LICENSE` file. `package.json` says MIT. The README points at that field and does not invent a copyright holder.
