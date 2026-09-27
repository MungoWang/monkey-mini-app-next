---
name: code-review
description: Use when reviewing a pull request. Orients the reviewer to standing orders, package rules, and the review checks that the diff alone does not show.
---

# Code review

This skill is guidance, not a complete checklist. Read the diff and enough surrounding code to understand the design. Prioritize correctness, lifecycle, security, and broken required behavior over style. A short review with one substantiated blocker is better than a list of nits.

## Sources of truth

- [AGENTS.md](../../../AGENTS.md) and [packages/AGENTS.md](../../../packages/AGENTS.md): standing repository and package authoring rules.
- [packages/README.md](../../../packages/README.md): package grouping.
- [docs/AGENTS.md](../../../docs/AGENTS.md): where documentation facts live.
- [docs/product/features.md](../../../docs/product/features.md): what the product does.
- [docs/architecture/decisions.md](../../../docs/architecture/decisions.md): locked product decisions.
- [.agents/skills/architecture-guard/SKILL.md](../architecture-guard/SKILL.md): scenario references for the change under review.
- [prose-standard](../prose-standard/SKILL.md): required coverage and editorial judgment.
- [Agent Notes](../../notes/README.md): design rationale. Disagreement with an Agent Note is a design discussion, not an automatic veto.

## Blocking requirements

1. **New prose receives semantic review.** Use [prose-standard](../prose-standard/SKILL.md) on every added or changed Markdown passage, JSDoc, comment, prompt, description, diagnostic, and visible string. Automated checks do not establish coverage, accuracy, placement, or editorial quality.
2. **Docs match the code.** Config, defaults, errors, wire fields, and public behavior update the owning README and JSDoc in the same diff. Comments state non-obvious contracts. Flag implementation narration, test walkthroughs, and duplicated rationale for deletion or a link to their one home.
3. **Imports match the package-boundary scene.** Read [package-boundary.md](../architecture-guard/references/package-boundary.md). A deep import into another package's `src/` is a blocker. Product behavior is reviewed against [docs/product/features.md](../../../docs/product/features.md), not restated here.
4. **Required evidence exists.** The author ran the checks [pre-push-checks](../pre-push-checks/SKILL.md) selects for the diff. Review the semantic gaps those checks cannot detect.

## Manual checks

- **Intent and interface contracts:** trace both sides of every changed interface. Confirm errors, cancellation, ownership, and disposal match the change and any Agent Note.
- **Seam and extension:** a swappable capability has a definition, providers, and consumers. Read [capability-seam.md](../architecture-guard/references/capability-seam.md) and [extension-point.md](../architecture-guard/references/extension-point.md). A consumer import of a provider package is a blocker.
- **Lifecycle and concurrency:** for async setup, callbacks, processes, or teardown, read [dispose.md](../architecture-guard/references/dispose.md) and [defensive-outcomes.md](../architecture-guard/references/defensive-outcomes.md). Check races before publication, cancellation during awaits, and cleanup on detach.
- **Explicit resolution:** read [resolve-at-boundary.md](../architecture-guard/references/resolve-at-boundary.md). A hidden default inside the consuming operation is a blocker.
- **Closed unions:** read [closed-union.md](../architecture-guard/references/closed-union.md). A default that drops a variant is a blocker.
- **Type names:** an exported type spells its words. `AppCtx` for `AppContext` is a blocker. The rule is [packages/AGENTS.md](../../../packages/AGENTS.md).
- **Layout names:** a product directory or file name spelled at a second call site is a blocker. The owning package exports one table or path helper. Tests import that helper.
- **Failures:** read [failure.md](../architecture-guard/references/failure.md). An empty `catch`, or a match on `error.message`, is a blocker.
- **Necessity:** map each abstraction, option, and compatibility path to a current contract or production consumer. Challenge speculative generality.
- **Test strength:** assertions fail on the intended regression and verify an external result, not a restatement of the implementation.

## Reporting findings

State the defect, location, impact, and evidence. Place a localized defect on the tightest relevant diff range. Use a review-level comment for cross-cutting architecture or scope. Separate blockers from non-blocking notes. Omit issues a green gate already enforces. Verify each incoming review claim and fix or rebut it on technical grounds.
