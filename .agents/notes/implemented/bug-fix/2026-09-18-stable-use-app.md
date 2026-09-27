# Agent Note: useApp handle stays one object

Status: implemented

## Problem

`useApp()` built a new object on every call. An effect that listed `call` as a dependency ran again after its own `setState`, and React stopped the iframe with "Maximum update depth exceeded". The sources dialog did that as soon as it opened.

## Decision

The host wrapper builds the handle once and returns that object from every `useApp()` call. `call`, `on`, and `onAny` do not close over render state.

## Alternatives considered

- Tell each app to omit `call` from its dependency list. Rejected: the identity changed, and the effect was written correctly.
- Memoize the handle inside the kit hook. Rejected: the kit only forwards the host object. A new host object each time is still a new dependency.

## Consequences

An effect may depend on `call`. Two `useApp()` calls in one document are the same object.
