---
status: shape-locked
progress: settled
updated: 2026-10-01
---

# Platform files served to the iframe

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host.
- Output: `/mma/runtime.js` (React), `/mma/sdk.js` (UI kit and `useApp`), `/mma/vendors/lodash.js`, `/mma/vendors/motion.js`. These are UI vendor files for the iframe. The bytes live in the host package and are built when that package is packed, not on request. The backend does not load them. Motion's React binding points at the platform runtime, so the kit and the app use one React and one motion. `react-dom` and `react-dom/client` use that same file, so `flushSync` runs on the renderer that mounted the app. `lodash` and `lodash-es` are one vendor file. A subpath such as `lodash/get` is compiled into the app bundle.
- Failure: an unknown vendor id is 404. A vendor requested from the wrong side fails at compile or load with the allowlist reason.
- Non-goals: one concatenated vendor file; tree-shaking the vendor against the current app; a second React inside an on-demand editor.

## Implementation


Role: provider. One runtime, one kit, one UI vendor file per served id. The names live on `platformLayout`. Each served specifier is a `file` on its `platformModules` row. A `/*` row with `bundle` is not a vendor file. `react/jsx-runtime` uses the runtime file because the compiler emits that specifier and an import map has no prefix match. `platformImportMap` is that projection. The kit specifier is `@mohou/ui`. `/mma/sdk.js` is its served file and an import-map row. `buildVendorFiles` writes one artifact per distinct `file` into the host package `vendor/` directory. The runtime file also exports `createRoot` and `flushSync` so the runner and the kit do not load a second React or a second renderer. Host start builds a missing artifact once, before listen. A request never builds. The vendor route is mounted. An unknown id is 404. An unknown vendor id is 404. No second React. Plan: [implementation.md](../implementation.md).
