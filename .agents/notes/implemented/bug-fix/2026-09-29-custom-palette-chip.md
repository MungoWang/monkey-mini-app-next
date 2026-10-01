# Agent Note: Custom palettes are not system

Status: implemented

## Problem

The picker marked every palette 系统. A file in `~/.mini-app/themes` is not a shipped theme. The list had no field that said which directory the file came from, so the panel could only use one chip.

## Decision

`GET /api/palettes` adds `origin`: `builtin` or `custom`. The picker prints 系统 or 自定义 from that field. A user file that replaces a shipped id is `custom`, because that file is the one that paints. An app `theme.css` is a third source. It is not in that list. The app-scope row is marked 应用, and uses the file's name when the header has one.

## Alternatives considered

- Infer custom from the id prefix. Lost: a user file may reuse a shipped id, and a shipped id is not a prefix.
- Hide the chip on custom rows. Lost: the person still cannot tell the two groups apart.

## Consequences

An old panel against a new host still shows 系统 for every row, because a missing `origin` stays the shipped chip. The running app needs both the host list and the panel build.
