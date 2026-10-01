---
status: shape-locked
progress: settled
updated: 2026-10-01
---

# Import allowlists

Layer: [App contract](README.md). Index: [features.md](../features.md).

- Owner: App contract. Host enforces the lists at compile and at backend load.
- Input: an import specifier in `ui.tsx`, `ui/**`, `main.api.ts`, `api/**`, or `shared/**`.
- Output: a resolved module, or a compile/load error that names the specifier.
- UI allowlist: `react`, the UI kit, `lodash`, `lodash-es`, `motion`, `motion/react`, and relative paths inside the app that are not under `api/`, are not `main.api.ts`, and are not under `assets/`. Hooks come from `react`. Components, `useApp`, and `cn` come from the UI kit. A file under `assets/` is loaded with `useApp().resolveAssetUrl`.
- Backend allowlist: `defineApp` from the backend contract, `lodash`, `lodash-es`, Node built-ins, one library installed into that app, and relative paths inside the app that are not under `ui/` and are not under `assets/`. The host injects `defineApp` at load. The backend process does not load the UI kit.
- Failure: any other bare specifier fails. A platform module that exists but is UI-only fails the backend with that reason, not with "install it". A missing installed library fails with a message that names `mini_app_install`.
- Non-goals: Node built-ins in the UI or in `shared`; `motion` or the UI kit on the backend; installed libraries in the UI; a second React; a home-grown util package; merging the UI kit and the backend contract into one import.

`lodash` and `lodash-es` are the same full build on both sides, including `lodash/<fn>` as that function's default export. The root import stays the shared file. A subpath such as `lodash/get` is compiled into that app. `motion` and `motion/react` stay external. Authors type those specifiers. The kit does not re-export lodash.

The allowlist is one Host table. The UI compiler, the backend loader, and the vendor file route read it. Adding a platform library is one row in that table plus the matching served file.

## Implementation


Role: definition for the allowlist types, provider for enforcement. One Host table, `platformModules`. Authors import `defineApp` from `@mohou/contract`. Reload and the backend loader both call `importDecision`. Escape is decided from the importing file, so `../shared` from `api/` stays inside the app. A UI-only module on the backend is `import-forbidden`, not an install hint. A Node built-in is allowed on the backend and forbidden in the UI and in `shared`. A missing installed library still names `mini_app_install`. The vendor route is mounted. Adding a platform library is one row, including its served file. The iframe import map is derived from those rows. A second table is a defect. Plan: [implementation.md](../implementation.md).
