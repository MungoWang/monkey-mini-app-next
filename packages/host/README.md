---
status: locked
updated: 2026-09-16
---

# @mini-app/host

Role: `provider`.

The call loop: build one `AppContext` from injected ports, run one method, dispose the call. Binding the brain is one part of that loop. Storage is the SQLite file beside that loop. Host also compiles the app and serves the loopback surface. It does not embed a model vendor. Product: [packages](../../../docs/architecture/packages.md).
