# Agent Note: Direct write is refused

Status: implemented

## Problem

Authoring agents could change app source by writing the directory themselves. The skill said not to. The host still accepted the bytes on the next tool.

## Decision

A source tree changed outside the authoring tools is restored to the last tool-written bytes. The tool then fails with `direct-write` and does not run. Storage, history, installed modules, and the theme pin are not source.

## Alternatives considered

- chmod the directory between tool calls. Lost because POSIX permission bits are not a Windows access lock, and the same user can change them back.
- Revert only when an agent process is identified. Lost because the host and the agent are the same user. There is no second identity to check.

## Consequences

An edit made in an editor is also restored the next time an authoring tool runs. That is the refusal. The owner pin file is left alone.
