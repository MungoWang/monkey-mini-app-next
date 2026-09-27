---
status: locked
updated: 2026-09-27
---

# AGENTS.md — Documentation

This file says where a fact lives. It does not restate the pages it points at.

Document attributes are required by [AGENTS.md](../AGENTS.md#documentation). A content edit updates `updated` and sets `status` in the same change.

## One home per fact

| Home | Owns | Does not own |
| --- | --- | --- |
| Root [AGENTS.md](../AGENTS.md) | Standing orders an agent needs every session, each linking its home | Page contents, worked examples, command inventories |
| Root [README.md](../README.md) | The public entry, in English: what Mohou is, how to run it, where an author starts. [README.zh.md](../README.zh.md) is the same entry in Chinese | Product behavior, command inventories, package roles |
| Subtree `AGENTS.md` | Orders for that subtree | Repo-wide rules the root file already carries |
| [docs/architecture/functions.md](architecture/functions.md) | The product cut by caller | Call fields, libraries, package inventories |
| [docs/architecture/packages.md](architecture/packages.md) | The package cut, including packages that do not exist yet | Call fields, creating empty directories |
| [docs/product/features.md](product/features.md) | What the product does | Package layout, commands, how it is built |
| [docs/product/implementation.md](product/implementation.md) | How a feature is built: role, boundary, failure code, lifecycle | Product capabilities, library choice, numeric policy |
| [docs/architecture/decisions.md](architecture/decisions.md) | Locked product decisions | Procedures, package inventories |
| [docs/blueprint.md](blueprint.md) | Which node a capability belongs to | Feature behavior, task order |
| [docs/development.md](development.md) | Commands and what each command checks | Product behavior, decision rationale |
| [docs/testing.md](testing.md) | Which test tier proves what | Command strings, product behavior |
| [docs/cookbook/](cookbook/adding-a-package.md) | Step-by-step procedures with verify commands | Decision rationale |
| Package README | That package's contract | Another package's behavior; product behavior beyond a link to [features.md](product/features.md) |
| [packages/README.md](../packages/README.md) | Package grouping and roles | Per-package behavior |
| [.agents/notes/README.md](../.agents/notes/README.md) | Why a decision was made, and the archive rule | Current command lists |
| [.agents/skills/](../.agents/skills/prose-standard/SKILL.md) | Reusable workflows | Product behavior |

Bugs and incident chronology stay out of standing orders. A procedure links the decision note that owns the why.

## Writing rules

- State the current fact. History stays in commits and Agent Notes.
- One fact has one home. Other pages link that home instead of copying the paragraph.
- A package README that has no behavior yet is one line pointing at [features.md](product/features.md).
- Prose coverage and editorial judgment: [.agents/skills/prose-standard/SKILL.md](../.agents/skills/prose-standard/SKILL.md).
- A non-trivial change adds or updates an Agent Note in the same change. [.agents/notes/README.md](../.agents/notes/README.md) owns the exemption for a mechanical edit.
