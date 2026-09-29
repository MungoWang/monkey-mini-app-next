# Agent Note: Update install uses the launch Node's npm

Status: implemented

## Problem

Confirming an in-app update wrote `update.json` and the sidecar exited 75. The launcher then ran bare `npm`. A Dock launch has no `npm` on `PATH`, so the install failed with "Mohou could not install the update." The sidecar already boots with a resolved Node (often nvm 22) whose directory contains `npm`.

## Decision

The pending update runs that Node's sibling `npm` with the same `PATH` as the sidecar. stdout and stderr land in `prefix/update.log`.

## Alternatives considered

- Tell the user to install Node on the Dock `PATH`: the machine already has Node; the sidecar found it.
- Leave `npm` on the process `PATH` after `launch_plan`: the Tauri process still has the Dock `PATH`; only the child got the resolved one.

## Consequences

A launcher rebuild is required. An in-app shell update does not replace the window binary.
