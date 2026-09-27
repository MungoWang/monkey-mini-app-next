---
status: implemented
---

# Startup sample from skill template

## Decision

On `createHost`, ensure `apps/` and `trash/` exist. When the runtime has no apps and no `.startup-seed` marker, copy skill facades `templates/today` → `com.mohou.today` and `templates/board` → `com.mohou.board` (manifest ids rewritten). The marker prevents re-seed after the user deletes the samples. Library card style defaults to glass so two samples show the featured glass layout.

## Why

The writing skill already ships inside shell (`skill/monkey-mini-app`). A packed install should not open to an empty library when polished facades are one copy away. Two samples fill the glass gallery; `today` is personal home, `board` is the second card.

## Given up

- Seeding on every empty library (would fight intentional delete).
- Shipping a second mini-todo package outside the skill tree.

## Coverage

- `packages/host/tests/startup-seed.spec.ts`
