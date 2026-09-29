---
name: architecture-guard
description: Use when adding or changing a seam, package, registration, lifecycle, dispose path, scope, event map, derived view, boundary resolve, closed union, failure shape, process spawn, or spec that acquires a port. Read the matching line; the link is one example. Product behavior lives in docs/product/features.md.
---

# Architecture patterns

Read the line that matches the change. The link is one example and the effect a caller observes.

Product behavior lives in `docs/product/features.md`. This file does not restate it.

## Seams and packages

1. A swappable capability is a seam: definition, provider, consumer. One role is not the seam. Do not split until a second provider or a second consumer exists. Consumers do not import provider types. [capability-seam.md](references/capability-seam.md)
2. New behavior registers on a documented extension point. Changing the kernel updates the map of where behavior goes. [extension-point.md](references/extension-point.md)
3. Packages sit at `packages/<group>/<pkg>`. A group is a container. One package while the roles are one concern. [package-boundary.md](references/package-boundary.md)
4. A definition that claims to be provider-neutral has two implementations. A field only one of them can fill is a definition bug. [capability-seam.md](references/capability-seam.md#two-implementations)
5. A handle refers to one live resource. The owner manages the pool. A presenter converts values and performs no I/O. [docs/cookbook/adding-a-package.md](../../../docs/cookbook/adding-a-package.md#4-name-the-role-that-exists)
6. The definition is written for every current consumer, not for one of them. A public method with one internal caller is a private closure passed at construction. [capability-seam.md](references/capability-seam.md)

## Registration and scope

7. A registration returns a disposer. Dispose runs it. A later lookup misses. [dispose.md](references/dispose.md#one-registration)
8. One service name has one implementation. A second registration throws. The live one stays. [dispose.md](references/dispose.md#one-registration)
9. A registration is global or owned by one scope. Scoped names do not inherit to children. Lineage is data, not visibility. The most specific name wins. [scope.md](references/scope.md)
10. Producers and consumers share one typed event map. An unknown key does not typecheck. [event-map.md](references/event-map.md)

## Records and views

11. One committed record is the source. Caches, prompts, UI, and replay are derived from it. A live stream is not that record. [derived-view.md](references/derived-view.md)
12. Publish after the write commits. A failed write emits nothing. [failure.md](references/failure.md#publish-after-commit)
13. Anything a caller can observe later is reconstructable from the committed record, not from a live-only side channel. [derived-view.md](references/derived-view.md)

## Lifecycle

14. Lifecycle is create, start, request, dispose. Create opens no child. Dispose awaits child exit, then runs disposers. `void child.dispose()` returns too early. [dispose.md](references/dispose.md)
15. A generation token makes a racing close idempotent. Do not start the replacement until the previous close is confirmed. [dispose.md](references/dispose.md#example)
16. Reconnect has a budget. Exhaustion fails that attempt and stops retrying inside it. The next call may try again. It does not restart forever. [bounded-recovery.md](references/bounded-recovery.md)
17. Work that outlives `start` returns a handle. Collect and cancel are later calls. [long-running-handle.md](references/long-running-handle.md)
18. One asynchronous operation has one owner. Recover that owner at the entry. A leaf helper closes over the value it uses. It does not take the process root to hide a parameter. [dispose.md](references/dispose.md#one-owner)

## Boundaries

19. Config, wire JSON, and file bytes pass through one `resolve*`. Invalid input throws and names the field. `run` does not apply `??`. A missing referent is not skipped. [resolve-at-boundary.md](references/resolve-at-boundary.md)
20. Trust a value already typed inside the process. Validate at the wire, the config file, and the process boundary. [resolve-at-boundary.md](references/resolve-at-boundary.md#wire-value-stays-unknown)
21. An id that shares a primitive with another id is branded where the primitive is admitted. The callee does not re-parse it. [package-boundary.md](references/package-boundary.md#definition)
22. Tests and typecheck resolve workspace imports to `src`. A check that reads built output says so. The two planes are not mixed. [source-plane.md](references/source-plane.md)

## Results and failures

23. Independent facts are separate fields. A timeout and an exit code are both reported. [defensive-outcomes.md](references/defensive-outcomes.md#orthogonal-facts)
24. Providers may throw or return. The public function exposes one shape. [defensive-outcomes.md](references/defensive-outcomes.md#one-public-shape)
25. A shared status flag is not the result of one call. Wait on that call's own settlement. [defensive-outcomes.md](references/defensive-outcomes.md#status-is-not-one-result)
26. A throwing listener is logged. Later listeners still run. [defensive-outcomes.md](references/defensive-outcomes.md#one-listener-does-not-sink-the-dispatch)
27. `catch` binds the error and uses it. A wrapped error passes `cause`. Callers match a closed code, not a message substring. [failure.md](references/failure.md)
28. A closed-tag switch ends in `assertNever`. A merge-extensible tag falls through a documented default. [closed-union.md](references/closed-union.md)
29. A decision is enforced in the operation that makes it, not only in a wrapper another caller can skip. [failure.md](references/failure.md#enforce-in-the-operation)
30. A bound applies to the complete emitted value, including wrappers. [failure.md](references/failure.md#bounds)

## Process safety

31. A spawned command does not inherit key, secret, token, or password entries. Spill files are private, randomly named, and created exclusively. [defensive-outcomes.md](references/defensive-outcomes.md#spawned-commands-do-not-inherit-secrets)
32. A path that may be a link is removed with `lstat` and `unlink`. Recursive removal is for a known real directory. [defensive-outcomes.md](references/defensive-outcomes.md#delete-the-link-not-its-target)

## Tests and UI chrome

33. A spec owns the port, path, and child it acquires. Teardown releases them. A spec that passes only when run alone is a defect. [failure.md](references/failure.md#spec-owns-what-it-acquires)
34. Dispose proves removal: register, dispose, observe the name miss. [dispose.md](references/dispose.md#one-registration)
35. UI chrome strings go through the locale dictionary. A new string lands in `en` and `zh-CN` together. User, model, and wire text stay verbatim. [locale-copy.md](references/locale-copy.md)
