---
status: implemented
---

# Pi runtime is an optional environment peer

## Decision

`@mohou/runtime-pi` declares `@earendil-works/pi-coding-agent` and `pi-ai` as **optional peerDependencies**. Shell registers `createPiProvider()` only when `probePiRuntime()` can resolve those packages via normal Node resolution. Distributed `dist:app` does not embed Pi.

## Why

Shipping Mohou with a hard dependency on Pi pulled ~150MB+ (agent + LLM SDKs) into the app and duplicated a stack the user already has if they use Pi. Pi as a brain only makes sense when Pi is installed in the environment.

## Resolution

Dynamic `import('@earendil-works/pi-coding-agent')` / `pi-ai` — no hand-rolled path scanning. Missing packages → echo only; host.json selecting `pi` falls back to a registered provider (echo) at createHost.

## Coverage

- Monorepo keeps Pi as `devDependencies` of `runtime-pi` for tests.
- `dist:app` install tree should omit `@earendil-works/*`.
