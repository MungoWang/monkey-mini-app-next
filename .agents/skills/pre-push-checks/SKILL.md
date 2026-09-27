---
name: pre-push-checks
description: Use before claiming a functional change is done, pushing, or marking ready for review. A functional change runs pnpm run check, which includes typecheck and the coverage gate. Docs-only changes use git diff --check.
---

# Pre-push checks

Use this skill to run relevant local evidence once before a push. Git hooks are narrow: pre-commit lints staged TypeScript and checks staged whitespace; pre-push runs `pnpm run typecheck`. It is guidance, not a script.

## Inspect the outgoing change

1. Confirm the checkout and branch.

```sh
git status --short --branch
git rev-parse --show-toplevel
git diff --stat <base>...HEAD
```

2. Read the diff, including staged and untracked files. After merging a changed base, inspect the combined scope again and rerun only checks the merge invalidated.

## Select relevant evidence

A functional change runs `pnpm run check` before it is claimed done. [AGENTS.md](../../../AGENTS.md) owns that order. The command includes typecheck and the coverage gate. Focused tests while editing do not replace it. Do not wait to be asked.

- **Package behavior:** run the owning Vitest file while editing. Finish with `pnpm run check`.
- **Types or package exports:** `pnpm run check` includes typecheck. The pre-push hook runs typecheck again. Do not skip `pnpm run check` because the hook will run later.
- **Lint-visible TypeScript:** `pnpm run check` includes lint.
- **Documentation and Agent Notes only:** `git diff --check` for whitespace. A docs-only change does not run the coverage gate.

Pass Vitest file and name filters after the script name with `pnpm exec vitest run`. Check the reported selected test count before treating a filtered run as focused evidence.

Do not repeat a passing check merely because commit or push follows.

## History-rewriting pushes

Before a history rewrite, fetch the current remote branch and record its exact OID. Publish with `--force-with-lease=<branch>:<observed-oid>` so a concurrent update aborts the push. Raw `--force` is not allowed.

After a rewritten push, fetch the live head again. Commit hashes from before the rewrite are not current evidence.

## Handle failures

If a relevant check fails, stop and fix the blocker or report it. Do not push on the hope that another machine differs.

If a failure looks environment-specific, record the exact command, the failing test, and the platform-specific mismatch. Bypass a local hook only when the user explicitly asks, and report what failed.

## Push procedure

1. Run the selected checks once.
2. Commit, and inspect any files the pre-commit fixer changed before continuing.
3. Push so the typecheck hook runs, or use the exact lease for an authorized rewritten branch.
4. Verify the remote ref matches local `HEAD`.

```sh
git rev-parse HEAD origin/$(git branch --show-current)
```

Report pending remote checks as pending. Inspect failures before attributing them to the branch or the environment.
