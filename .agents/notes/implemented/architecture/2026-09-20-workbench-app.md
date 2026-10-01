# Agent Note: A workbench is an app

Status: implemented

## Problem

A custom home was going to be a second document, with its own props, its own import list, and a second skill. Authors already write `ui.tsx` and `main.api.ts`.

## Decision

A workbench is an app whose manifest `kind` is `workbench`. It keeps ordinary app capabilities. The backend receives `ctx.workbench` with `listApps`, `openApp`, `listWorkbenches`, and `setDefaultWorkbench`. The UI calls `main.api.ts`. The builtin library id is `default`. The card is `AppCard` in `@mohou/app-view`. The panel imports that package. `@mohou/ui` re-exports it for authors. `extra.featured` is the only style-specific field, and only glass reads it.

## Alternatives considered

- Inject `WorkbenchProps` into a panel document, including `renderAppCard`. Lost because a workbench author would learn a second component model, and the UI would not look like an app.
- A directory outside `apps/` with its own import allowlist. Lost because that is a second compiler and a second skill.
- Put `featured` on the card's top-level props. Lost because only glass uses it.

## Consequences

- The host attaches `ctx.workbench` only when the live app kind is `workbench`. The slot shows that app's iframe when `defaultWorkbenchId` names one, and the builtin library otherwise.
- `defaultWorkbenchId` is an optional field of `host.json`. The home bar, the workbench tab action, and `setDefaultWorkbench` write it. Settings does not offer the switch, and saving another setting does not clear the field. Heat does not.
