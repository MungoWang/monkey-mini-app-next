# Agent Note: the author skill is mohou-mini-app

Status: implemented

## Problem

The author skill was named `monkey-mini-app`. The product name is Mohou and the packages publish under `@mohou` ([npm scope @mohou](../process/2026-10-01-npm-scope-mohou.md)), so the author-facing name carried another product line's word.

## Decision

The skill directory, the `name:` field in `SKILL.md`, and the packaged copy are `mohou-mini-app`. `skillIdOf` reads the source directory name, so every agent skill directory follows: `~/.pi/agent/skills/mohou-mini-app`, and the Claude and Kiro equivalents. The old scopes `@mini-app/*` and `@monkey-mini-app/*` survive only where a guard has to name them: the banned list in [skill.mjs](../../../../scripts/check/skill.mjs) and the forbidden list in [loader.md](../../../../skills/mohou-mini-app/references/guide/loader.md). The generator fixtures carry `@mohou/ui` directly, so the generator rewrites nothing. The repository is `mohou-mini-app`. A checkout whose `origin` still names the old repository reaches it through GitHub's redirect.

## Alternatives considered

- Rename only the package scope and keep the skill name. Lost because the author-facing entry would still name the old product.
- Rename only the `name:` field and leave the directory. Lost because `skillIdOf` reads the directory, so the installed skill id and the field would disagree.
- Ship a migration that deletes an earlier installed copy. Lost because no released build was ever installed, so the code would have nothing to migrate.

## Consequences

- A machine that installed an unreleased build keeps that copy under the old name; the next install writes a second directory beside it. No released build exists, so no migration ships.
- An agent skill catalog that lists the skill at session start shows `mohou-mini-app` after its next refresh.
