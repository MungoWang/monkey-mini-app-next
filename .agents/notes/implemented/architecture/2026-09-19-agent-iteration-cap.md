# Agent Note: Agent iteration cap is 100

Status: implemented

## Problem

An omitted `maxIterations` stopped the run after 8 completed turns, and a caller could not ask for more than 32. A Pi session that reads a skill and calls tools can pass 8 turns without being stuck.

## Decision

The omitted value and the caller ceiling are both 100. Host still cancels the signal after that many completed turns. A caller value outside 1 to 100 fails with `model-policy`.

## Alternatives considered

- Ceiling 500, default 8. Lost because 500 only lengthens a stuck loop, and the omitted 8 still cuts off a normal tool run.
- Leave 32 as the ceiling and pass 32 from the workbench. Lost because every other caller would still be stuck at 8.

## Consequences

A looping tool call can spend 100 model turns before Host aborts it. The number is host policy, not a locked product value.
