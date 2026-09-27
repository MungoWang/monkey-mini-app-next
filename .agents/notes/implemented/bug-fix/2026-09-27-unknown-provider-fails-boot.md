# Agent Note: An unregistered provider id fails boot

Status: implemented

## Problem

`createHost` treated a `host.json` provider id that was not in the registered list as optional and continued on `echo`, or on the first registered provider. [Provider injection](../../../docs/product/runtime/provider.md) says a missing id fails boot with `config-invalid`. The session spec still expected that refusal, and the suite failed.

Panel specs that remember a choice in `localStorage` also failed on this Node: the global exists, but without `--localstorage-file` it is unusable, so `typeof localStorage` is `undefined` and writes do not stick. jsdom's storage did not replace that global for those files.

## Decision

`createHost` throws `config-invalid` when `runtimeProvider.id` is not one of the providers passed in. It does not substitute `echo`. The card-style and install-row specs install a memory `localStorage` on `globalThis` before they read or write.

## Alternatives considered

- Keep the echo fallback so a machine whose Pi package disappeared still opens. Lost: the provider page already says an unknown id fails boot, and a silent swap hides a saved provider the user still thinks is selected.
- Point Node at `--localstorage-file` for the whole suite. Lost: that is a process flag and a real file, and these specs only need a map.

## Consequences

A runtime whose saved provider is not registered does not start. Shell still registers `echo` always; Pi is registered only when it can be constructed. Panel storage specs do not depend on Node's experimental `localStorage`.
