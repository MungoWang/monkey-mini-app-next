# Agent Note: Workbench status open and schema data migrations

Status: implemented

## Problem

A workbench shown in the gallery slot has no path to the app-tab chrome (storage browse, history, app theme pin) without hunting that app in the library. Authors also treated `schema/` as DDL-only and wrote one-shot TypeScript `ctx.storage.run` loops for seeds and data rewrites.

## Decision

When a workbench fills the slot, the host status row carries a right-side control that opens that workbench as an app tab through the same open path as a library card. Product and skill prose state that `schema/NNN_name.sql` is the migration surface for create/alter, seed, and one-shot row rewrites; runtime `run` stays for ongoing app writes.

## Alternatives considered

- Put storage/history tools on the gallery chrome for the slot workbench: those tools are app-scoped and already mount on app tabs; duplicating them would split the chrome.
- A second migration API or authoring tool for data: Host already applies numbered SQL files as one transaction each; a TypeScript path would bypass checksum and backup rules.
- Leave schema docs DDL-only: LLMs kept inventing ugly one-shot TS migrations.

## Consequences

Panel labels gain `open-workbench-tab` (`Open as tab` / `在标签中打开`) and a longer hover hint. The builtin library still has no status-row open control. Schema skill and product pages explicitly ban one-shot TS bulk seed/migration in favor of the next numbered SQL file.
