# Agent Note: The writing skill carries a version the panel can compare

Status: implemented

## Problem

Install only knew whether `SKILL.md` existed at a dest. An old stub and the current skill both counted as installed, so Settings could not say an update was waiting.

## Decision

`SKILL.md` frontmatter includes `version: x.y.z`. Host reads the source version and each dest version. A dest without a version is older. `updateAvailable` is true when the source is newer. The panel shows 可更新 on that row and switches the button to 更新写作技能.

## Alternatives considered

- A sidecar `VERSION` file. Rejected: agents already open `SKILL.md`; one frontmatter field is the copy that gets installed.
- Semver with pre-release and build metadata. Rejected: the install UI only needs three numbers.

## Consequences

Bumping the skill is editing `version` in `SKILL.md`. `pnpm check:skill` requires that field. Reinstall still overwrites the dest tree.
