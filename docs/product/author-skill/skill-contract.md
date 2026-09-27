---
status: shape-locked
progress: open
updated: 2026-09-27
---

# What the skill must keep true

Layer: [Author skill](README.md). Index: [features.md](../features.md).

- Owner: Author skill, generated where the UI kit can generate it.
- The skill is the whole authoring system: the write loop, the facades, the component contracts, the loader notes, the troubleshoot notes, and the diagnose helper. The source of that set is the previous product's authoring skill. A sentence may be shortened. A capability is not dropped from the system; L0 may point at L1 instead of inlining it.
- Load structure: **L0** is `SKILL.md` (short: confirm before register, write loop, MCP tool table, facade index, open-when table). **L1** is one reference doc when needed. Hand guides live in `references/guide/` (`choices.md` holds option consequences and red flags). Generated catalog, contracts, examples, looks, and theme stay in `references/`. **L2** is one facade directory after the loop for that region is chosen. The agent is not required to read the whole tree up front. The UI kit is a shortcut for SaaS-shaped screens. A beautiful app may use native elements and Tailwind, kit parts, or both. Using no kit component is valid.
- The component catalog, prop lists, and part names are generated from the UI kit. Inherited HTML attributes are not dumped row by row. Every component has a family and a when-to-use line. Examples are portable: `react`, the UI kit, and relative imports only.
- The skill names every **MCP-mounted** authoring tool and no invented tool. It does **not** name `mini_app_write`, `mini_app_edit`, or `mini_app_delete`. Those remain on the HTTP invoke projection only; [author surface](../author-surface.md) owns that full catalog. Source edits in the skill narrative use the agent's own file tools. It names every `ctx` member in [§1](../app-contract/README.md) and no invented member. `ctx.llm` and `ctx.agent` are documented as returning string. MCP args are documented as the tool's own object.
- `check:skill` requires the MCP tool set in the skill, forbids invented `mini_app_*` names, and fails if a byte-tool name appears under the skill tree.
- Diagnose: `bin/diagnose` under the skill tree. Optional help when authoring tools fail. Checks Host about, authoring MCP tools/list, core tool names, local skill version, and runtime root / `host.json`. It does not scan assistant mcp.json files. It is not a boot gate and not an authoring MCP tool. The skill may point at it; it does not forbid other analysis.
- Instructions are English. Facade strings exist for `zh-CN` and `en`.
- `SKILL.md` frontmatter carries `name`, `description`, and `version` (`x.y.z`). **Skill version equals `@mini-app/shell` version** (`pnpm sync:skill`). Host compares that version to each installed copy. A missing dest version is older. The skill tree ships inside the shell package (`skill/monkey-mini-app`).
- Failure: a skill that documents a removed MCP tool, a removed `ctx` member, a byte-tool name, or a hand-edited catalog is not the contract. Agents follow this file's feature list when the skill and the feature list disagree, and the skill is then corrected.
- Non-goals: pasting a lodash manual into the skill; a host install path hard-coded to one machine; an essay on fences; a ready MCP tool; packaging or sidecar install layout (separate decision).
- Pre-1.0 confirm gate: [.agents/notes/implemented/feature/2026-09-27-author-skill-confirm.md](../../../.agents/notes/implemented/feature/2026-09-27-author-skill-confirm.md). L0 keeps the confirm, the write loop, the MCP tool table, the facade index, and the open-when table. The short-list sample and the component index live in `references/`. Byte-tool names stay out of the skill tree. `bin/diagnose` is the helper when authoring tools fail. `check:skill` enforces the tool set and that ban. One need opens one file. `references/guide/` is the hand-written set. Generated UI pages stay beside it. A rename into `core/` and `ui/` is not used.

## Implementation


Role: generated where the kit can generate it. `pnpm gen:skill` writes catalog, contracts, examples, looks, and theme tokens from the UI kit and `scripts/gen/skill/fixtures`. A hand-edited catalog is not the contract. Diagnose is hand-maintained under the skill `bin/` and stays in the tree Panel copies. When this page and the skill disagree, this page wins and the skill is corrected. Plan: [implementation.md](../implementation.md).
