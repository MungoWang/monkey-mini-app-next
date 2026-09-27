# Agent Note: The Windows machine pass waits for the Tauri app

Status: proposed

Scheduling of the machine pass is superseded by [the 1.0 plan](../../implemented/process/2026-09-20-one-oh-plan.md). Windows code paths stay required now. The machine pass is after 1.0, and a failure there is a hotfix. This note's proposal text is the earlier schedule.

## Problem

The product must run on macOS and Windows. The panel has been opened on a Mac. No Windows machine has started it. Treating that gap as "skip Windows in the code" would ship a macOS-only path.

## Proposal

Each change still includes the Windows code path beside the macOS path. A complete run on a Windows machine is not a gate until the Tauri app exists and the product features that app hosts are in it. That run is the Tauri app on Windows, not an earlier browser session.

## Alternatives considered

- Require a Windows desktop session before this panel work is done. Rejected: the window under test is still a browser tab. The session that counts is the Tauri app.
- Drop the Windows path until that session. Rejected: a POSIX-only call found then is a rewrite, not a test fix.

## Acceptance criteria

- A change that opens a window, a path, or a shell has a Windows branch in the same change.
- The Windows machine pass is not claimed from a Mac browser session.
- When the Tauri app hosts the product, that app is started on Windows and the panel is used there.

## Risks

- A Windows branch can be wrong and stay unrun until the Tauri app. The branch is still required so the gap is a test gap, not a missing path.
