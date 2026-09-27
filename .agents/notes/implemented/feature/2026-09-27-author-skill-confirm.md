# Agent Note: Confirm before register

Status: implemented

The workbench sentence below is corrected by [A workbench is a homepage](./2026-09-27-workbench-is-a-homepage.md).

## Problem

A cold agent treated a vague ask as a brief and called `mini_app_register` immediately. It picked one facade, stored every entity in one `kv` array, and chose a look from the default pairing without saying so. The word workbench was read as "many modules on one page." The UI kit catalog was treated as the layout. External systems were tried in a fixed order, so a connected MCP server was not offered against HTTP, a CLI, or an installed library.

## Decision

Before register, the skill classifies the ask as one loop, several regions, or a workbench desk, and says which. One message asks the core choices the agent cannot see, each with a recommendation and the consequence of the other options. A skip, or "you decide", is a stated assumption. Register waits while a core choice is open. A clear one-loop ask is two sentences, then register. Several independent products are named, and only the first is built.

A workbench is `kind: "workbench"`: the first screen is that person's queue, and other mini-apps open as panel tabs. Shared-screen regions stay an ordinary app. Filterable rows get `schema/NNN_*.sql`. The UI kit is a shortcut for SaaS-shaped screens. Native elements and Tailwind, kit parts, or both are valid, including using none of the kit. The option table and the red flags are `skills/monkey-mini-app/references/choices.md`.

The question shape is adapted from a design-before-code checklist: classify first, offer a few options with trade-offs, recommend one, and do not treat familiarity as a reason to skip. It is one message, not one question per turn, and a stated default is enough to continue.

## Alternatives considered

- Ask one question per message and wait for an explicit yes on every app, including a todo. Lost: the user asked the agent to design when they do not know the shape. A second round becomes a questionnaire.
- Leave the confirm only in a reference doc. Lost: agents that read L0 and register will not open it.
- Require a kit component on every screen. Lost: the kit page already refuses that mandate, and a custom layout is a valid app.

## Consequences

[Write loop](../../../docs/product/author-skill/write-loop.md) locks the confirm. [Facades and looks](../../../docs/product/author-skill/facades.md) includes the workbench desk and the ask-once look. [UI kit](../../../docs/product/app-contract/ui-kit.md) states that using no kit component is valid. L0 shape, including why `references/` was not renamed: [Skill L0 is the gate](./2026-09-27-skill-l0-is-the-gate.md).
