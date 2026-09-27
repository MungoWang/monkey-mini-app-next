# Agent Notes

An Agent Note records a decision or proposal: the why, and what was given up. Code and docs carry the what. This file owns when to write a note, where it lives, and the archive rule.

## When to write one

Every non-trivial change adds or updates at least one Agent Note in the same change. A change is non-trivial when it alters behavior, architecture, a contract shared across files or packages, process or tooling, testing strategy, an on-disk or wire format, or another decision a maintainer may revisit.

A proposal for work not yet shipped starts in `proposed/`. A decision already shipped starts in `implemented/`. Updating the note that already owns the decision satisfies the rule. A purely mechanical or local edit with no change to behavior, contracts, structure, process, or rationale is exempt.

An Agent Note is never edited into a different decision. Supersede it with a new note and keep both cross-linked unless the old note is fully consolidated into the current owner. Before deletion, the owner preserves every unique rationale, alternative, consequence, and named coverage gap, and repairs every inbound link.

## Layout

Path: `{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`. The date is when the topic was first proposed.

Lifecycle:

- `proposed/` — not yet shipped.
- `implemented/` — shipped. Keep paths, names, and structure current when the code moves. Do not change the decision itself in place.
- `rejected/` — considered and declined. Keep it only while the rationale prevents a tempting mistake. Otherwise delete it.

Class is one of `feature`, `bug-fix`, `simplification`, `architecture`, `process`, `testing`. Architecture is a decision about shipped source. Process is tooling or workflow around the code.

Cross-references use relative Markdown links.

## Archive policy

Archive an implemented note when the shipped decision is complete and its rationale is unlikely to guide future work. Keep it active when an alternative, ownership boundary, negative guarantee, durable format, security rule, or reintroduction condition remains useful.

Never archive a proposed note. Reject an obsolete proposal instead.

The archive path is `archived/{class}/yyyy-mm-dd-topic-title.md`. An archival change moves the file, keeps `Status: implemented`, and inserts `Archived: YYYY-MM-DD` immediately below that status. Those are the only content changes during archival.

Once archived, a note is frozen. Do not edit, reformat, move, or delete it, and do not treat it as authority for current behavior. Active prose may link an archived note when it cites history.

## File format

The first lines are:

```markdown
# Agent Note: <title>

Status: <status>
```

`Status` is `proposed`, `implemented`, or `rejected — <why, in one line>`, and it matches the lifecycle folder.

A proposed note contains `## Problem`, `## Proposal`, `## Alternatives considered`, `## Acceptance criteria`, and `## Risks`.

An implemented note contains `## Problem`, `## Decision`, `## Alternatives considered`, and `## Consequences`. `## Decision` is present tense. `## Proposal` and `## Acceptance criteria` do not appear in an implemented note.

Every note has `## Alternatives considered`: each real alternative and why it lost. Record alternatives. Do not invent them.
