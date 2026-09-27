---
name: prose-standard
description: Use when writing, reviewing, restoring, trimming, or auditing prose, including where documentation or comments are required across Markdown, JSDoc, code and test comments, prompts, descriptions, and diagnostics.
---

# Prose standard

Write enough to preserve the contract, then remove reasoning transcripts, repetition, and decoration. A contract is an obligation, invariant, precondition, postcondition, or compatibility promise that a caller, callee, implementer, producer, or consumer relies on. This skill owns editorial judgment and required prose coverage. It is guidance, not a script.

Treat `contract`, `boundary`, `shape`, `surface`, `seam`, `gate`, and `vocabulary` as terms to check before use, not banned words. First ask whether the exact rule, API, field set, type, validation, timing point, component split, or failure states the fact better. Keep a term when it names the exact technical subject, including caller/callee contracts and security or process boundaries.

Comments describe non-obvious contracts or rationale that code cannot express. They do not restate what code already implies.

## Inputs

Require an explicit `scope`. If it is missing, report the required input and stop. Do not infer a repository-wide scope.

Accept `mode: automatic | interactive`. Default to `automatic`. Enter interactive mode only when the user explicitly requests questions or calibration.

`mode` controls questions, not write authority. Review and audit tasks report findings without editing. Explicitly requested write, fix, or trim tasks apply clear changes.

Treat generated catalogs, snapshots, and fixtures as derivative. Edit the owning source first, then regenerate every derivative.

Archived Agent Notes are frozen. Inspect an exact archived note only to understand a historical citation. Do not modernize its prose.

## Preserve the complete proposition

Before editing, identify every proposition in the passage. Preserve each relevant actor and action, condition, timing, ordering, modality, negative guarantee, exception, ownership, side effect, failure mode, and consequence.

Remove adjectives, repetition, and narration only when every factual clause survives and the result is clearer. A smaller word count alone is not an improvement.

Keep a complete local contract at the point of use. Link the owning document for architecture, rationale, algorithms, history, or extended examples. One explanation has one home. Essential contract facts may repeat locally.

Keep non-obvious rationale when omitting it could cause misuse or an incorrect simplification. Otherwise state the consequence and link the rationale home.

## Required coverage by prose location

Add or restore prose when code, types, and structure do not communicate a required contract below. Do not add a comment when those facts are already obvious locally.

- **Public JSDoc:** document caller-visible return distinctions, throws or rejections, side effects, ownership, timing, cancellation, and durability.
- **Internal comments:** orient non-local structure and obviously complicated local structure, including invariants, race ordering, ownership, security boundaries, and surprising failure behavior. Delete control-flow narration and code restatement.
- **Module comments:** state the module's role, dependencies, responsibilities, and non-obvious architecture choices. Link architecture choices to their owning explanation.
- **Tests:** explain only non-obvious test design: why a fixture, assertion, platform accommodation, real entry path, or indirect observation is necessary. Delete walkthroughs and inventories.
- **Cookbooks:** include prerequisites, required actions, the real entry path, observable verification, and concise warnings.
- **READMEs:** include the consumer contract: configuration, semantics, failures, limitations, and extension points. Link the owner of product behavior instead of restating it.
- **Agent Notes:** retain unique rationale, mechanisms, alternatives, consequences, shipped verification evidence, and named coverage gaps. Implemented notes state shipped reality in the present tense.
- **Skills and agent instructions:** state behavioral guardrails and explicit scope limitations, including "guidance, not a script." Keep the workflow concise and link its source of truth.
- **Diagnostics:** name the failing subject or path, the violated rule, and the correction when it is non-obvious. Remove internal execution narration.

Preserve searchable mechanism names. Normalize decorative emphasis only.

## Workflow

1. Confirm the scope, mode, and applicable `AGENTS.md` files.
2. Read [the documentation standard](../../../docs/AGENTS.md) and the owning code or document before judging a passage.
3. Inspect the requested scope. Use searches to find candidates, then judge passages semantically.
4. Classify each candidate as keep, add, trim, restore, restructure, or defer. Apply clear changes only when the task authorizes edits.
5. Update the owner before derivative artifacts.
6. Run the narrow relevant checks from [docs/development.md](../../../docs/development.md), plus `git diff --check` for prose edits.
7. Report the inspected scope, clear changes, deliberate keeps, deferred cases, and checks actually run.

## Borderline decisions

A case is borderline only when at least two versions satisfy the complete-proposition rule but trade accepted principles, and this skill does not already resolve the tradeoff. A rewrite with one proposition-preserving answer is not borderline.

In automatic mode, apply clear edits when authorized and report genuine borderline cases without asking questions. Do not weaken a proposition to make progress.

In interactive mode, group analogous passages under the governing principle. Present two or three viable versions, recommend one, and state the factual or structural difference. Do not offer inferior distractors.
