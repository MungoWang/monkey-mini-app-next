# Agent Note: App assets

Status: implemented

## Problem

A workbench needs a picture in its UI. The app directory has no place for an image or an SVG, and the iframe has no way to show one. The UI kit illustrations are a different set. They are not the app's files.

## Decision

The tree is `assets/` in the app directory. The UI calls `useApp().resolveAssetUrl` with a path under that tree. Host serves the original file on `GET /api/app/:appId/assets/*`. The backend does not read these files. Importing them is `import-forbidden`.

## Alternatives considered

- Inline the picture as a data URL in `ui.tsx`. The source file becomes the asset. Rejected.
- Import the file into the UI bundle. A large image would sit in `.autogen/entry.js`. Rejected.
- Reuse a UI kit illustration. Those assets are not the app's files, and they follow `--primary-svg-color`. Rejected.
- Let the author spell the Host path. That leaks the route table into the app. Rejected.

## Consequences

One GET loads one file. A missing file is 404 at that GET. `resolveAssetUrl` does not look at the disk. A path that is not under `assets/` throws `asset-invalid` before a URL is built.
