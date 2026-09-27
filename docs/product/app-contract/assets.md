---
status: shape-locked
progress: settled
updated: 2026-09-21
---

# App assets

Layer: [App contract](README.md). Index: [features.md](../features.md).

- Owner: App contract for the tree and the call. Host serves the file. The host wrapper exposes `useApp().resolveAssetUrl`.
- Input: `useApp().resolveAssetUrl(path)`. `path` is relative to the app directory and names a file under `assets/`. `./assets/landing-img.png` and `assets/landing-img.png` are the same path. Nested folders are allowed. The UI is the only caller.
- Output: a URL string for that file on this app. The iframe loads the original bytes. The function does not read the disk. A missing file still returns a URL; the GET is 404.
- Failure: a path that is not under `assets/`, that leaves the app, that is absolute, or whose extension is not `png`, `jpg`, `jpeg`, `gif`, `webp`, or `svg` throws `asset-invalid`. Callers match the code. A GET whose real path leaves `assets/` is 404. Importing the file is `import-forbidden`. Codes: [implementation.md](../implementation.md).
- Non-goals: a second copy of the UI kit illustrations; a file from outside the app directory; inlining the file into the UI bundle; a directory listing; the backend reading these files.

The tree is `assets/` inside the app directory. [Directory and entries](directory.md) lists it. Authors put the URL on an `img` or a `style`. They do not import the file.

## Implementation

Role: definition for the tree name. Host admits the path, serves `GET /api/app/:appId/assets/*`, and the wrapper maps `resolveAssetUrl` onto that route. `admitAssetRef` is the named resolve. The GET `realpath`s the file and refuses a link that leaves `assets/`. Plan: [implementation.md](../implementation.md).
