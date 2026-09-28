# Agent Note: Launcher splash

Status: implemented

## Problem

The packaged window showed a bare `Starting Mohou…` on a white page until the sidecar origin loaded. It read as a debug placeholder.

## Decision

`packages/launcher/tauri/window/index.html` is a centered ink splash: 墨猴, Mohou, a hairline, 启动中. Tracking uses flex gaps so the last letter does not shift the block. Dark and light follow `prefers-color-scheme`. The page has no Host theme tokens because Host is not up yet.

## Alternatives considered

- Keep the one-line placeholder: the user rejected it as a debug box.
- Pull panel locale and theme tokens: the splash paints before the sidecar is ready.

## Consequences

A content change of this file needs a launcher rebuild. The panel document replaces it once the loopback origin loads.
