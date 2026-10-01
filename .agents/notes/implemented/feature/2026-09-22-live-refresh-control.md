# Agent Note: LiveRefresh kit control

Status: implemented

## Problem

Apps need optional soft periodic refresh without a host/panel protocol. An earlier host status-bar design was stashed as too heavy for the value.

## Decision

`LiveRefresh` lives in `@mohou/ui` as a composite. The app passes `onTick` and optional `persistState`, `intervals`, and `labels`. Timer, pause, interval menu, and chrome stay inside the iframe. Interval change keeps `lastAt` and sets `dueAt = max(lastAt + interval, now)`. Default is off. No panel status strip, no `activity.json`, no runner registration.

## Alternatives considered

- Host/panel live with `postMessage` and hard-reload fallback. High cost; stashed.
- Built-in `storageKey` localStorage. Rejected for `persistState` so the author owns durability (`ctx.storage` or other).

## Consequences

Authors must mount the control where they want it (for example `PageHeader` actions) and merge data inside `onTick`. Pause is memory-only unless the author extends `persistState`.
