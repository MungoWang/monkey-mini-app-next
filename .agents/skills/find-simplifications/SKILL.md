---
name: find-simplifications
description: Use to find non-obvious simplification candidates, remove redundant comments or implementation-heavy documentation, write proposed Agent Notes or inline TODO/FIXME/XXX notes, or fold a worthwhile simplification from another change. Especially for dead, duplicated, speculative, over-built, or hand-rolled code where a maintained dependency already exists.
---

# Finding simplifications

This skill turns a broad "find things to simplify" request into evidence-backed Agent Notes that remove or collapse existing surface area. It is guidance, not a checklist. Follow the code, keep judgment active, and prefer a few well-proven candidates over a pile of thin guesses.

## Start with repo context

- Read [AGENTS.md](../../../AGENTS.md), [packages/AGENTS.md](../../../packages/AGENTS.md), and [packages/README.md](../../../packages/README.md) before judging a package edge.
- Read [docs/architecture/decisions.md](../../../docs/architecture/decisions.md) before proposing a change that fights a locked decision.
- Use the Agent Note tree and its [rules](../../notes/README.md). An implemented note is current authority until a newer note supersedes it. An archived note is frozen history.

## What counts as a strong candidate

A strong simplification removes, folds, or demotes something real and has evidence that the current design costs more than it buys:

- A public method, config knob, helper, package, or test artifact has no production consumer.
- Tests or docs are the only consumers, and the behavior they pin is not load-bearing.
- Two representations mirror the same fact.
- A separate package exists only for support code, and its role does not change independently of the package that uses it.
- A feature implements speculative generality with no owner.
- Hand-rolled code reimplements a maintained dependency or a Node builtin at the engine floor, and the swap deletes the implementation plus its dedicated tests.

Thin candidates are not enough for an Agent Note: a typo, an unused symbol with no call-site reading, or "this looks complex" without proof.

## Survey

Start with the largest production-code deltas. Read call sites, not only symbol names. Useful searches are the exact symbol, the package name, the config key, and the method name with both `.name(` and `name(`.

Classify consumers before writing:

- Production: `packages/*/src`, `apps/*/src`, and runtime scripts.
- Non-production: tests, README and docs, Agent Notes, and comments.

Reject or downgrade a candidate when a production caller exists and the simplification is a feature decision, when an implemented Agent Note or a locked decision justifies the API and the new evidence does not beat that reason, or when the idea is correct but tiny. A tiny cleanup is an inline `TODO`, `FIXME`, or `XXX` using the urgency in [docs/development.md](../../../docs/development.md).

## Prose

Treat comments and documentation as maintained surface area. Apply [prose-standard](../prose-standard/SKILL.md). Delete comments that restate code. Keep a required local contract.

## Trust boundaries

For every defensive copy, validator, and callback capture, name where the value came from and who owns it next. Same-process typed calls ordinarily borrow readonly values. Parsers, config loaders, queues, durable files, workers, processes, and wire decoders own or validate their data.

## Hand-rolled code versus a dependency

A dependency is a valid simplification when it deletes owned code and tests. Name the exact surface the package covers. Residual semantics the package does not cover stay in the Agent Note. Prefer a Node builtin when the engine floor has it. A wrapper that relocates the same complexity is not a win.

## Write the Agent Note

Create one file per durable proposal under `.agents/notes/<lifecycle>/<class>/yyyy-mm-dd-topic.md`, following [.agents/notes/README.md](../../notes/README.md).

Use this structure unless the idea needs a tighter one:

- `# Agent Note: <action-oriented title>`
- `Status: proposed`
- `## Problem`: name the current API, cite files, and separate production callers from tests and docs.
- `## Proposal`: state what to remove, fold, or rehome, including tests and docs.
- `## Alternatives considered`
- `## Acceptance criteria`
- `## Risks`

When a proposal overlaps an existing note, consolidate into the note that owns the topic.

## Inline notes

Use inline `TODO`, `FIXME`, or `XXX` only for a small local cleanup that is clearly useful and is not a durable design decision. Name the smell and the action. Do not add a tag for a speculative complaint.

## Validation

For a note-only change, run `git diff --check`. For a code change, run the checks [pre-push-checks](../pre-push-checks/SKILL.md) selects. Report what was added, consolidated, or left in place, and which checks ran.
